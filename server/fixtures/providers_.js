const bcrypt = require('bcrypt');

module.exports = (collection) => {
    return collection.find().toArray()
        .then(providerList => Promise.all(providerList.map(async provider => {
            const salt = await bcrypt.genSalt();
            const hashPassword = await bcrypt.hash(provider.password, salt);
            collection.updateOne(provider, {
                $set: {
                    "password": hashPassword
                }
            })
        })))
};
