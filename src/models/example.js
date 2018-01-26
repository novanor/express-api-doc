const uuid = require('uuid/v4');
const {getPathParts} = require('../utils/url');
const objectToKeyValueArray = require('../utils/objectToKeyValueArray');

module.exports = class Example {
    constructor() {
        this.id = uuid();

        return this;
    }

    static fromTrackerExample(trackerExample) {
        const example = new Example();
        example.name = `${trackerExample.status} Example`;
        example.originalRequest = {
            method: trackerExample.method,
            header: objectToKeyValueArray(trackerExample.request.headers),
            body: {
                mode: 'raw',
                raw: JSON.stringify(trackerExample.request.body),
            },
            url: {
                path: getPathParts(trackerExample.url),
            },
        };
        example.header = objectToKeyValueArray(trackerExample.response.headers);
        example.body = JSON.stringify(trackerExample.response.body);

        example.code = trackerExample.status;

        return example;
    }

    getPostmanObject() {
        return {
            id: this.id,
            name: this.name,
            originalRequest: this.originalRequest,
            code: this.code,
            header: this.header,
            body: this.body,

            _postman_previewlanguage: 'json',
            _postman_previewtype: 'text',
        };
    }
};

/* eslint-disable comma-dangle, no-unused-vars */
const postmanExample = {
    id: '1e27c6bc-0209-4693-9575-8d52a54e5e97',
    name: 'An example for obtaining Bearer token',
    originalRequest: {
        method: 'POST',
        header: [
            {
                key: 'Content-Type',
                value: 'application/json',
            }, {}, {}, {},
        ],
        body: {
            mode: 'raw',
            raw: {
                token: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE1MTQ5Nzk5MTAsImV4cCI6MzMwNDAzNTI3MTAsInVzZXJJZCI6MTgzMiwiYnJhbmQiOiJjaXZpbCIsInJlZnJlc2giOnRydWV9.krTpOHUHo72kcRu3IGgLIP9KJr29j05nTLH5Kwx7tCU',
            },
        },
        url: {
            raw: 'localhost:8080/css-api/auth/resume',
            host: ['localhost'],
            port: '8080',
            path: ['css-api', 'auth', 'resume'],
        },
    },
    status: 'OK',
    code: 200,
    _postman_previewlanguage: 'json',
    _postman_previewtype: 'text',
    header: [
        {
            key: 'Connection',
            value: 'keep-alive',
            name: 'Connection',
            description: 'Options that are desired for the connection',
        }, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {},
    ],
    cookie: [],
    responseTime: 153,
    body: `{' id ':1832,' fullname ':' marin express test ',' jobposition ':null,' phone ':' 0888 ',' avatar ':null,' access ':' 2018 - 01 - 03 13: 45: 06.296368 + 02 ',' language ':' bg ',' display_name ':' mandarin ',' oauth ':null,' uuid ':' {
        c55d6898 - e296 - d2a5 - c55d - 6898e296 d2a5
    }
    ',' email ':null,' password ':null,' email_verified ':false,' email_timestamp ':null,' registered_id ':null,' address ':null,' subscriptions ':[],' tickets ':[' 1012 ',' 1005 ',' 1004 ',' 1003 '],' tickets_archive ':[],' commented ':[],' commented_archive ':null,' android_push_ids ':[' dPjf2YpAih0: APA91bEK - om - hTcMwG3jwMVEgFAMDcV7b5EE1hUpMpfyS2hopED - TCHYBLC4fLHBy3SMwZGa0x40e93OPfAke2_r1uHe1Om85p3a8coefqfq0DSDqEtbCuKJX13855xQrvzifcjw0 - 1 b '],' ios_push_ids ':[]}`,
};


const trackerExample = {
    'url': '/',
    'method': 'GET',
    'request': {
        'headers': {
            'host': 'localhost',
            'x-real-ip': '172.18.0.1',
            'x-forwarded-for': '172.18.0.1',
            'x-forwarded-proto': 'https',
            'connection': 'close',
            'cache-control': 'no-cache',
            'postman-token': '00e43597-347a-4706-8963-5eea9fa62bfc',
            'user-agent': 'PostmanRuntime/7.1.1',
            'accept': '*/*',
            'accept-encoding': 'gzip, deflate'
        },
        'body': {}
    },
    'status': 200,
    'type': 'application/json; charset=utf-8',
    'response': {
        'headers': {
            'x-powered-by': 'Express',
            'access-control-allow-origin': '*',
            'access-control-allow-credentials': 'true',
            'access-control-allow-methods': 'GET, POST, OPTIONS, PUT, PATCH, DELETE',
            'access-control-allow-headers': 'Authorization, X-Token, DNT, Keep-Alive, User-Agent, X-Requested-With, If-Modified-Since, Cache-Control, Content-Type, X-Brand',
            'access-control-expose-headers': 'X-Token, X-Refresh-Token',
            'content-type': 'application/json; charset=utf-8'
        },
        'body': {
            'message': 'It works!'
        }
    },
    'id': '1'
};
