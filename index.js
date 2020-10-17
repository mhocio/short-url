const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const yup = require('yup');
const monk =  require('monk');
const { nanoid } = require('nanoid');

require('dotenv').config();

const db = monk(process.env.MONGODB_URI);
const urls = db.get('urls');
//urls.createIndex('slug');
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

// app.get('/url/:id', (req, res) => {
//     // TODO: get a short url by id
// });

app.get('/:id', async (req, res) => {
    const { id:slug } = req.params;
    try {
        const url = await urls.findOne({ slug });
        if (url) {
            res.redirect(url.url);
        }
        res.redirect(`/?error=${slug} not found`);
    } catch (error) {
        res.redirect(`/?error=Link not found`);
    }
});

const urlSchema = yup.object().shape({
    url: yup.string().trim().url().required(),
});

const slugSchema = yup.object().shape({
    slug: yup.string().trim().matches(/[\w\-]/i),
});

app.post('/url', async (req, res, next) => {
    let { slug, url } = req.body;
    try {
        await urlSchema.validate({ url });

        if (!slug || slug == '') {
            slug = nanoid(5);
        } 
        //else 
        // {
        //     const existing = await urls.findOne({ slug });
        //     if (existing)
        //         throw new Error('Slug in use.')
        // }
        slug = slug.toLowerCase();
        await slugSchema.validate({ slug });
        const newUrl = {
            url,
            slug
        }
        const createdUrl = await urls.insert(newUrl);
        delete createdUrl._id;
        res.json(createdUrl);
    } catch (error) {
        if (error.message.startsWith('E11000')) {
            error.message = 'Slug in use.'
        }
        next(error);
    }
});

app.use((error, req, res, next) => {
    if (error.status)
        res.status(error.status);
    else
        res.status(500);
    
    res.json({
        message: error.message,
        stack: process.env.NODE_ENV === 'production' ? 'e' : error.stack,
    })
})

const port = process.env.PORT || 7777;
app.listen(port, () => {
    console.log(`Listening at http://localhost:${port}`);
})