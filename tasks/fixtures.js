#!/usr/bin/env node
const Fixtures = require('node-mongodb-fixtures');
const fixtures = new Fixtures({
	dir: './server/fixtures'
});

const config = require('config');
const dbHost = config.get('dbHost');

// Sleep in order to prevent race condition with database loading
new Promise(r => setTimeout(r, 1000)).then(() => {})

fixtures
	.connect(dbHost, {
			useUnifiedTopology: true,
			useNewUrlParser: true
	})
	.then(() => fixtures._db.dropDatabase())
	.then(() => fixtures.unload())
	.then(() => fixtures.load())
	.then(() => fixtures.disconnect())
