import {connection as db} from 'mongoose';
import mongoose from 'mongoose'
import {escapeRegExp} from 'lodash';
import {IHobby, IHobbyModel} from "../types/hobby";
import HobbySchema from "../schemas/hobby";
import {IComment, Participants} from "../types/comment";

/**
 * Поиск хобби по названию в БД
 * @param label
 */
HobbySchema.statics.findByLabel = function(label: string): Promise<IHobby> {
    return this.find({label: new RegExp(escapeRegExp(label), 'i')});
}

/**
 * Поиск названию хобби по id-метро
 * (берущимся отсюда: https://data.mos.ru/classifier/7704786030-stantsii-moskovskogo-metropolitena)
 * @param label
 * @param metroId
 */
HobbySchema.statics.findByLabelWithGeo = function(label: string, metroId: number): Promise<IHobby> {
    return this.find({
        label: new RegExp(escapeRegExp(label), 'i'),
        metroId: metroId,
    });
};

HobbySchema.methods.userCommentsCount = async function() {
    const commentIds = this.comments;
    return mongoose.model('Comment').count({
        _id: {$in: commentIds},
        "author.type": Participants.user
    })
}

HobbySchema.methods.userComments = async function() {
    const commentIds = this.comments;
    return await mongoose.model('Comment').find({
        _id: {$in: commentIds},
        "author.type": Participants.user
    }) as IComment[];
}

HobbySchema.methods.addComment = async function(commentId) {
    const comment = await mongoose.model('Comment').findById(commentId) as IComment;
    if (comment.evaluation) {
        const count = await this.userCommentsCount();
        this.rating = (this.rating * count + comment.evaluation) / (count + 1)
    }
    const nextRating = this.rating;
    const nextComments = this.comments.concat(commentId);
    return await mongoose.model('Hobby').findByIdAndUpdate(this._id, {comments: nextComments, rating: nextRating}) as IHobby
}

const obj: any = {};
const {}: IHobbyModel = obj;

const Hobby = db.model<IHobby, IHobbyModel>('Hobby', HobbySchema);
export default Hobby;
