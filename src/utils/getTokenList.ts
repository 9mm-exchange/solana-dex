import axios from 'axios';

interface TokenInfo {
  address: string;
  chainId: number;
  decimals: number;
  name: string;
  symbol: string;
  logoURI?: string;
}

export const getTokenList = async (): Promise<TokenInfo[]> => {
  try {
    // Fetch token list from Jupiter API
    const response = await axios.get('https://token.jup.ag/all');
    
    if (response.status === 200) {
      return response.data;
    } else {
      throw new Error('Failed to fetch token list');
    }
  } catch (error) {
    console.error('Error fetching token list:', error);
    throw error;
  }
};

// Optional: Function to get token info by address
export const getTokenInfoByAddress = async (address: string): Promise<TokenInfo | null> => {
  try {
    const tokens = await getTokenList();
    return tokens.find(token => token.address === address) || null;
  } catch (error) {
    console.error('Error fetching token info:', error);
    return null;
  }
}; 