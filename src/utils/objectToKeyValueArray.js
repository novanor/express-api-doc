module.exports = function objectToKeyValueArray(obj, keyName = 'key', valueName = 'value') {
    return !obj ? [] : Object
        .keys(obj)
        .filter(key => Object.hasOwnProperty.call(obj, key))
        .map(key => {
            const keyValue = {};
            keyValue[keyName] = key;
            keyValue[valueName] = obj[key];

            return keyValue;
        });
};
