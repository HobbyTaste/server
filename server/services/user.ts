import {IHobbyModel} from "../types/hobby";
import {IUser, IUserInfo, IUserModel} from "../types/user";
import {IProviderModel} from "../types/provider";
import {ICommentModel, ICommentInfo} from "../types/comment";
import bcrypt from 'bcrypt'
import config from 'config'
import {uploadFileToS3} from "../utils/aws";
import {HTTP_STATUS} from "../types/http";


const ObjectId = require("mongoose").Types.ObjectId;

export default class UserService {
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

    async LoginUser(email: string, password: string) {
        const user = await this.User.findOne({email});
        if (!user) {
            throw {status: HTTP_STATUS.BAD_REQUEST, message: 'Неверный логин'}
        }
        const isTruePassword = await user.checkPasswords(password);
        if (!isTruePassword) {
            throw {status: HTTP_STATUS.BAD_REQUEST, message: 'Неверный пароль'}
        }
        return user
    }

    async CreateUser(profile: Partial<IUser>, file?: Express.Multer.File) {
        if (!profile.email) {
            throw {status: HTTP_STATUS.BAD_REQUEST, message: 'Email обязателен для регистрации'}
        }
        const user = await this.User.findOne({email: profile.email});
        if (user) {
            throw {status: HTTP_STATUS.BAD_REQUEST, message: 'Такой пользователь уже существует'}
        }
        if (file) {
            profile.avatar = await uploadFileToS3('users', file);
        }
        const newUser = new this.User({...profile});
        return newUser.save()
    }

    async EditUser(userId: string, nextData: Partial<IUser>, file?: Express.Multer.File) {
        if (file) {
            nextData.avatar = await uploadFileToS3('users', file);
        }
        if ('password' in nextData) {
            const salt = await bcrypt.genSalt(Number(config.get('saltWorkFactor')));
            nextData.password = await bcrypt.hash(nextData.password, salt);
        }
        return this.User.findByIdAndUpdate(userId, nextData, {new: true})
    }

    async UserInfo(userId: string): Promise<IUserInfo> {
        const user = await this.User.findById(userId);
        if (!user) {
            throw {status: HTTP_STATUS.NOT_FOUND, message: 'Не найден такой пользователь'}
        }
        return user.repr();
    }

    async HobbySubscribe(user: IUser, hobbyId?: string) {
        if (!hobbyId) {
            throw {status: HTTP_STATUS.BAD_REQUEST, message: 'Необходимо указать id хобби для подписки'}
        }
        const hobby = await this.Hobby.findById(hobbyId);
        if (!hobby) {
            throw {status: HTTP_STATUS.NOT_FOUND, message: 'Такого хобби не найдено'}
        }

        const subscribed = hobby.subscribers.find(id => id == user._id);
        const nextHobbies = subscribed
            ? user.hobbies.filter(id => id != hobbyId)
            : user.hobbies.concat(hobbyId);
        const nextSubscribers = subscribed
            ? hobby.subscribers.filter(id => id != user._id)
            : hobby.subscribers.concat(user._id);

        await this.Hobby.findByIdAndUpdate(hobbyId, {subscribers: nextSubscribers});
        return this.User.findByIdAndUpdate(user._id, {hobbies: nextHobbies}, {new: true});
    }

    async GetHobbies(user: IUser) {
        const {hobbies: hobbyIds} = user;
        return this.Hobby.findById({$in: hobbyIds});
    }

    async GetComments(user: IUser): Promise<ICommentInfo[]> {
        const comments = await this.Comment.find({'author.id': ObjectId(user._id)})
        return Promise.all(comments.map(comment => comment.repr()));
    }

    async AvatarUpload(user: IUser, file?: Express.Multer.File) {
        if (!file) {
            throw {status: HTTP_STATUS.BAD_REQUEST, message: 'Нет файла'}
        }
        if (!file.mimetype.match(/images/)) {
            throw {status: HTTP_STATUS.BAD_REQUEST, message: 'Неверный формат изображения'}
        }
        const url = await uploadFileToS3('users', file);
        return this.User.findByIdAndUpdate(user._id, {avatar: url}, {new: true});
    }
}
