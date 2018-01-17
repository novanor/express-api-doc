const {addExampleToFile} = require('./utils/examples');

// Enable tracking of examples for the apidoc
module.exports = function trackExamples(app, config) {
    // TODO: track only req/res pairs that have different parameter pairs
    // Do this to avoid cluttering the examples with similar content
    app.use('/*', (req, res, next) => {
        const originalSend = res.send;
        res.send = function (body, ...args) {
            const example = {
                url: req.originalUrl,
                method: req.method,
                request: req.body,
                status: res.statusCode,
                type: res.get('Content-Type'),
                response: JSON.parse(body),
            };

            addExampleToFile(config.path, example)
                .then(success => console.log(success)) // eslint-disable-line no-console
                .catch(err => console.log(err)); // eslint-disable-line no-console

            originalSend.call(this, body, ...args);
        };
        next();
    });
};
