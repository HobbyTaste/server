const bcrypt = require('bcrypt');
const {MongoClient} = require('mongodb');
const config = require('config');
const dbHost = config.has('secrets')
    ? config.get('dbHost')
        .replace(/{dbUser}/, config.get('secrets.dbUser'))
        .replace(/{dbPassword}/, config.get('secrets.dbPassword'))
    : config.get('dbHost');

const getCollection = async (name) => {
    const client = new MongoClient(dbHost, {
            useUnifiedTopology: true,
            useNewUrlParser: true,
        }
    );
    await client.connect();
    const objectList = await client.db().collection(name).find().toArray();
    await client.close();
    return objectList;
};

module.exports = (collection) => {
    return collection.find().toArray()
        .then(userList => getCollection('hobbies')
            .then(hobbyList => Promise.all(userList.map(async user => {
                const salt = await bcrypt.genSalt();
                const hashPassword = await bcrypt.hash(user.password, salt);
                const userHobbiesIds = hobbyList
                    .filter(hobby => user.hobbies.includes(hobby.email))
                    .map(hobby => hobby._id);
                return collection.updateOne(user, {
                    $set: {
                        "password": hashPassword,
                        "hobbies": userHobbiesIds
                    }
                })
            }))))
};
