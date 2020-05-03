const {MongoClient} = require('mongodb');
const dbHost = require('config').get('dbHost');
const bcrypt = require('bcrypt');

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
        .then(providerList => getCollection('comments')
            .then(commentList => Promise.all(providerList.map(async provider => {
                const providerComments = commentList.filter(comment => provider.comments.includes(comment.temp_id));
                const providerCommentsId = providerComments.map(comment => comment._id);
                const salt = await bcrypt.genSalt();
                const hashPassword = await bcrypt.hash(provider.password, salt);
                return collection.updateOne(provider, {
                    $set: {
                        "password": hashPassword,
                        "comments": providerCommentsId
                    }
                })
            }))))
};
