import axios from 'axios';
import { BACKEND_URL } from './util';

export interface PoolData {
  vol: string;
  liquidity: string;
  address: string;
  lpMint: string;
  quoteToken: {
    address: string;
    symbol: string;
    name: string;
    image: string;
    amount?: string;
  };
  baseToken: {
    address: string;
    symbol: string;
    name: string;
    image: string;
    amount?: string;
  };
}

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
        quoteToken: {
          address: pool.quoteToken?.address || '',
          symbol: pool.quoteToken?.symbol || '',
          name: pool.quoteToken?.name || '',
          image: pool.quoteToken?.image || 'https://swap.pump.fun/tokens/usde.webp'
        },
        baseToken: {
          address: pool.baseToken?.address || '',
          symbol: pool.baseToken?.symbol || '',
          name: pool.baseToken?.name || '',
          image: pool.baseToken?.image || 'https://swap.pump.fun/tokens/usde.webp'
        }
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching pool list:', error);
    return [];
  }
};
