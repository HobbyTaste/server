import {IHobbyModel, IHobby} from "../types/hobby";
import {IUserModel} from "../types/user";
import {IProviderModel, IProvider} from "../types/provider";
import {ICommentModel, ICommentInfo, Participants} from "../types/comment";
import bcrypt from 'bcrypt'
import config from 'config'
import {Hobby} from "../models";
import {uploadFileToS3} from "../utils/aws";

const ObjectId = require("mongoose").Types.ObjectId;


export default class ProviderService {
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

    async CreateProvider(profile: Partial<IProvider>, file?: Express.Multer.File) {
        if (!profile.email) {
            throw {status: 400, message: 'Email обязателен'}
        }
        const provider = await this.Provider.findOne({
            $or: [{email: profile.email}, {name: profile.name}, {phone: profile.phone}]
        });
        if (provider) {
            throw {status: 400, message: 'Такой пользователь уже существует'}
        }
        if (file) {
            profile.avatar = await uploadFileToS3('provider', file);
        }
        const newProvider = new this.Provider({...profile});
        return newProvider.save();
    }

    async LoginProvider(email: string, password: string) {
        const provider = await this.Provider.findOne({email});
        if (!provider) {
            throw {status: 400, message: 'Неверный логин'}
        }
        const isTruePassword = await provider.checkPasswords(password);
        if (!isTruePassword) {
            throw {status: 400, message: 'Неверный пароль'}
        }
        return provider;
    }

    async ProviderInfo(providerId: string): Promise<Partial<IProvider>> {
        const provider = await this.Provider.findById(providerId);
        if (!provider) {
            throw {status: 404, message: 'Не найден такой пользователь'}
        }
        const {_id: id, password, ...restProperties} = provider;
        return {id, ...restProperties}
    }

    async EditProvider(providerId: string, nextData: Partial<IProvider>, file?: Express.Multer.File) {
        if (file) {
            nextData.avatar = await uploadFileToS3('partner', file);
        }
        const provider = await this.Provider.findOne({
            $or: [{email: nextData.email}, {name: nextData.name}, {phone: nextData.phone}]
        });
        if (provider) {
            throw {status: 400, message: 'Такой пользователь уже существует'}
        }
        if ('password' in nextData) {
            const salt = await bcrypt.genSalt(Number(config.get('saltWorkFactor')));
            nextData.password = await bcrypt.hash(nextData.password, salt);
        }
        return this.Provider.findByIdAndUpdate(providerId, nextData, {new: true})
    }

    async GetHobbies(providerId: string) {
        return Hobby.find({owner: providerId});
    }

    async GetComments(provider: IProvider): Promise<ICommentInfo[]> {
        const hobbies = await this.GetHobbies(provider._id);
        const commentIds = hobbies.reduce((acc: string[], hobby: IHobby) => acc.concat(hobby.comments), []);
        let comments = await this.Comment.find({_id: {$in: commentIds}});
        comments = comments.filter(comment => comment.author.type === Participants.user);
        return Promise.all(comments.map(comment => comment.repr()));
    }
}
