#!/usr/bin/env node
const Fixtures = require('node-mongodb-fixtures');
const pathToFixtures = './server/fixtures';
const fixtures = new Fixtures({
    dir: pathToFixtures
});

const config = require('config');
const dbUser = process.argv[2];
const dbPassword = process.argv[3];
const generateHobbies = require('./gen-json');

if (dbUser !== config.get('secrets.dbUser') || dbPassword !== config.get('secrets.dbPassword')) {
    throw 'Wrong username or password!'
}

const dbHost = config.get('dbHost')
        .replace(/{dbUser}/, dbUser)
        .replace(/{dbPassword}/, dbPassword);

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
