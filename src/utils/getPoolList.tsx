import axios from 'axios';
import { BACKEND_URL } from './util';
import { PoolData } from '../types';
import { PublicKey } from '@solana/web3.js';
import { getTokenBalance } from '../program/web3';

export const getPoolList = async (): Promise<PoolData[]> => {
  try {
    const response = await axios.get(`${BACKEND_URL}/pool/list`);
    
    console.log("🚀 ~ getPoolList ~ response:", response)
    if (response.data && Array.isArray(response.data)) {
      return response.data.map((pool: any) => ({
        vol: pool.vol || '0',
        liquidity: pool.liquidity || '0',
        address: pool.address,
        lpMint: pool.lpMint,
        token0: pool.token0 ? {
          address: pool.token0.address,
          symbol: pool.token0.symbol,
          name: pool.token0.name,
          image: pool.token0.image,
          amount: pool.token0.amount || '0'
        } : null,
        token1: pool.token1 ? {
          address: pool.token1.address,
          symbol: pool.token1.symbol,
          name: pool.token1.name,
          image: pool.token1.image,
          amount: pool.token1.amount || '0'
        } : null
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching pool list:', error);
    return [];
  }
};

export const getPoolListWithWallet = async (walletAddress: PublicKey): Promise<PoolData[]> => {
  try {
    const response = await axios.get(`${BACKEND_URL}/pool/list-with-wallet/${walletAddress.toString()}`);
    
    if (response.data && Array.isArray(response.data)) {
      // Get user's LP token balances for each pool
      const poolsWithBalances = await Promise.all(response.data.map(async (pool: any) => {
        let userLpBalance = '0';
        let userToken0Balance = '0';
        let userToken1Balance = '0';

        try {
          if (pool.lpMint) {
            userLpBalance = await getTokenBalance(pool.lpMint, walletAddress.toString());
          }
          if (pool.token0?.address) {
            userToken0Balance = await getTokenBalance(pool.token0.address, walletAddress.toString());
          }
          if (pool.token1?.address) {
            userToken1Balance = await getTokenBalance(pool.token1.address, walletAddress.toString());
          }
        } catch (error) {
          console.error('Error fetching token balances:', error);
        }

        return {
          vol: pool.vol || '0',
          liquidity: pool.liquidity || '0',
          address: pool.address,
          lpMint: pool.lpMint,
          token0: pool.token0 ? {
            address: pool.token0.address,
            symbol: pool.token0.symbol,
            name: pool.token0.name,
            image: pool.token0.image,
            amount: userToken0Balance
          } : null,
          token1: pool.token1 ? {
            address: pool.token1.address,
            symbol: pool.token1.symbol,
            name: pool.token1.name,
            image: pool.token1.image,
            amount: userToken1Balance
          } : null,
          userLiquidity: userLpBalance,
          userShare: userLpBalance,
          userEarned: '0' // This would need to be calculated based on fees earned
        };
      }));

      return poolsWithBalances;
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching pool list with wallet:', error);
    return [];
  }
};
