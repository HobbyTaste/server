#!/usr/bin/env node
const Fixtures = require('node-mongodb-fixtures');
const pathToFixtures = '../server/fixtures';
const generateHobbies = require('./gen-json');
const fixtures = new Fixtures({
    dir: pathToFixtures
});

const host = 'mongodb+srv://{dbUser}:{dbPassword}@hobbytaste-a3rpe.mongodb.net/test?retryWrites=true&w=majority';
const dbUser = process.argv[2];
const dbPassword = process.argv[3];
const dbHost = dbUser && dbPassword
    ? host
        .replace(/{dbUser}/, dbUser)
        .replace(/{dbPassword}/, dbPassword)
    : 'mongodb://localhost:27017';
process.env.dbHost = dbHost;

generateHobbies(pathToFixtures).then(() => {
    fixtures
        .connect(dbHost, {
            useUnifiedTopology: true,
            useNewUrlParser: true
        })
        .then(() => fixtures.unload())
        .then(() => fixtures.load())
        .then(() => fixtures.disconnect());
})
