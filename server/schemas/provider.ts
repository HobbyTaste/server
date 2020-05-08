import {Schema} from 'mongoose'
import {IProvider} from "../types/provider";

const EMAIL_REG_EXP = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
const PHONE_REG_EXP = /^\+7\d{10}$/;


const ProviderSchema: Schema<IProvider> = new Schema({
    name: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        match: [PHONE_REG_EXP, 'Неверный формат']
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        unique: true,
        match: [EMAIL_REG_EXP, 'Неверный формат email'],
    },
    info: {
        type: String,
        maxlength: 2000,
    },
    password: {
        type: String,
        required: true,
    },
    avatar: {
        type: String,
    }
});

export default ProviderSchema
