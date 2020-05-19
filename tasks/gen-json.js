const csv = require('csvtojson');
const fs = require('fs');

module.exports = (pathToFixtures) => {
    const csvFilePath = pathToFixtures.concat('/hobbies/demonstration.csv');
    const jsonFilePath = pathToFixtures.concat('/hobbies/development.json');
    const outputFilePath = pathToFixtures.concat('/hobbies.json');
    if (process.env.NODE_ENV === "test") {
        fs.copyFile(jsonFilePath, outputFilePath, (error) => {
            if (error) {
                console.log("Something went wrong while copying in test environment");
                throw error;
            }
            console.log("/hobbies/development.json successfully copied to /hobbies.json");
        })
        return Promise.resolve();
    }
    return csv()
        .fromFile(csvFilePath)
        .then((jsonObjFirst) => {
            fs.readFile(jsonFilePath, 'utf8', (err, jsonStringSecond) => {
                const jsonObjSecond = JSON.parse(jsonStringSecond);
                const jsonObj = jsonObjFirst.concat(jsonObjSecond);
                const jsonString = JSON.stringify(jsonObj, null, 2);
                fs.writeFile(outputFilePath, jsonString, err => {
                    if (err) {
                        console.log('Error writing file', err)
                    } else {
                        console.log('Successfully wrote hobbies.json')
                    }
                })
            })
        })
}
