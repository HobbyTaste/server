import {IHobby, TariffPlans} from "../types/hobby";
import {Schema} from 'mongoose'

const EMAIL_REG_EXP = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

const HobbySchema: Schema<IHobby> = new Schema({
    label: {
        type: String,
        required: true,
        trim: true,
    },
    phone: {
        type: String,
        trim: true,
        match: [/^\+7\d{10}$/, 'Неверный формат номера телефона']
    },
    email: {
        type: String,
        trim: true,
        match: [EMAIL_REG_EXP, 'Неверный формат email']
    },
    website: {
        type: String,
        trim: true
    },
    contacts: {
        type: Map,
        of: String
    },
    address: {
        type: String,
        trim: true,
    },
    location: {
        type: String
    },
    metroStation: {
        type: String,
        lowercase: true,
        trim: true,
    },
    metroId: {
        type: Number,
    },
    description: {
        type: String,
    },
    shortDescription: {
        type: String,
        maxlength: [500, 'toLongDescription'],
    },
    owner: {
        type: Schema.Types.ObjectId,
    },
    subscribers: {
        type: [Schema.Types.ObjectId],
        default: []
    },
    providerSubscribers: {
        type: [Schema.Types.ObjectId],
        default: []
    },
    avatar: {
        type: String,
    },
    category: {
        type: String,
    },
    rating: {
        type: Number,
        default: 0
    },
    comments: {
        type: [Schema.Types.ObjectId],
        default: []
    },
    parking: {
        type: Boolean,
        default: false
    },
    equipment: {
        type: Boolean,
        default: false
    },
    novice: {
        type: Boolean,
        default: false
    },
    children: {
        type: Boolean,
        default: false
    },
    facilities: {
        type: String
    },
    special: {
        type: String
    },
    price: {
        title: {
            type: String
        },
        priceList: {
            type: String,
            required: true
        }
    },
    monetization: [{
        tariff: {
            type: Number,
            enum: Object.values(TariffPlans)
        },
        activationDate: {
            type: String
        },
        expirationDate: {
            type: String
        },
        cost: {
            type: Number
        }
    }],
    workTime: {
        type: [String],
        required: true
    }
});

export default HobbySchema;
