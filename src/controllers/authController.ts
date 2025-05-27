// controllers/authController.ts
import { Request, Response } from 'express';
import User from '../models/User';
// import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

// Register User
export const registerUser = async (req: Request, res: Response) => {
  const { userName, email, password, googleId, wallet } = req.body;

  try {
    // Check if user already exists by email or wallet
    const existingUser = await User.findOne({
      $or: [
        { email: email },
        { wallet: wallet }
      ]
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create a new user
    const newUser = new User({
      userName,
      email,
      // password: password ? await bcrypt.hash(password, 10) : undefined,
      googleId,
      wallet
    });

    await newUser.save();

    // Create JWT token
    const token = jwt.sign(
      { userId: newUser._id, wallet: newUser.wallet },
      process.env.JWT_SECRET as string,
      { expiresIn: '1h' }
    );

    res.status(201).json({ token, user: { wallet: newUser.wallet, avatar: newUser.avatar } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Login User
export const loginUser = async (req: Request, res: Response) => {
  const { email, password, wallet } = req.body;

  try {
    // Find user by email or wallet
    const user = await User.findOne({
      $or: [
        { email: email },
        { wallet: wallet }
      ]
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // If password is provided, verify it
    // if (password && user.password) {
    //   const isMatch = await bcrypt.compare(password, user.password);
    //   if (!isMatch) {
    //     return res.status(400).json({ message: 'Invalid credentials' });
    //   }
    // }

    // Create JWT token
    const token = jwt.sign(
      { userId: user._id, wallet: user.wallet },
      process.env.JWT_SECRET as string,
      { expiresIn: '1h' }
    );

    res.status(200).json({ token, user: { wallet: user.wallet, avatar: user.avatar } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
