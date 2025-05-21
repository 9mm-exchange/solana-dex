import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useEffect, useState } from 'react';
import { Token } from '../types';
import { getTokenBalance } from '../utils/solana';

export function useTokenBalance(token: Token | null) {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [balance, setBalance] = useState<string>('0');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchBalance() {
      if (!token || !wallet.publicKey) {
        setBalance('0');
        return;
      }

      setIsLoading(true);
      try {
        const newBalance = await getTokenBalance(connection, wallet, token);
        setBalance(newBalance);
      } catch (error) {
        console.error('Error fetching balance:', error);
        setBalance('0');
      } finally {
        setIsLoading(false);
      }
    }

    fetchBalance();
    
    // Set up balance polling
    const interval = setInterval(fetchBalance, 10000);
    return () => clearInterval(interval);
  }, [connection, wallet, token]);

  return { balance, isLoading };
}