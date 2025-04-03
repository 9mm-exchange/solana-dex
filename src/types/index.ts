import { Document } from "mongoose";

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  googleId?: string;
}

export interface IAdmin extends Document {
    adminname: string;
    email: string;
    password: string;
    avatar_url: string;
    panelImg_url: string;
    panelContent: string;
}