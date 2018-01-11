'use strict';
const _ = require('lodash');
const csp = require('js-csp');
const fs = require('fs');
const path = require('path');

const templateSourcePath = `${__dirname}/template.html`;

const go = csp.go;
const take = csp.take;
const chan = csp.chan;
const putAsync = csp.putAsync;

class Docks {
    constructor(app) {
        this.app = app;
    }

    static clearFile(pathToFile) {
        const clearStream = fs.createWriteStream(pathToFile, {flags: 'w'});
        clearStream.write('');
        clearStream.end();
    }

    track(config = {}) {
        this.writeChannel = chan();
        const examplesPath = config.paths.apidoc;
        const self = this;

        this.writeToFile(examplesPath);

        this.app.use('/*', (req, res, next) => {
            const originalSend = res.send;
            res.send = function(body, ...args) {
                !self.writeChannel.closed && putAsync(self.writeChannel, {
                    url: req.originalUrl,
                    method: req.method,
                    request: req.body,
                    status: res.statusCode,
                    type: res.get('Content-Type'),
                    response: JSON.parse(body)
                });
                originalSend.call(this, body, ...args);
            };
            next();
        });
    }

    writeToFile(examplesPath) {
        const self = this;
        go(function* () {
            while (!self.writeChannel.closed) {
                const data = yield take(self.writeChannel);
                yield new Promise((res, rej) => {
                    fs.appendFile(examplesPath, `${JSON.stringify(data, null, 2)},`, (err) => {
                        if (err) {
                            return rej(err);
                        }
                        return res();
                    });
                }).catch((err) => {
                    throw err;
                });
            }
        });
    }

    getNestedRoutes(middleware, stack) {
        const routes = [];

        _.each(stack, (handler) => {
            if (handler.handle.stack) {
                const nested = this.getNestedRoutes(handler, handler.handle.stack);
                _.each(nested, (route) => {
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
        _.each(this.app._router.stack, (middleware) => {
            if (middleware.route) {
                routes.push({
                    path: middleware.route.path,
                    methods: middleware.route.methods,
                    prefixRegexp: middleware.regexp,
                    prefix: middleware.regexp.source.replace(/\\|\^|\?|=|\||\$|\(.*\)|\+/ig, '')
                });
            } else if (middleware.name === 'router') {

                var nested = this.getNestedRoutes(middleware, middleware.handle.stack);
                _.each(nested, (route) => {
                    routes.push(route);
                });
            }
        });

        return routes;
    }

    static getExamples(examplesPath) {
        let examples = fs.readFileSync(examplesPath);
        examples = examples.toString();
        examples = examples.substring(0, examples.length - 1);
        examples = `[${examples}]`;
        return JSON.parse(examples);
    }

    generate(config = {}) {
        const examplesSource = config.paths.examples
            ? Docks.getExamples(config.paths.examples)
            : '';
        const routes = this.getAllRoutes();
        const examples = [];
        _.each(routes, (route) => {
            route.id = _.uniqueId();
            route.params = _.map((route.path.match(/\/:([^/]+)/ig)), (routePath) => routePath.replace('/:', ''));
            const routeRegexpString = `${route.path.replace(/\//ig, '\\/').replace(/\/:([^/]+)/ig, '/[^\\/]+')}(?:\\?.*)?$`;
            const routeRegexp = new RegExp(routeRegexpString);
            route.regexp = routeRegexp.toString();
            const prefixRegexp = new RegExp(route.prefixRegexp);
            const examplesForRoute = _.filter(examplesSource, (example) => {
                const currentRouteRegexp = new RegExp(prefixRegexp.source + routeRegexp.source);
                return currentRouteRegexp.test(example.url) && route.methods[_.lowerCase(example.method)];
            });
            route.examplesPresent = !_.isEmpty(examplesForRoute);
            _.each(examplesForRoute, (e) => {
                e.id = _.uniqueId();
            });
            examples.push({routeId: route.id, rows: examplesForRoute});
            route.prefixRegexp = prefixRegexp.toString();
        });
        let template = config.paths.template
            ? fs.readFileSync(path.resolve(config.paths.template))
            : fs.readFileSync(templateSourcePath);
        template = template.toString();
        template = template.replace("'{{ROUTES}}'", JSON.stringify(routes, null, 2));
        template = template.replace("'{{EXAMPLES}}'", JSON.stringify(examples, null, 2));
        template = template.replace("'{{TITLE}}'", JSON.stringify(config.meta.title, null, 2));
        template = template.replace("'{{DESCRIPTION}}'", JSON.stringify(config.meta.title, null, 2));
        template = template.replace("'{{CONFIG}}'", JSON.stringify(config, null, 2));
        fs.writeFileSync(path.resolve(config.paths.apidoc || 'public/template.html'), template);
        if (examplesSource) {
            const examplesPath = path.resolve(config.paths.examples) || path.resolve('public/examples.txt');
            Docks.clearFile(examplesPath);
        }
        process.exit(0); // eslint-disable-line no-process-exit
    }
}

module.exports = Docks;
