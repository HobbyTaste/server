import {Response, Router} from 'express';
import {Participants} from "../types/comment";
import CommentService from "../services/comment";
import {ICreateCommentRequest} from "../types/comment";
import {Hobby, User, Provider, Comment} from "../models"
import {HTTP_STATUS} from "../types/http";
import processError from "../utils/processError";


const CommentServiceInstance = new CommentService(Hobby, User, Provider, Comment)
const commentRouter: Router = Router();

/**
 * Создание комментария
 */
commentRouter.post('/create', async (req: ICreateCommentRequest, res: Response) => {
    if (!req.session?.user && !req.session?.provider) {
        res.status(HTTP_STATUS.FORBIDDEN).send('Неавторизированный');
        return;
    }
    try {
        const type = req.session.user ? Participants.user : Participants.provider;
        const {_id: authorId} = type === Participants.user ? req.session.user : req.session.provider;
        await CommentServiceInstance.CreateComment(req.query.hobbyId, {
            author: {type, id: authorId},
            ...req.body,
            relatedComment: req.query.relatedId
        });
        res.status(HTTP_STATUS.OK).send();
    } catch (e) {
        const {status, message} = processError(e);
        res.status(status).send(message);
    }
});

export default commentRouter
