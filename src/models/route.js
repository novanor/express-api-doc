module.exports = class Route {
    constructor(name = '', request = {}) {
        this.name = name;
        this.request = request;
        this.examples = [];

        return this;
    }

    addExample(example) {
        this.examples.push(example);

        return this;
    }

    getPostmanObject() {
        return {
            name: this.name,
            request: this.request.getPostmanObject(),
            response: this.examples.map(example => example.getPostmanObject()),
        };
    }
};
