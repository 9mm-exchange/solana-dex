import { Request, Response } from 'express';
import Token from '../models/Token';

export const getCustomTokens = async (req: Request, res: Response) => {
  console.log("getCustomList");
  try {
    const { wallet } = req.body;
    console.log("🚀 ~ router.get ~ wallet:", wallet)

    if (!wallet) {
      return res.status(400).json({ error: "Wallet address is required" });
    }

    const tokens = await Token.find({ addedBy: wallet });
    res.status(200).json(tokens);
  } catch (error) {
    console.error("Error fetching user tokens:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const addToken = async (req: Request, res: Response) => {
  try {
    const { token, wallet } = req.body;
    console.log("🚀 ~ addToken:", token);
    console.log("🚀 ~ addToken:", wallet)

    // Validate token data
    if (!token || !token.address || !token.symbol || !token.name || !wallet) {
      return res.status(400).json({ error: "Invalid token data" });
    }

    // Check if token already exists
    const existingToken = await Token.findOne({
      mint: token.address,
      addedBy: wallet
    });
    console.log("🚀 ~ router.post ~ existingToken:", existingToken)
    if (existingToken) {
      return res.status(400).json({ error: "Token already exists in the list" });
    }

    // Create new token
    const newToken = new Token({
      mint: token.address,
      symbol: token.symbol,
      name: token.name,
      logoURI: token.img || "https://swap.pump.fun/tokens/usde.webp",
      decimals: token.decimals || 9,
      addedBy: wallet,
      createdAt: new Date()
    });

    await newToken.save();
    return res.status(200).json({ message: "Token added successfully", token: newToken });
  } catch (error) {
    console.error("Error adding token:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getTokenList = async (req: Request, res: Response) => {
  try {
    const tokenList = await Token.find({addedBy: "ADMIN"});
    res.status(200).json(tokenList);
    console.log("🚀 ~ getTokenList ~ tokenList:", tokenList)
  } catch (error) {
    console.error('Error fetching token list:', error);
    res.status(500).json({ error: 'Failed to fetch token list' });
  }
}

export const removeToken = async (req: Request, res: Response) => {
  try {
    const { mint, wallet } = req.body;

    if (!mint || !wallet) {
      return res.status(400).json({ error: "Token address and wallet are required" });
    }

    const token = await Token.findOneAndDelete({
      mint: mint,
      addedBy: wallet
    });

    if (!token) {
      return res.status(404).json({ error: "Token not found" });
    }

    return res.status(200).json({ message: "Token removed successfully" });
  } catch (error) {
    console.error("Error removing token:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};