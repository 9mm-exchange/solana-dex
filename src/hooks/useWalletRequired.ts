import { useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export const useWalletRequired = () => {
  const { connected } = useWallet();
  const navigate = useNavigate();

  useEffect(() => {
    if (!connected) {
      toast.error('Please connect your wallet to continue');
      navigate('/');
    }
  }, [connected, navigate]);

  return connected;
};