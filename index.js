'use strict';
const fs = require('fs');

class Docks {
    constructor(app) {
        this.app = app;
    }

    track(config) {
        const _this = this;

        this.app.use('/*', (req, res, next) => {
            const originalSend = res.send;
            res.send = function(body, ...args) {
                // TODO: remember to remove console.log
                console.log(body);
                let example = {
                    url: req.originalUrl,
                    method: req.method,
                    request: req.body,
                    status: res.statusCode,
                    type: res.get('Content-Type'),
                    response: JSON.parse(body),
                };

                _this.addExampleToFile(config.path, example)
                    .then(success => console.log(success))
                    .catch(err => console.log(err));

                originalSend.call(this, body, ...args);
            };
            next();
        });
    }

    generate(config) {
        const routes = this.getAllRoutes();
        const examples = this.getExamples(config.paths.examples);
        var examplesByRoute = [];

        routes.forEach((route, index) => {
            route.id = (index+1).toString();
            route.params = this.extractParamsFromPath(route.path);
        });

        examplesByRoute = this.matchExamplesToRoutes(examples, routes);

        // Place all definitions in the template and write to apidoc file
        fs.writeFileSync(config.paths.apidoc, fs.readFileSync(config.paths.template)
            .toString()
            .replace("'{{ROUTES}}'", JSON.stringify(routes, null, 2))
            .replace("'{{EXAMPLES}}'", JSON.stringify(examplesByRoute, null, 2))
            .replace("'{{TITLE}}'", JSON.stringify(config.meta.title, null, 2))
            .replace("'{{DESCRIPTION}}'", JSON.stringify(config.meta.title, null, 2))
            .replace("'{{CONFIG}}'", JSON.stringify(config, null, 2))
        );

        // eslint-disable-line no-process-exit
        process.exit(0);
    }

    getExamples(examplesPath) {
        var examples = fs.readFileSync(examplesPath).toString();

        return examples.length ? JSON.parse(examples) : [];
    }

    addExampleToFile(examplesPath, example) {
        return new Promise((resolve, reject) => {
            try {
                let examples = this.getExamples(examplesPath);
                examples.push(example);

                fs.writeFileSync(examplesPath, JSON.stringify(examples, null, 2));

                resolve('Example added');
            } catch (err) {
                reject(err);
            }
        });
    }

    getNestedRoutes(middleware, stack) {
        const routes = [];

        stack.forEach(handler => {
            if (handler.handle.stack) {
                const nested = this.getNestedRoutes(handler, handler.handle.stack);
                nested.forEach(route => {
                    routes.push(route);
                })
            }

            const route = handler.route;
            route && routes.push({
                path: route.path,
                methods: route.methods,
                prefixRegexp: middleware.regexp,
                prefix: middleware.regexp.source.replace(/\\|\^|\?|=|\||\$|\(.*\)|\+/ig, '')
            });
        });

        return routes;
    }

    getAllRoutes() {
        const routes = [];
        this.app._router.stack.forEach(middleware => {
            if (middleware.route) {
                routes.push({
                    path: middleware.route.path,
                    methods: middleware.route.methods,
                    prefixRegexp: middleware.regexp,
                    prefix: middleware.regexp.source.replace(/\\|\^|\?|=|\||\$|\(.*\)|\+/ig, '')
                });
            } else if (middleware.name === 'router') {

                var nested = this.getNestedRoutes(middleware, middleware.handle.stack);
                nested.forEach(route => {
                    routes.push(route);
                });
            }
        });

        return routes;
    }

    matchExamplesToRoutes(examples, routes) {
        var examplesByRoute = [];

        routes.forEach((route, index) => {
            const routeRegexpString = `${route.path.replace(/\//ig, '\\/').replace(/\/:([^/]+)/ig, '/[^\\/]+')}(?:\\?.*)?$`;

            const examplesForRoute = examples.filter((example) => {
                return example.url.match(routeRegexpString) && route.methods[example.method.toLowerCase()];
            });

            route.examplesPresent = !!examplesForRoute.length;

            examplesForRoute.forEach((e, index) => {
                e.id = (index+1).toString();
            });

            examplesByRoute.push({
                routeId: route.id,
                rows: examplesForRoute
            });
        });

        return examplesByRoute;
    }

    extractParamsFromPath(path) {
        const params = path.match(/\/:([^/]+)/g);

        return params ? params.map(param => param.replace('/:', '')) : [];
    }
}

module.exports = Docks;
