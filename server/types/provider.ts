import {Document, Model} from 'mongoose'


export interface IProvider extends Document {
    name: string;
    password: string;
    email: string;
    avatar: string;
    phone: string;
    info: string;
    followedHobbies: string[]; // foreign key
    checkPasswords(candidatePassword: string): Promise<boolean>
}

export interface IProviderModel extends Model<IProvider> {}
