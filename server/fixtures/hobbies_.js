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
                        const hobbyComments = commentList.filter(comment => hobby.comments.includes(comment.temp_id));
                        const hobbyCommentsId = hobbyComments.map(comment => comment._id);
                        const hobbySubscribers = userList.filter(user => hobby.subscribers.includes(user.email));
                        const hobbySubscribersId = hobbySubscribers.map(user => user._id);
                        const hobbyOwner = providerList.find(provider => hobby.owner === provider.email);
                        const hobbyOwnerId = hobbyOwner._id;
                        return collection.updateOne(hobby, {
                            $set: {
                                "subscribers": hobbySubscribersId,
                                "owner": hobbyOwnerId,
                                "comments": hobbyCommentsId
                                }
                            });
                    }))))))
};
