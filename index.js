const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const yup = require('yup');
const monk =  require('monk');
const { nanoid } = require('nanoid');

require('dotenv').config();

// Database (monk) - single collection `urls` used across the app.
// Expect MONGODB_URI in .env (see README.md).
const db = monk(process.env.MONGODB_URI); // e.g., 'mongodb://localhost:27017/mydb'
const urls = db.get('urls');
// Ensure unique index on `slug` (used to detect duplicate slugs).
urls.createIndex({ slug: 1 }, { unique: true });

const app = express();

//app.use(helmet());
//app.use(helmet.contentSecurityPolicy());

app.use(helmet.dnsPrefetchControl());
app.use(helmet.expectCt());
app.use(helmet.frameguard());
app.use(helmet.hidePoweredBy());
app.use(helmet.hsts());
app.use(helmet.ieNoOpen());
app.use(helmet.noSniff());
app.use(helmet.permittedCrossDomainPolicies());
app.use(helmet.referrerPolicy());
app.use(helmet.xssFilter());

app.use(morgan('tiny'));
app.use(cors());
app.use(express.json());
app.use(express.static('./public'));

// Redirect route: lookup by slug and redirect to the stored URL.
// Also increments a simple `clicks` counter.
app.get('/:id', async (req, res) => {
    const { id: slug } = req.params;
    try {
        const url = await urls.findOne({ slug });
        if (url) {
            // Use async update (avoid callback) and tolerate missing clicks.
            await urls.update({ _id: url._id }, { $set: { clicks: (url.clicks || 0) + 1 } });
            return res.redirect(url.url);
        }
        // Not found -> redirect user to UI with error query (UI displays it).
        return res.redirect(`/?error=${encodeURIComponent(slug + ' not found')}`);
    } catch (error) {
        // Unexpected errors: respond with 500 and a short message.
        return res.status(500).send(error.message);
    }
});

const urlSchema = yup.object().shape({
    url: yup.string().trim().url().required(),
});

// Slug must be one or more alphanumeric/underscore/dash characters.
const slugSchema = yup.object().shape({
    slug: yup.string().trim().matches(/^[\w\-]+$/i),
});

app.post('/url', async (req, res, next) => {
    let { slug, url } = req.body;
    try {
        await urlSchema.validate({ url });

        if (!slug || slug == '') {
            slug = nanoid(5);
        } 
        slug = slug.toLowerCase();
        await slugSchema.validate({ slug });
        const newUrl = {
            url,
            slug,
            clicks: 0
        }
        const createdUrl = await urls.insert(newUrl);
        delete createdUrl._id;
        res.json(createdUrl);
    } catch (error) {
        // Validation errors from yup -> 400 Bad Request
        if (error.name === 'ValidationError') {
            error.status = 400;
        }

        // Duplicate key error from Mongo/monk -> 409 Conflict
        // Mongo messages sometimes include 'E11000' or set `code === 11000`.
        if (error && (error.message && error.message.indexOf('E11000') !== -1 || error.code === 11000)) {
            error.message = 'Slug in use.';
            error.status = 409;
        }

        next(error);
    }
});

app.use((error, req, res, next) => {
    // Set status (default 500)
    res.status(error.status || 500);

    // Return JSON error body. Avoid leaking stack in production.
    res.json({
        message: error.message,
        stack: process.env.NODE_ENV === 'production' ? undefined : error.stack,
    });
})

const port = process.env.PORT || 7777;
app.listen(port, () => {
    console.log(`Listening at http://localhost:${port}`);
})