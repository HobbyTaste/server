import {IHobbyModel} from "../types/hobby";
import {IUserModel} from "../types/user";
import {IProviderModel, IProvider} from "../types/provider";
import {ICommentModel} from "../types/comment";
import bcrypt from 'bcrypt'
import config from 'config'
import {Hobby} from "../models";
import {uploadFileToS3} from "../utils/aws";
import {HTTP_STATUS} from "../types/http";


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
            throw {status: HTTP_STATUS.BAD_REQUEST, message: 'Email обязателен'}
        }
        const provider = await this.Provider.findOne({email: profile.email});
        if (provider) {
            throw {status: HTTP_STATUS.BAD_REQUEST, message: 'Такой пользователь уже существует'}
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
            throw {status: HTTP_STATUS.BAD_REQUEST, message: 'Неверный логин'}
        }
        const isTruePassword = await provider.checkPasswords(password);
        if (!isTruePassword) {
            throw {status: HTTP_STATUS.BAD_REQUEST, message: 'Неверный пароль'}
        }
        return provider;
    }

    async ProviderInfo(providerId: string): Promise<Partial<IProvider>> {
        const provider = await this.Provider.findById(providerId);
        if (!provider) {
            throw {status: HTTP_STATUS.NOT_FOUND, message: 'Не найден такой пользователь'}
        }
        const {_id: id, password, ...restProperties} = provider;
        return {id, ...restProperties}
    }

    async EditProvider(providerId: string, nextData: Partial<IProvider>, file?: Express.Multer.File) {
        if (file) {
            nextData.avatar = await uploadFileToS3('partner', file);
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

    async HobbySubscribe(provider: IProvider, hobbyId: string) {
        if (!hobbyId) {
            throw {status: HTTP_STATUS.BAD_REQUEST, message: 'Необходимо указать id хобби для подписки'}
        }
        const hobby = await this.Hobby.findById(hobbyId);
        if (!hobby) {
            throw {status: HTTP_STATUS.NOT_FOUND, message: 'Такого хобби не найдено'}
        }

        const subscribed = hobby.providerSubscribers.find(id => id == provider._id);
        const nextProviderSubscribers = subscribed
            ? hobby.providerSubscribers.filter(id => id != provider._id)
            : hobby.providerSubscribers.concat(provider._id);
        const nextFollowedHobbies = subscribed
            ? provider.followedHobbies.filter(id => id != hobbyId)
            : provider.followedHobbies.concat(hobbyId);
        await this.Hobby.findByIdAndUpdate(hobbyId, {providerSubscribers: nextProviderSubscribers});
        return this.Provider.findByIdAndUpdate(provider._id, {followedHobbies: nextFollowedHobbies}, {new: true})
    }

    async GetFollowedHobbies(provider: IProvider) {
        const hobbyIds = provider.followedHobbies;
        return this.Hobby.findById({$in: hobbyIds});
    }
}
