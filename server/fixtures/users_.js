const bcrypt = require('bcrypt');
const {MongoClient} = require('mongodb');
const dbHost = require('config').get('dbHost');

getCollection = async (name) => {
    const client = new MongoClient(dbHost, {
            useUnifiedTopology: true,
            useNewUrlParser: true,
        }
    );
    await client.connect();
    const hobbyList = await client.db().collection(name).find().toArray();
    await client.close();
    return hobbyList;
};

module.exports = (collection) => {
    return collection.find().toArray()
        .then(userList => getCollection('hobbies')
            .then(hobbyList => Promise.all(userList.map(async user => {
                const salt = await bcrypt.genSalt();
                const hashPassword = await bcrypt.hash(user.password, salt);
                const userHobbies = hobbyList.filter(hobby => user.hobbies.includes(hobby.email));
                const userHobbiesId = userHobbies.map(hobby => hobby._id);
                collection.updateOne(user, {
                    $set: {
                        "password": hashPassword,
                        "hobbies": userHobbiesId
                    }
                })
            }))))
};
