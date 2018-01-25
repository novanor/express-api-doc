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
            route.meta = this.getRouteMeta(this.app, route);
        });

        examplesByRoute = this.getExamplesByRoute(examples, routes);

        return fs.readFileSync(config.paths.template)
            .toString()
            .replace("'{{ROUTES}}'", JSON.stringify(routes, null, 2))
            .replace("'{{EXAMPLES}}'", JSON.stringify(examplesByRoute, null, 2))
            .replace("'{{TITLE}}'", JSON.stringify(config.meta.title, null, 2))
            .replace("'{{DESCRIPTION}}'", JSON.stringify(config.meta.title, null, 2))
            .replace("'{{CONFIG}}'", JSON.stringify(config, null, 2));
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
                this.getRouteMethods(route).forEach(method => {
                    routes.push({
                        path: route.path,
                        method,
                        prefixRegexp: middleware.regexp,
                        prefix: middleware.regexp.source.replace(/\\|\^|\?|=|\||\$|\(.*\)|\+/ig, ''),
                    });
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
                this.getRouteMethods(middleware.route).forEach(method => {
                    routes.push({
                        path: middleware.route.path,
                        method,
                        prefixRegexp: middleware.regexp,
                        prefix: middleware.regexp.source.replace(/\\|\^|\?|=|\||\$|\(.*\)|\+/ig, ''),
                    });
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

    getRouteMethods(route) {
        const methods = [];

        if (route.methods) {
            Object.keys(route.methods).forEach(method => {
                if (Object.hasOwnProperty.call(route.methods, method)) {
                    methods.push(method);
                }
            });
        }

        return methods;
    }

    getExamplesByRoute(examples, routes) {
        return routes.map(route => {
            const examplesForRoute = examples.filter((example) => {
                return this.exampleIsForRoute(example, route)
                       && route.method === example.method.toLowerCase();
            });

            route.examplesPresent = !!examplesForRoute.length;

            examplesForRoute.forEach((e, index) => {
                e.id = (index + 1).toString();
            });

            return {
                routeId: route.id,
                rows: examplesForRoute,
            };
        });
    }

    putExamplesInRoutes(examples, routes) {
        return routes.map(route => {
            const examplesForRoute = examples.filter((example) => {
                return this.exampleIsForRoute(example, route)
                       && route.method === example.method.toLowerCase();
            });

            return {
                ...route,
                examples: examplesForRoute,
            };
        });
    }

    exampleIsForRoute(example, route) {
        const routeRegexpString = `${route.path.replace(/\//ig, '\\/').replace(/\/:([^/]+)/ig, '/[^\\/]+')}(?:\\?.*)?$`;
        return example.url.match(routeRegexpString);
    }

    extractParamsFromPath(path) {
        const params = path.match(/\/:([^/]+)/g);

        return params ? params.map(param => param.replace('/:', '')) : [];
    }

    getRouteMeta(app, route) {
        const {routesMeta} = app;

        return routesMeta[route.path] && routesMeta[route.path][route.method]
            ? routesMeta[route.path][route.method]
            : {};
    }
};
