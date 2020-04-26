import expressLoader from './express'
import mongooseLoader from './mongoose'
import logger from "../utils/logger";
import express from 'express'
import config from 'config'


const dbUser: string = process.env.DB_USER || config.has('secrets') && config.get('secrets.dbUser') || '';
const dbPassword: string = process.env.DB_PASSWORD || config.has('secrets') && config.get('secrets.dbPassword') || '';
export let dbHost: string = config.get('dbHost');

if (!dbUser || !dbPassword) {
    logger.error("Secrets are not provided.");
    process.exit(1);
}

dbHost = dbHost.replace(/{dbUser}/, dbUser);
dbHost = dbHost.replace(/{dbPassword}/, dbPassword);

export const init = async (app: express.Application) => {
    mongooseLoader();
    expressLoader(app);
    return app;
}
