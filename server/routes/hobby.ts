import {Router, Request, Response} from 'express';
import {IHobby} from "../types/hobby";
import multer from "multer";
import config from "config";
import HobbyService from "../services/hobby";
import {Comment, Hobby, Provider, User} from "../models";
import {HTTP_STATUS} from "../types/http";
import processError from "../utils/processError";


const hobbyRouter: Router = Router();
const HobbyServiceInstance = new HobbyService(Hobby, User, Provider, Comment);
const upload = multer({limits: {fieldSize: Number(config.get('aws.maxFileSize'))}});

/**
 * Добавление нового хобби в БД
 */
hobbyRouter.post('/add', upload.single('avatar'), async (req: Request, res: Response) => {
    if (!req.session?.provider) {
        res.status(HTTP_STATUS.FORBIDDEN).send('Партнер не авторизован');
        return;
    }
    try {
        const hobbyInfo: Partial<IHobby> = {...req.body};
        const file = req.file;
        const {_id: owner} = req.session.provider;
        await HobbyServiceInstance.AddHobby(hobbyInfo, owner, file);
        res.status(HTTP_STATUS.OK).send();
    } catch (e) {
        const {status, message} = processError(e);
        res.status(status).send(message);
    }
});

/**
 * Поиск хобби по вхождению в него слова
 * label - название хобби (возможно только часть)
 * metroId - id-метро берущийся из стороннего API
 */
hobbyRouter.get('/find', async (req: Request, res: Response) => {
    try {
        const {label, metroId}: Partial<IHobby> = req.query;
        const hobbies = await HobbyServiceInstance.FindByLabel({label, metroId});
        res.json(hobbies);
    } catch (e) {
        const {status, message} = processError(e);
        res.status(status).send(message);
    }
});

/**
 * Поиск хобби с нативной фильтрацией
 */
hobbyRouter.get('/filter', async (req: Request, res: Response) => {
    try {
        const {...filters} = req.query;
        res.json(await HobbyServiceInstance.Filtered(filters));
    } catch (e) {
        const {status, message} = processError(e);
        res.status(status).send(message);
    }
});


/**
 * Возвращает все хобби из БД
 */
hobbyRouter.get('/all', async (req: Request, res: Response) => {
    try {
        res.json(await HobbyServiceInstance.Filtered({}));
    } catch (e) {
        const {status, message} = processError(e);
        res.status(status).send(message);
    }
    return;
});

/**
 * Возвращает информацию по конкретному хобби
 * id - параметр GET запроса
 */
hobbyRouter.get('/info', async (req: Request, res: Response) => {
    try {
        const {id} = req.query;
        res.json(await HobbyServiceInstance.HobbyInfo(id));
    } catch (e) {
        const {status, message} = processError(e);
        res.status(status).send(message);
    }
});

/**
 * Обновляет данные по хобби и его id
 * id - параметр запроса
 */
hobbyRouter.post('/edit', async (req: Request, res: Response) => {
    try {
        const {id} = req.query;
        const updateParams: IHobby = {...req.body};
        await HobbyServiceInstance.EditHobby(id, updateParams);
        res.end();
    } catch (e) {
        const {status, message} = processError(e);
        res.status(status).send(message);
    }
});

/**
 *
 * Возвращает все комментарии к хобби в формате ICommentInfo
 */
hobbyRouter.get('/comments', async (req: Request, res: Response) => {
    try {
        const {id} = req.query;
        res.json(await HobbyServiceInstance.GetComments(id));
    } catch (e) {
        const {status, message} = processError(e);
        res.status(status).send(message);
    }
});

/**
 * Активация тарифа для хобби
 */
hobbyRouter.post('/activate', async (req: Request, res: Response) => {
    if (!req.session?.provider) {
        res.status(HTTP_STATUS.FORBIDDEN).send('Партнер не авторизован');
        return;
    }
    try {
        const {hobbyId, tariff} = req.query;
        await HobbyServiceInstance.AddTariff(hobbyId, req.session.provider._id, tariff);
        res.status(HTTP_STATUS.OK).send();
    } catch (e) {
        const {status, message} = processError(e);
        res.status(status).send(message);
    }
});

export default hobbyRouter;
