import express from "express";
import Pool from "../models/Pool";
import Token from "../models/Token";
import { logger } from '../sockets/logger';

const router = express.Router();

router.get("/list", async (req: any, res: any) => {
  try {
    const pools = await Pool.find({}).sort({ createdAt: -1 });
    
    // Get all unique token addresses
    const tokenAddresses = new Set<string>();
    pools.forEach(pool => {
      tokenAddresses.add(pool.token0Mint);
      tokenAddresses.add(pool.token1Mint);
    });

    // Fetch all tokens in one query
    const tokens = await Token.find({ mint: { $in: Array.from(tokenAddresses) } });
    const tokenMap = new Map(tokens.map(token => [token.mint, token]));

    const formattedPools = pools.map(pool => {
      const token0 = tokenMap.get(pool.token0Mint);
      const token1 = tokenMap.get(pool.token1Mint);

      return {
        vol: pool.volume24h || '0',
        liquidity: pool.liquidity || '0',
        address: pool.poolAddress,
        lpMint: pool.lpMint,
        token0: token0 ? {
          address: token0.mint,
          symbol: token0.symbol,
          name: token0.name,
          image: token0.logoURI || 'https://swap.pump.fun/tokens/usde.webp',
          amount: '0'
        } : null,
        token1: token1 ? {
          address: token1.mint,
          symbol: token1.symbol,
          name: token1.name,
          image: token1.logoURI || 'https://swap.pump.fun/tokens/usde.webp',
          amount: '0'
        } : null
      };
    });

    res.status(200).json(formattedPools);
  } catch (error) {
    logger.error('Error fetching pool list:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get("/list-with-wallet/:walletAddress", async (req: any, res: any) => {
  try {
    const { walletAddress } = req.params;
    
    // Get all pools
    const pools = await Pool.find({}).sort({ createdAt: -1 });
    
    // Get all unique token addresses
    const tokenAddresses = new Set<string>();
    pools.forEach(pool => {
      tokenAddresses.add(pool.token0Mint);
      tokenAddresses.add(pool.token1Mint);
    });

    // Fetch all tokens in one query
    const tokens = await Token.find({ mint: { $in: Array.from(tokenAddresses) } });
    const tokenMap = new Map(tokens.map(token => [token.mint, token]));

    const formattedPools = pools.map(pool => {
      const token0 = tokenMap.get(pool.token0Mint);
      const token1 = tokenMap.get(pool.token1Mint);

      return {
        vol: pool.volume24h || '0',
        liquidity: pool.liquidity || '0',
        address: pool.poolAddress,
        lpMint: pool.lpMint,
        token0: token0 ? {
          address: token0.mint,
          symbol: token0.symbol,
          name: token0.name,
          image: token0.logoURI || 'https://swap.pump.fun/tokens/usde.webp',
          amount: '0'
        } : null,
        token1: token1 ? {
          address: token1.mint,
          symbol: token1.symbol,
          name: token1.name,
          image: token1.logoURI || 'https://swap.pump.fun/tokens/usde.webp',
          amount: '0'
        } : null,
        userLiquidity: '0', // This will be populated by the frontend
        userShare: '0', // This will be populated by the frontend
        userEarned: '0' // This will be populated by the frontend
      };
    });

    res.status(200).json(formattedPools);
  } catch (error) {
    logger.error('Error fetching pool list with wallet:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;