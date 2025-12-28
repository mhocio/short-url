# short-url

| Link to the application: https://z7z.pro | 
<img alt="demo" src="https://img.shields.io/website?style=flat-square&url=http%3A%2F%2Fz7z.pro"> | 
[![Node.js CI](https://github.com/mhocio/short-url/actions/workflows/node.js.yml/badge.svg)](https://github.com/mhocio/short-url/actions/workflows/node.js.yml) |

-----

Node.js application with a connected MongoDB to shorten your URL

## Todos
- Add `.env.example` and `.env.test.example` for local setup.
- Add rate limiting on `POST /url`.
- Make slug length and retry attempts configurable via env.
- Tighten CORS policy for production.
- Pin CDN assets with versioned URLs and SRI hashes.

## How to run locally
- Create MongoDB database, for example on cloud via https://mongodb.com or locally
- Create .env file
- Add ```MONGODB_URI=url_to_your_database``` to .env file
- Run below:
```sh
    $ npm run dev
```

## Testing
The project uses Jest for testing. Tests are located in `tests/` directory.

To run tests:
```sh
# Run tests once
npm test

# Run tests in watch mode (reruns on file changes)
npm run test:watch
```

Tests require MongoDB. By default, they use a test database at `mongodb://localhost:27017/shorturl_test`.
You can locally run it with `docker run --name mongodb-test -d -p 27017:27017 mongo:latest`
You can override this by setting `MONGODB_URI` environment variable.

