const {MongoClient} = require('mongodb');
const dbHost = require('config').get('dbHost');

getCollection = (name) => {
    const client = new MongoClient(dbHost, {
            useUnifiedTopology: true,
            useNewUrlParser: true,
        }
    );
    return client.connect()
        .then(() => client.db().collection(name).find().toArray())
        .then(objectList => client.close()
            .then(() => objectList))
};

module.exports = (collection) => {
    return collection.find().toArray()
        .then(hobbyList => getCollection('users')
            .then(userList => getCollection('providers')
                .then(providerList => Promise.all(hobbyList.map(async hobby => {
                    const hobbySubscribers = userList.filter(user => hobby.subscribers.includes(user.email));
                    const hobbySubscribersId = hobbySubscribers.map(user => user._id);
                    const hobbyOwner = providerList.find(provider => hobby.owner === provider.email);
                    const hobbyOwnerId = hobbyOwner._id;
                    await collection.updateOne(hobby, {
                        $set: {
                            "subscribers": hobbySubscribersId,
                            "owner": hobbyOwnerId
                            }
                        });
                })))))
};
