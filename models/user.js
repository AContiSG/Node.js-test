const getDb = require("../util/database").getDb;
const mongodb = require("mongodb");

class User {
    constructor(user, email) {
        this.user = user;
        this.email = email;
    }

    save() {
        const db = getDb();
        return db.collection("users").insertOne(this);
    }

    static findById(userId) {
        const db = getDb();
        return db
            .collection("users")
            .findOne({ _id: new mongodb.ObjectId(userId) })
            .then((user) => {
                return user;
            })
            .catch((err) => console.log(err));
    }
}

module.exports = User;
