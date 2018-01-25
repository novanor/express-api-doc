const fs = require('fs');

const getContent = (path) => {
    if (!fs.existsSync(path)) {
        return [];
    }

    const content = fs.readFileSync(path).toString();

    return content.length ? JSON.parse(content) : [];
};

const addItemAsync = (path, el) => {
    return new Promise((resolve, reject) => {
        try {
            const elements = getContent(path);

            elements.push(el);
            fs.writeFileSync(path, JSON.stringify(elements, null, 2));

            resolve('Element added');
        } catch (err) {
            reject(err);
        }
    });
};

module.exports = {
    getContent,
    addItemAsync,
};
