const bcrypt = require('bcrypt');
const {MongoClient} = require('mongodb');
const dbHost = process.env.dbHost || require('config').get('dbHost');

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
        .then(providerList => getCollection('hobbies')
            .then(hobbyList => Promise.all(providerList.map(async provider => {
                const salt = await bcrypt.genSalt();
                const hashPassword = await bcrypt.hash(provider.password, salt);
                const followedHobbiesIds = hobbyList
                    .filter(hobby => provider.followedHobbies.includes(hobby.email))
                    .map(hobby => hobby._id);
                return collection.updateOne(provider, {
                    $set: {
                        "password": hashPassword,
                        "followedHobbies": followedHobbiesIds
                    }
                })
            }))))
};
