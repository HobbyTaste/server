import {Response, Request, Router} from 'express';
import {IProvider} from "../types/provider";
import multer from "multer";
import config from "config";
import ProviderService from "../services/provider"
import {User, Provider, Comment, Hobby} from '../models'


const providerRouter: Router = Router();
const ProviderServiceInstance = new ProviderService(Hobby, User, Provider, Comment)
const upload = multer({limits: {fieldSize: Number(config.get('aws.maxFileSize'))}});

/**
 * Регистрация партнера
 */
providerRouter.post('/create', upload.single('avatar'), async (req: Request, res: Response) => {
    try {
        const {...profile}: IProvider = req.body;
        const file = req.file;
        const newProvider = await ProviderServiceInstance.CreateProvider(profile, file);
        if (req.session) {
            req.session.provider = newProvider;
        }
        res.status(200).send();
    } catch (e) {
        if (e.status && e.message) {
            res.status(e.status).send(e.message);
        } else {
            res.status(500).send(e);
        }
    }
});


/**
 * Авторизация партнера
 */
providerRouter.post('/login', async (req: Request, res: Response) => {
    if (req.session?.provider) {
        res.end();
        return;
    }
    try {
        const {email, password} = req.body;
        if (req.session) {
            req.session.provider = await ProviderServiceInstance.LoginProvider(email, password);
        }
        res.status(200).send();
    } catch (e) {
        if (e.status && e.message) {
            res.status(e.status).send(e.message)
        } else {
            res.status(500).send(e)
        }
    }
});

/**
 * Выход
 */
providerRouter.get('/logout', (req: Request, res: Response) => {
    if (req.session) {
        req.session.provider = null;
    }
    res.end();
});

/**
 * Информация о партнере
 *
 */
providerRouter.get('/info', async (req: Request, res: Response) => {
    try {
        if (req.query.id) {
            res.json(await ProviderServiceInstance.ProviderInfo(req.query.id))
            return;
        }
        if (req.session?.provider) {
            const {_id: id, password, ...restProperties} = req.session.provider;
            res.json({id, ...restProperties});
            return;
        }
        res.status(403).send('Текущий партнер не прошел авторизацию');
    } catch (e) {
        if (e.status && e.message) {
            res.status(e.status).send(e.message)
        } else {
            res.status(500).send(e)
        }
    }
});

/**
 * Редактирование информации о партнере
 */
providerRouter.post('/edit', upload.single('avatar'), async (req: Request, res: Response) => {
    if (!req.session?.provider) {
        res.status(403).send('Партнер не авторизован');
        return;
    }
    try {
        const {...nextData} = req.body;
        const file = req.file;
        const {_id: id} = req.session.provider;
        req.session.provider = await ProviderServiceInstance.EditProvider(id, nextData, file);
        res.end();
    } catch (e) {
        if (e.status && e.message) {
            res.status(e.status).send(e.message)
        } else {
            res.status(500).send(e)
        }
    }
    res.end();
});

/**
 * Все хобби, предоставляемые партнером
 */
providerRouter.get('/hobbies', async (req: Request, res: Response) => {
    if (!req.session?.provider) {
        res.status(400).send('Партнер не авторизован');
        return;
    }
    const {_id: owner} = req.session.provider;
    res.json(await ProviderServiceInstance.GetHobbies(owner));
});

/**
 * Комментарии пользователей ко всем хобби партнера
 */
providerRouter.get('/comments', async (req: Request, res: Response) => {
    if (!req.session?.provider) {
        res.status(400).send('Пользователь не авторизован');
        return;
    }
    try {
        res.json(await ProviderServiceInstance.GetComments(req.session.provider));
    } catch (e) {
        res.status(500).send(e);
    }
});

/**
 * Подписка на хобби
 */
providerRouter.get('/subscribe', async (req: Request, res: Response) => {
    if (!req.session?.provider) {
        res.status(400).send('Партнер не авторизован');
        return;
    }
    try {
        const {id: hobbyId} = req.query;
        req.session.provider = await ProviderServiceInstance.HobbySubscribe(req.session.provider, hobbyId);
        res.status(200).end()
    } catch (e) {
        if (e.status && e.message) {
            res.status(e.status).send(e.message)
        } else {
            res.status(500).json(e)
        }
    }
})

export default providerRouter;
