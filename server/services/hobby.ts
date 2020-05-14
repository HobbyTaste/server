import {IHobby, IHobbyModel, TariffPlans} from "../types/hobby";
import {IUserModel} from "../types/user";
import {IProviderModel} from "../types/provider";
import {ICommentModel, IComment} from "../types/comment";
import {isNil} from 'lodash';
import {uploadFileToS3} from "../utils/aws";
import {HTTP_STATUS} from "../types/http";


export default class HobbyService {
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

    async GetComments(hobbyId: string) {
        const hobby = await this.Hobby.findById(hobbyId);
        if (!hobby) {
            throw {status: HTTP_STATUS.NOT_FOUND, message: 'Хобби не найдено'};
        }
        const comments = await hobby.userComments();
        return Promise.all(comments.map((comment: IComment) => comment.repr()))
    }

    async AddHobby(hobbyInfo: Partial<IHobby>, providerId: string, file?: Express.Multer.File) {
        if (file) {
            hobbyInfo.avatar = await uploadFileToS3('hobbies', file);
        }
        const newHobby = new this.Hobby({...hobbyInfo, owner: providerId});
        return newHobby.save();
    }

    async FindByLabel(hobbyInfo: Partial<IHobby>) {
        const numberMetroId = Number(hobbyInfo.metroId);
        if (!isNil(hobbyInfo.label)) {
            return isNaN(numberMetroId)
                ? this.Hobby.findByLabel(hobbyInfo.label)
                : this.Hobby.findByLabelWithGeo(hobbyInfo.label, numberMetroId);
        } else {
            throw {status: HTTP_STATUS.BAD_REQUEST, message: `typeof label = ${typeof hobbyInfo.label}`}
        }
    }

    async HobbyInfo(hobbyId: string) {
        return this.Hobby.findById(hobbyId);
    }

    async Filtered(filters: any) {
        return this.Hobby.find(filters);
    }

    async EditHobby(hobbyId: string, updateParams: IHobby) {
        return this.Hobby.findByIdAndUpdate(hobbyId, updateParams);
    }

    async AddTariff(hobbyId: string, providerId: string, tariff: TariffPlans) {
        const hobby = await this.Hobby.findById(hobbyId);
        if (!hobby) {
            throw {status: HTTP_STATUS.NOT_FOUND, message: 'Хобби не найдено'}
        }
        if (hobby.owner !== providerId) {
            throw {status: HTTP_STATUS.FORBIDDEN, message: 'Можно подключать только для своих хобби'}
        }
        const nextMonetization = hobby.monetization.concat({
            tariff,
            activationDate: '',
            expirationDate: '',
            cost: 0
        });
        return this.Hobby.findByIdAndUpdate(hobbyId, {monetization: nextMonetization})
    }
}
