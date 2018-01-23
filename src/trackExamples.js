const {addExampleToFile} = require('./utils/examples');

// Enable tracking of examples for the apidoc
module.exports = function trackExamples(app, config) {
    // TODO: track only req/res pairs that have different parameter pairs
    // Do this to avoid cluttering the examples with similar content
    app.use('/*', (req, res, next) => {
        const originalSend = res.send;
        res.send = function (body, ...args) {
            try {
                const responseHeaders = {};

                if (config.skip && config.skip.indexOf(req.originalUrl) > 0) {
                    throw 'Skipping path';
                }

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
                    .then(success => console.info('\x1b[32m%s\x1b[39m', success))
                    .catch(err => { throw err; });
            } catch (err) {
                console.info('\x1b[31m%s\x1b[39m%s', 'Example not recorded: ', err);
            }

            originalSend.call(this, body, ...args);
        };
        next();
    });
};
