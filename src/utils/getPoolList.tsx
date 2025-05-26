import axios from 'axios';
import { BACKEND_URL } from './util';
import { PoolData } from '../types';

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
