const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helet = require('helmet');

const app = express();

app.use(helet());
app.use(morgan('tiny'));
app.use(cors());
app.use(express.json());

app.use(express.static('./public'));

app.get('/url/:id', (req, res) => {
    // TODO: get a short url by id
});

app.get('/:id', (req, res) => {
    // TODO: redirect to the URL
});

app.post('/url', (req, res) => {
    // TODO: create a short URL
});

const port = process.env.port || 7777;
app.listen(port, () => {
    console.log(`Listening at http://localhost:${port}`);
})