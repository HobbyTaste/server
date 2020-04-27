import express from 'express';
import config from 'config';
import * as loaders from './loaders';
import logger from "./utils/logger";

const LISTENING_PORT = process.env.PORT || Number(config.get('port')) || 3000;
const environment = process.env.NODE_ENV;
const app = express();

async function startServer() {
    await loaders.init(app);
    app.listen(LISTENING_PORT, () => {
        logger.info(`Server start listening on PORT: ${LISTENING_PORT}, http://localhost:${LISTENING_PORT}`);
    })
}

export default app;

startServer()
