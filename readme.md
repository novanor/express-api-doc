# Auto generated express documentation
This module is used to autogenerate API documentation for Node Express projects.

**It can:**
 * generate API documentation as a single HTML page;
 * be used as middleware in express to monkeypatch all API calls and log the req/res pairs for examples on the documentation.

### To create documentation:
**1. Put this code in a `generateApiDoc.js` file in your project:**
```javascript
// Import your express app
const app = require('../../index');
const ExpressApiDoc = require('express-api-doc');

const config = {
    // baseUrl: '',
    meta: {
        // Title and description are inserted 'as is' in the template, so you can
        // use simple HTML and bootstrap classes to format them.
        title: 'Citizen Support API',
        'description': 'This is a REST API that is used for ...',
    },
    paths: {
        // The singlefile apidoc you can load in a browser
        apidoc: './public/apidoc/index.html',
        // The template used to generate the output
        template: './public/apidoc/template/template.html',
        // The examples file that is written by ExpressApiDoc.track()
        examples: './public/apidoc/examples/examples.json',
    },
};

const expressApiDoc = new ExpressApiDoc(app);
expressApiDoc.generate(config);

// eslint-disable-next-line no-console
console.log('\nDocumentation created successfully.');
```
**2. Run as a script from console:**
```bash
$ node generateApiDoc.js
```
**3. Serve the created apidoc, e.g. through your express app:**
```javascript
const path = require('path');

module.exports = function (app) {
    app.get('/apiDoc', (req, res) => {
        res.sendFile(path.join(**dirname, '../public/apidoc', 'index.html'));
    });
};
```

### Template
The `generate()` function uses the template generated by this project - [express-api-doc-template](https://github.com/forestlake/express-api-doc-template)

### To track requests and responses:
You can use the `track()` function to track all API calls and write to a file the req/res pairs. These pairs are then used by the `generate()` function to show example API calls in the apidoc.

This is especially convenient if you have coverage tests.

**NOTE: this function monkeypatches `res.send()` so to make it work you have to include it before any route definitions in your app.**
```javascript
const ExpressApiDoc = require('express-api-doc');
...
const app = express();
...
const expressApiDoc = new ExpressApiDoc(app);
expressApiDoc.track({
    // Make sure this is the same as in generateApiDoc config
    path: './public/apidoc/examples/examples.json',
});

// All other route definitions/declarations come after this
...
```
**To stop the tracking, just comment out the code**

### Preview of list of available routes:
![list](https://github.com/forestlake/express-api-doc/blob/master/images/list.jpg?raw=true)
### Preview of sendbox with example:
![sendbox](https://github.com/forestlake/express-api-doc/blob/master/images/sendbox.jpg?raw=true)
