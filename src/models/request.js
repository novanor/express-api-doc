const {getPathParts} = require('../utils/url');
const objectToKeyValueArray = require('../utils/objectToKeyValueArray');

module.exports = class Request {
    constructor(method = '', path = '', description = '', headers = {}, body = '', bodyType = 'raw', contentType = 'application/json') {
        this.method = method;
        this.description = description;
        this.body = this.getBody(bodyType, contentType, body);
        this.url = {
            raw: '',
            host: [],
            port: '',
            path: getPathParts(path),
        };
        this.headers = objectToKeyValueArray(headers, 'key', 'description').map(header => {
            return {
                key: header.key,
                value: '',
                description: header.description,
            };
        });

        return this;
    }

    getBody(bodyType, contentType, body) {
        switch (bodyType) {
            case 'raw':
                switch (contentType) {
                    case 'application/json':
                        return {
                            mode: 'raw',
                            raw: JSON.stringify(body),
                        };
                    default:
                        return {};
                }
            default:
                return {};
        }
    }

    getPostmanObject() {
        return {
            method: this.method,
            description: this.description,
            body: this.body,
            header: this.headers,
            url: this.url,
        };
    }
};
