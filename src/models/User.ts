// models/User.ts
import mongoose, { Types } from 'mongoose';

const PINATA_GATEWAY_URL = process.env.PINATA_GATEWAY_URL;
const defualtImg = process.env.DEFAULT_IMG_HASH

interface IUser {
  wallet: string;
  isLedger: number;
  avatar?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const userSchema = new mongoose.Schema<IUser>({
  wallet: { 
    type: String, 
    required: true, 
    unique: true 
  },
  isLedger: { 
    type: Number, 
    required: true,
    default: 0,
    enum: [0, 1] // Only allow 0 or 1
  },
 });

const User = mongoose.model<IUser>('User', userSchema);

export default User;