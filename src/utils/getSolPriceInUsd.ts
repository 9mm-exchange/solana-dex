import axios from "axios";

export const getSolPriceInUSD = async () => {
  try {
      const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
      const solPriceInUSD = response.data.solana.usd;
      return solPriceInUSD;
  } catch (error) {
      console.error('Error fetching SOL price:', error);
      throw error;
  }
};