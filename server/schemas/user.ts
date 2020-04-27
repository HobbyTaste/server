import {Schema} from 'mongoose'
import {IUser} from "../types/user";

const EMAIL_REG_EXP = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

const UserSchema: Schema<IUser> = new Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        unique: true,
        match: [EMAIL_REG_EXP, 'Неверный формат email'],
    },
    password: {
        type: String,
        required: true,
    },
    avatar: {
        type: String,
    },
    hobbies: {
        type: [Schema.Types.ObjectId],
    },
    comments: {
        type: [Schema.Types.ObjectId]
    }
});

export default UserSchema
