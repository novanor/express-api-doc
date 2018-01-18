const {addExampleToFile} = require('./utils/examples');

// Enable tracking of examples for the apidoc
module.exports = function trackExamples(app, config) {
    // TODO: track only req/res pairs that have different parameter pairs
    // Do this to avoid cluttering the examples with similar content
    app.use('/*', (req, res, next) => {
        const originalSend = res.send;
        res.send = function (body, ...args) {
            const responseHeaders = {};
            res.getHeaderNames().forEach(header => {
                responseHeaders[header] = res.get(header);
            });

            const example = {
                url: req.originalUrl,
                method: req.method,
                request: {
                    headers: req.headers,
                    body: req.body,
                },
                status: res.statusCode,
                type: res.get('Content-Type'),
                response: {
                    headers: responseHeaders,
                    body: JSON.parse(body),
                },
            };

            addExampleToFile(config.path, example)
                .then(success => console.log(success)) // eslint-disable-line no-console
                .catch(err => console.log(err)); // eslint-disable-line no-console

            originalSend.call(this, body, ...args);
        };
        next();
    });
};
