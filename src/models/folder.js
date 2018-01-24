module.exports = class Folder {
    constructor(name = '', description = '') {
        this.name = name;
        this.description = description;
        this.items = [];
        this.events = [];

        return this;
    }

    addItem(item) {
        this.items.push(item);

        return this;
    }

    getPostmanObject() {
        return {
            name: this.name,
            description: this.description,
            item: this.items.map(item => item.getPostmanObject()),
            event: this.events.map(event => event.getPostmanObject()),
        };
    }
};
