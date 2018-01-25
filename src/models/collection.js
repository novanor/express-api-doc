module.exports = class Collection {
    constructor(
        name = '',
        description = '',
        schema = 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
        postmanId = ''
    ) {
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
