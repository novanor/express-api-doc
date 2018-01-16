/* eslint-disable no-param-reassign, no-underscore-dangle, no-process-exit */
const fs = require('fs');
const {getExamples} = require('./utils/examples');

module.exports = class ApiDocGenerator {
    constructor(app) {
        this.app = app;
    }

    generate(config) {
        const routes = this.getAllRoutes();
        const examples = getExamples(config.paths.examples);
        let examplesByRoute = [];

        routes.forEach((route, index) => {
            route.id = (index + 1).toString();
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
            .replace("'{{CONFIG}}'", JSON.stringify(config, null, 2)));

        process.exit(0);
    }

    getNestedRoutes(middleware, stack) {
        const routes = [];

        stack.forEach(handler => {
            if (handler.handle.stack) {
                const nested = this.getNestedRoutes(handler, handler.handle.stack);
                nested.forEach(route => {
                    routes.push(route);
                });
            }

            const {route} = handler;

            if (route) {
                routes.push({
                    path: route.path,
                    methods: route.methods,
                    prefixRegexp: middleware.regexp,
                    prefix: middleware.regexp.source.replace(/\\|\^|\?|=|\||\$|\(.*\)|\+/ig, ''),
                });
            }
        });

        return routes;
    }

    getAllRoutes() {
        const routes = [];
        let nested = [];
        this.app._router.stack.forEach(middleware => {
            if (middleware.route) {
                routes.push({
                    path: middleware.route.path,
                    methods: middleware.route.methods,
                    prefixRegexp: middleware.regexp,
                    prefix: middleware.regexp.source.replace(/\\|\^|\?|=|\||\$|\(.*\)|\+/ig, ''),
                });
            } else if (middleware.name === 'router') {
                nested = this.getNestedRoutes(middleware, middleware.handle.stack);
                nested.forEach(route => {
                    routes.push(route);
                });
            }
        });

        return routes;
    }

    matchExamplesToRoutes(examples, routes) {
        const examplesByRoute = [];

        routes.forEach(route => {
            const routeRegexpString = `${route.path.replace(/\//ig, '\\/').replace(/\/:([^/]+)/ig, '/[^\\/]+')}(?:\\?.*)?$`;

            const examplesForRoute = examples.filter((example) => {
                return example.url.match(routeRegexpString)
                       && route.methods[example.method.toLowerCase()];
            });

            route.examplesPresent = !!examplesForRoute.length;

            examplesForRoute.forEach((e, index) => {
                e.id = (index + 1).toString();
            });

            examplesByRoute.push({
                routeId: route.id,
                rows: examplesForRoute,
            });
        });

        return examplesByRoute;
    }

    extractParamsFromPath(path) {
        const params = path.match(/\/:([^/]+)/g);

        return params ? params.map(param => param.replace('/:', '')) : [];
    }
};
