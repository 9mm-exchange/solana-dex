import express from "express";
import Pool from "../models/Pool";
import Token from "../models/Token";
import { logger } from '../sockets/logger';
import PoolStatus from "../models/PoolStatus";

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
    console.log("🚀 ~ router.get ~ walletAddress:", walletAddress);
    
    // Get all pools where the user has positions
    const poolStatuses = await PoolStatus.find({ record: { $elemMatch: { holder: walletAddress } } });
    
    console.log("🚀 ~ router.get ~ poolStatuses:", poolStatuses)
    // Get all unique pool IDs from the statuses
    const poolIds = poolStatuses.map(status => status.poolId);
    
    // Get all pools that match these IDs
    const pools = await Pool.find({ _id: { $in: poolIds } }).sort({ createdAt: -1 });
    
    // Get all unique token addresses from the pools
    const tokenAddresses = new Set<string>();
    pools.forEach(pool => {
      tokenAddresses.add(pool.token0Mint);
      tokenAddresses.add(pool.token1Mint);
    });

    // Fetch all tokens in one query
    const tokens = await Token.find({ mint: { $in: Array.from(tokenAddresses) } });
    const tokenMap = new Map(tokens.map(token => [token.mint, token]));

    // Format the pools with token information and user-specific data
    const formattedPools = pools.map(pool => {
      const token0 = tokenMap.get(pool.token0Mint);
      const token1 = tokenMap.get(pool.token1Mint);
      
      // Find the corresponding pool status for this pool
      const poolStatus = poolStatuses.find(status => status.poolId.toString() === pool._id.toString());
      
      // Calculate total swap amount for this user in this pool
      const totalSwapAmount = poolStatus?.record.reduce((sum, record) => sum + record.swapAmount, 0) || 0;
      console.log("🚀 ~ router.get ~ totalSwapAmount:", totalSwapAmount)

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
          amount: '0' // This will be populated by the frontend
        } : null,
        token1: token1 ? {
          address: token1.mint,
          symbol: token1.symbol,
          name: token1.name,
          image: token1.logoURI || 'https://swap.pump.fun/tokens/usde.webp',
          amount: '0' // This will be populated by the frontend
        } : null,
        userLiquidity: '0', // This will be populated by the frontend
        userShare: '0', // This will be populated by the frontend
        userEarned: totalSwapAmount.toString() // User's earned fees from swaps
      };
    });

    res.status(200).json(formattedPools);
  } catch (error) {
    logger.error('Error fetching pool list with wallet:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;