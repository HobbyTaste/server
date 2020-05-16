import {Response, Request, Router} from 'express';
import multer from 'multer';
import config from 'config';
import UserService from "../services/user";
import {User, Provider, Comment, Hobby} from '../models'
import {HTTP_STATUS} from "../types/http";
import processError from "../utils/processError";


const userRouter: Router = Router();
const UserServiceInstance = new UserService(Hobby, User, Provider, Comment);

const upload = multer({limits: {fieldSize: Number(config.get('aws.maxFileSize'))}});


/**
 * Авторизация пользователя
 */
userRouter.post('/login', async (req: Request, res: Response) => {
    if (req.session?.user) {
        res.end();
        return;
    }
    try {
        const {email, password} = req.body;
        if (req.session) {
            req.session.user = await UserServiceInstance.LoginUser(email, password);
        }
        res.status(HTTP_STATUS.OK).send();
    } catch (e) {
        const {status, message} = processError(e);
        res.status(status).send(message);
    }
});

/**
 * Регистрация пользователя
 */
userRouter.post('/create', upload.single('avatar'), async (req: Request, res: Response) => {
    try {
        const {...profile} = req.body;
        const file = req.file;
        const newUser = await UserServiceInstance.CreateUser(profile, file);
        if (req.session) {
            req.session.user = newUser;
        }
        res.status(HTTP_STATUS.OK).send();
    } catch (e) {
        const {status, message} = processError(e);
        res.status(status).send(message);
    }
});

/**
 * Редактирование информации о пользователе
 */
userRouter.post('/edit', upload.single('avatar'), async (req: Request, res: Response) => {
    if (!req.session?.user) {
        res.status(HTTP_STATUS.FORBIDDEN).send('Пользователь не авторизован');
        return;
    }
    try {
        const {...nextData} = req.body;
        const file = req.file;
        const {_id: id} = req.session.user;
        req.session.user = await UserServiceInstance.EditUser(id, nextData, file);
        res.end();
    } catch (e) {
        const {status, message} = processError(e);
        res.status(status).send(message);
    }
});

/**
 * Выход
 */
userRouter.get('/logout', (req: Request, res: Response) => {
    if (req.session) {
        req.session.user = null;
    }
    res.end();
});

/**
 * Информация о пользователе
 */
userRouter.get('/info', async (req: Request, res: Response) => {
    try {
        if (req.query.id) {
            res.json(await UserServiceInstance.UserInfo(req.query.id));
            return;
        }
        if (req.session?.user) {
            const {_id: id, name, email, avatar} = req.session.user;
            res.json({id, name, email, avatar});
            return;
        }
        res.status(HTTP_STATUS.FORBIDDEN).send('Текущий пользователь не прошел авторизацию');
    } catch (e) {
        const {status, message} = processError(e);
        res.status(status).send(message);
    }
});

/**
 * Подписка на хобби
 */
userRouter.get('/subscribe', async (req: Request, res: Response) => {
     if (!req.session?.user) {
         res.status(HTTP_STATUS.BAD_REQUEST).send('Пользователь не авторизован');
         return;
     }
     try {
         const {id: hobbyId} = req.query;
         req.session.user = await UserServiceInstance.HobbySubscribe(req.session.user, hobbyId);
         res.status(HTTP_STATUS.OK).end();
     } catch (e) {
         const {status, message} = processError(e);
         res.status(status).send(message);
     }
});

/**
 * Все хобби, на которые пользователь подписан
 */
userRouter.get('/hobbies', async (req: Request, res: Response) => {
    if (!req.session?.user) {
        res.status(HTTP_STATUS.BAD_REQUEST).send('Пользователь не авторизован');
        return;
    }
    try {
        res.json(await UserServiceInstance.GetHobbies(req.session.user));
    } catch (e) {
        const {status, message} = processError(e);
        res.status(status).send(message);
    }
});

/**
 * Все комментарии пользователя
 */
userRouter.get('/comments', async (req: Request, res: Response) => {
    if (!req.session?.user) {
        res.status(HTTP_STATUS.BAD_REQUEST).send('Пользователь не авторизован');
        return;
    }
    try {
        res.json(await UserServiceInstance.GetComments(req.session.user));
    } catch (e) {
        const {status, message} = processError(e);
        res.status(status).send(message);
    }
});

/**
 * Загрузка аватара
 */
userRouter.post('/upload', upload.single('avatar'), async (req: Request, res: Response) => {
    if (!req.session?.user) {
        res.status(HTTP_STATUS.FORBIDDEN).send('Текущий пользователь не прошел авторизацию');
        return;
    }
    try {
        req.session.user = await UserServiceInstance.AvatarUpload(req.session.user, req.file)
        res.json({avatar: req.session.user.avatar});
    } catch (e) {
        const {status, message} = processError(e);
        res.status(status).send(message);
    }
});

export default userRouter;
