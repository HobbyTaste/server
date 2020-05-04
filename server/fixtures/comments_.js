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
        .then(commentList => getCollection('users')
            .then(userList => getCollection('providers')
                .then(providerList => Promise.all(commentList.map(async comment => {
                    const author = comment.author.type === 0
                        ? userList.find(user => user.email === comment.author.id)
                        : providerList.find(provider => provider.email === comment.author.id)
                    const relatedComment = comment.relatedComment !== null
                        ? await collection.findOne({"temp_id": comment.relatedComment})
                        : null
                    return collection.updateOne(comment, {
                        $set: {
                            "author": {
                                "type": comment.author.type,
                                "id": author._id
                            },
                            "relatedComment": relatedComment ? relatedComment._id : null
                        }
                    })
                })))))
};
