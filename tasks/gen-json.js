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
        .then((jsonObj_1) => {
            fs.readFile(jsonFilePath, 'utf8', (err, jsonString_2) => {
                const jsonObj_2 = JSON.parse(jsonString_2);
                const jsonObj = jsonObj_1.concat(jsonObj_2);
                const jsonString = JSON.stringify(jsonObj, null, 2)
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
