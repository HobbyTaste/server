const {MongoClient} = require('mongodb');
const dbHost = require('config').get('dbHost');

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
        .then(hobbyList => getCollection('users')
            .then(userList => getCollection('providers')
                .then(providerList => getCollection('comments')
                    .then(commentList => Promise.all(hobbyList.map(async hobby => {
                        const hobbyCommentsIds = commentList
                            .filter(comment => hobby.comments.includes(comment.temp_id))
                            .map(comment => comment._id);
                        const subscribersIds = userList
                            .filter(user => hobby.subscribers.includes(user.email))
                            .map(user => user._id);
                        const providerSubsIds = providerList
                            .filter(provider => hobby.providerSubscribers.includes(provider.email))
                            .map(provider => provider._id);
                        const hobbyOwnerId = providerList
                            .find(provider => hobby.owner === provider.email)
                            ._id;
                        return collection.updateOne(hobby, {
                            $set: {
                                "subscribers": subscribersIds,
                                "providerSubscribers": providerSubsIds,
                                "owner": hobbyOwnerId,
                                "comments": hobbyCommentsIds
                                }
                            });
                    }))))))
};
