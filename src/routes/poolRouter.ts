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
    const tokens = await Token.find({ address: { $in: Array.from(tokenAddresses) } });
    const tokenMap = new Map(tokens.map(token => [token.address, token]));

    const formattedPools = pools.map(pool => {
      const token0 = tokenMap.get(pool.token0Mint);
      const token1 = tokenMap.get(pool.token1Mint);

      return {
        vol: pool.volume24h || '0',
        liquidity: pool.liquidity || '0',
        address: pool.poolAddress,
        lpMint: pool.lpMint,
        quoteToken: token0 ? {
          address: token0.address,
          symbol: token0.symbol,
          name: token0.name,
          image: token0.image || 'https://swap.pump.fun/tokens/usde.webp'
        } : null,
        baseToken: token1 ? {
          address: token1.address,
          symbol: token1.symbol,
          name: token1.name,
          image: token1.image || 'https://swap.pump.fun/tokens/usde.webp'
        } : null
      };
    });

    res.status(200).json(formattedPools);
  } catch (error) {
    logger.error('Error fetching pool list:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;