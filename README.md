# short-url

Link to the application: http://1aa.xyz

node.js application with a connected MongoDB to shorten your URL

# How to run locally
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

<img alt="GitHub Workflow Status" src="https://img.shields.io/github/workflow/status/mhocio/short-url/Node.js%20CI?style=flat-square"> <img alt="Website" src="https://img.shields.io/website?style=flat-square&url=http%3A%2F%2F1aa.xyz">
