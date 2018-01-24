module.exports = class Collection {
    constructor(name = '', postmanId = '', description = '', schema = '') {
        this.info = {
            name,
            _postman_id: postmanId,
            description,
            schema,
        };
        this.items = [];

        return this;
    }

    addItem(item) {
        this.items.push(item);

        return this;
    }

    getPostmanObject() {
        return {
            info: this.info,
            item: this.items.map(item => item.getPostmanObject()),
        };
    }
};
