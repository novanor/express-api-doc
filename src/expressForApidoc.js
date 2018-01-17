const express = require('express');

// Monkey-patch the original express app to try extract route meta for apidoc
module.exports = function createApplication() {
    const app = express();

    app.originalGet = app.get;
    app.originalPost = app.post;
    app.originalPatch = app.patch;
    app.originalPut = app.put;
    app.originalDelete = app.delete;

    app.routesMeta = {};

    app.putInMeta = function (path, method, meta) {
        // The meta is structured first by path then by method
        if (!Object.prototype.hasOwnProperty.call(this.routesMeta, path)) {
            this.routesMeta[path] = {};
        }

        this.routesMeta[path][method] = meta;
    };

    app.extractMeta = function (method, args) {
        // The standard express implementation is app.METHOD(path, callback [, callback ...])
        // So we assume that if the last argument is an object it is a route description object
        if (args.length > 2 && typeof args[args.length - 1] === 'object') {
            const path = args[0];
            const meta = args.pop();

            this.putInMeta(path, method, meta);
        }

        return args;
    };

    /*
     * Override the original methods
     * Extract the route meta if present
     * Then call the original methods
     */
    app.get = function (...args) {
        const argsNoMeta = this.extractMeta('get', args);
        return this.originalGet(...argsNoMeta);
    };

    app.post = function (...args) {
        const argsNoMeta = this.extractMeta('post', args);
        return this.originalPost(...argsNoMeta);
    };

    app.put = function (...args) {
        const argsNoMeta = this.extractMeta('put', args);
        return this.originalPut(...argsNoMeta);
    };

    app.patch = function (...args) {
        const argsNoMeta = this.extractMeta('patch', args);
        return this.originalPatch(...argsNoMeta);
    };

    app.delete = function (...args) {
        const argsNoMeta = this.extractMeta('delete', args);
        return this.originalDelete(...argsNoMeta);
    };

    return app;
};
