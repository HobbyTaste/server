import {IComment, ICommentModel} from "../types/comment";
import {IHobbyModel} from "../types/hobby";
import {IUserModel} from "../types/user";
import {IProviderModel} from "../types/provider";
import {HTTP_STATUS} from "../types/http";


export default class CommentService {
    Hobby: IHobbyModel;
    User: IUserModel;
    Provider: IProviderModel;
    Comment: ICommentModel;

    constructor(Hobby: IHobbyModel, User: IUserModel, Provider: IProviderModel, Comment: ICommentModel) {
        this.Hobby = Hobby;
        this.Provider = Provider;
        this.User = User;
        this.Comment = Comment;
    }

    async CreateComment(hobbyId: string, CommentFields: Partial<IComment>) {
        const hobby = await this.Hobby.findById(hobbyId);
        if (!hobby) {
            throw {status: HTTP_STATUS.NOT_FOUND, message: 'Хобби не найдено'};
        }
        const newComment = new this.Comment(CommentFields);
        const {_id: commentId} = await newComment.save();

        return hobby.addComment(commentId);
    }
}
