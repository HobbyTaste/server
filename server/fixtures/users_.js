const bcrypt = require('bcrypt');
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
        .then(userList => getCollection('hobbies')
            .then(hobbyList => getCollection('comments')
                .then(commentList => Promise.all(userList.map(async user => {
                    const userComments = commentList.filter(comment => user.comments.includes(comment.temp_id));
                    const userCommentsId = userComments.map(comment => comment._id);
                    const salt = await bcrypt.genSalt();
                    const hashPassword = await bcrypt.hash(user.password, salt);
                    const userHobbies = hobbyList.filter(hobby => user.hobbies.includes(hobby.email));
                    const userHobbiesId = userHobbies.map(hobby => hobby._id);
                    return collection.updateOne(user, {
                        $set: {
                            "password": hashPassword,
                            "hobbies": userHobbiesId,
                            "comments": userCommentsId
                        }
                    })
                })))))
};
