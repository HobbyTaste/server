import {connection as db} from 'mongoose';
import bcrypt from 'bcrypt';
import logger from '../utils/logger';
import {IUser, IUserModel} from '../types/user'
import UserSchema from "../schemas/user";


const SALT_WORK_FACTOR = 10;

UserSchema.pre<IUser>('save', async function() {
    if (!this.isModified('password')) {
      return;
    }
    try {
        const salt = await bcrypt.genSalt(SALT_WORK_FACTOR);
        this.password = await bcrypt.hash(this.password, salt);
    } catch (err) {
        logger.error(err);
    }
});

UserSchema.methods.checkPasswords = async function (candidatePassword: string): Promise<boolean> {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (e) {
        logger.error(e);
        return false;
    }
};

UserSchema.methods.repr = async function() {
    const {_id: id, name, email, avatar} = this;
    return {id, name, email, avatar}
}

const User = db.model<IUser, IUserModel>('User', UserSchema);
export default User;
