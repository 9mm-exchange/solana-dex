import { useConnection } from '@solana/wallet-adapter-react';
import { useCallback, useEffect, useState } from 'react';
import { Connection } from '@solana/web3.js';

export function useSolanaConnection() {
  const { connection } = useConnection();
  const [isConnected, setIsConnected] = useState(false);

  const checkConnection = useCallback(async () => {
    try {
      const version = await connection.getVersion();
      setIsConnected(true);
      return true;
    } catch (error) {
      console.error('Connection error:', error);
      setIsConnected(false);
      return false;
    }
  }, [connection]);

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  return {
    connection,
    isConnected,
    checkConnection
  };
}