import { Request, Response } from 'express';
import Token from '../models/Token';

export const getCustomTokens = async (req: Request, res: Response) => {
  try {
    const { wallet } = req.query;
    if (!wallet) {
      return res.status(400).json({ message: 'Wallet address is required' });
    }

    const tokens = await Token.find({ addedBy: wallet });
    res.json(tokens);
  } catch (error) {
    console.error('Error fetching custom tokens:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const addToken = async (req: Request, res: Response) => {
  try {
    const { token, wallet } = req.body;
    if (!token || !wallet) {
      return res.status(400).json({ message: 'Token and wallet are required' });
    }

    const newToken = new Token({
      address: token.address,
      symbol: token.symbol || token.id,
      name: token.name || token.text,
      image: token.img,
      addedBy: wallet
    });

    await newToken.save();
    res.status(201).json(newToken);
  } catch (error) {
    console.error('Error adding token:', error);
    res.status(500).json({ message: 'Server error' });
  }
}; 