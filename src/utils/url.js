module.exports = {
    getPathParts(path) {
        const parts = path.split('/').filter(part => part.length > 0);

        return parts.length ? parts : [''];
    },
};
