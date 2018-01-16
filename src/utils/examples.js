const fs = require('fs');

const getExamples = (examplesPath) => {
    const examples = fs.readFileSync(examplesPath).toString();

    return examples.length ? JSON.parse(examples) : [];
};

const addExampleToFile = (examplesPath, example) => {
    return new Promise((resolve, reject) => {
        try {
            const examples = getExamples(examplesPath);

            examples.push(example);
            fs.writeFileSync(examplesPath, JSON.stringify(examples, null, 2));

            resolve('Example added');
        } catch (err) {
            reject(err);
        }
    });
};

module.exports = {
    getExamples,
    addExampleToFile,
};
