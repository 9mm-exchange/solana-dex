// models/User.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  userName: string;
  email: string;
  password: string;
  googleId?: string;
}

const UserSchema: Schema = new Schema({
  userName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  googleId: { type: String }
});

const User = mongoose.model<IUser>('User', UserSchema);
export default User;
