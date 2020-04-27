import mongoose from 'mongoose'
import logger from "../utils/logger"
import {dbHost} from "./index";


export default async () => {
    try {
        mongoose.connect(dbHost, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        }).catch(logger.error);
    } catch (e) {}
}
