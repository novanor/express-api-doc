const fs = require('fs');
const JsonFile = require('./utils/jsonFile');
const {
    Collection,
    // Folder,
    Route,
    Request,
    Example,
} = require('./models');

module.exports = class ApiDocGenerator {
    constructor(app) {
        this.app = app;
    }

    generate(config) {
        const examples = JsonFile.getContent(config.paths.examples);

        const routes = this.getAllRoutes(config.skip).map((route, index) => ({
            ...route,
            id: (index + 1).toString(),
            params: this.extractParamsFromPath(route.path),
            meta: this.getRouteMeta(this.app, route),
        }));

        const examplesByRoute = this.getExamplesByRoute(examples, routes);

        return fs.readFileSync(config.paths.template)
            .toString()
            .replace("'{{ROUTES}}'", JSON.stringify(routes, null, 2))
            .replace("'{{EXAMPLES}}'", JSON.stringify(examplesByRoute, null, 2))
            .replace("'{{TITLE}}'", JSON.stringify(config.meta.title, null, 2))
            .replace("'{{DESCRIPTION}}'", JSON.stringify(config.meta.title, null, 2))
            .replace("'{{CONFIG}}'", JSON.stringify(config, null, 2));
    }

    // TODO: Think of a way to automatically group routes in folders
    getJsonForPostmanImport(config) {
        const examples = JsonFile.getContent(config.paths.examples);
        const routes = this.putExamplesAndMetaInRoutes(examples, this.getAllRoutes(config.skip));

        const collection = new Collection(
            config.meta.title,
            config.meta.description ? config.meta.description.replace('\n', '') : '',
            config.postmanCollectionId,
        );

        routes.forEach(r => {
            const body = {};
            let routeDescription = r.meta.description ? r.meta.description : '';

            // Construct a body using the documented keys and empty values
            if (r.meta.bodyParams) {
                routeDescription = routeDescription.concat('<br><br>**Body params**');

                Object.keys(r.meta.bodyParams).forEach(key => {
                    body[key] = '';
                    routeDescription = routeDescription.concat(`<br>\`${key}\` - ${r.meta.bodyParams[key]}`);
                });
            }

            const request = new Request(
                r.method,
                r.path,
                routeDescription || '',
                r.meta.headerParams ? r.meta.headerParams : {},
                body,
            );

            const route = new Route(
                r.path,
                request,
            );

            r.examples.forEach(example => {
                route.addExample(Example.fromTrackerExample(example));
            });

            collection.addItem(route);
        });

        return JSON.stringify(collection.getPostmanObject(), null, 2);
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

    getAllRoutes(skipRoutes) {
        const routes = [];
        let nested = [];

        this.app._router.stack.forEach(middleware => { // eslint-disable-line no-underscore-dangle
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

        return skipRoutes && skipRoutes.length
            ? routes.filter(route => skipRoutes.indexOf(route.path) < 0)
            : routes;
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

            // eslint-disable-next-line no-param-reassign
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

    putExamplesAndMetaInRoutes(examples, routes) {
        return routes.map(route => {
            const examplesForRoute = examples.filter((example) => {
                return this.exampleIsForRoute(example, route)
                       && route.method === example.method.toLowerCase();
            });

            const meta = this.app.routesMeta[route.path]
                && this.app.routesMeta[route.path][route.method]
                ? this.app.routesMeta[route.path][route.method]
                : {};

            return {
                ...route,
                examples: examplesForRoute,
                meta,
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
