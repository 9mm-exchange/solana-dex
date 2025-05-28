import React, { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import axios from 'axios';
import { ADMIN_WALLET, BACKEND_URL } from '../utils/util';
import { errorAlert, successAlert } from '../components/ui/ToastGroup';
import { TokenData } from '../types';
import { getMetadata, getMetaData2022 } from '../program/web3';
import { TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import { checkTokenStandard } from '../program/utils';
import { useNavigate } from 'react-router-dom';

const Admin: React.FC = () => {
  const { publicKey, connected } = useWallet();
  const navigate = useNavigate();
  const [tokens, setTokens] = useState<TokenData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newTokenAddress, setNewTokenAddress] = useState('');
  const [newTokenName, setNewTokenName] = useState('');
  const [newTokenSymbol, setNewTokenSymbol] = useState('');
  const [newTokenLogo, setNewTokenLogo] = useState('');

  // Check admin access
  useEffect(() => {
    if (connected && publicKey) {
      if (publicKey.toString() !== ADMIN_WALLET) {
        errorAlert('Access denied. Admin wallet required.');
        navigate('/');
      } else {
        fetchTokens();
      }
    }
  }, [publicKey, connected]);

  // Fetch all tokens
  const fetchTokens = async () => {
    try {
      const response = await axios.post(`${BACKEND_URL}/token/default`);
      if (Array.isArray(response.data)) {
        console.log("🚀 ~ fetchTokens ~ response:", response)
        setTokens(response.data);
      }
    } catch (error) {
      console.error('Error fetching tokens:', error);
      errorAlert('Failed to fetch tokens');
    }
  };

  // Handle adding new token
  const handleAddToken = async () => {
    if (!publicKey || publicKey.toString() !== ADMIN_WALLET) {
      errorAlert('Access denied. Admin wallet required.');
      return;
    }

    if (!newTokenAddress) {
      errorAlert('Please enter token address');
      return;
    }

    setIsLoading(true);
    try {
      // Fetch token metadata
      const tokenStandard = await checkTokenStandard(newTokenAddress);
      let metadata;
      
      if (tokenStandard === TOKEN_2022_PROGRAM_ID) {
        metadata = await getMetaData2022(newTokenAddress);
      } else {
        metadata = await getMetadata(newTokenAddress);
      }

      const tokenData: TokenData = {
        id: newTokenSymbol || metadata?.symbol || '',
        text: newTokenName || metadata?.name || '',
        address: newTokenAddress,
        name: newTokenName || metadata?.name || '',
        symbol: newTokenSymbol || metadata?.symbol || '',
        img: newTokenLogo || metadata?.img || 'https://swap.pump.fun/tokens/usde.webp'
      };

      const response = await axios.post(`${BACKEND_URL}/token/add`, {
        token: tokenData,
        wallet: 'ADMIN'
      });

      if (response.data.message === 'Token added successfully') {
        successAlert('Token added successfully');
        setNewTokenAddress('');
        setNewTokenName('');
        setNewTokenSymbol('');
        setNewTokenLogo('');
        fetchTokens();
      }
    } catch (error: any) {
      errorAlert(error.response?.data?.error || 'Failed to add token');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle removing token
  const handleRemoveToken = async (tokenAddress: string) => {
    if (!publicKey || publicKey.toString() !== ADMIN_WALLET) {
      errorAlert('Access denied. Admin wallet required.');
      return;
    }

    try {
      await axios.delete(`${BACKEND_URL}/token/remove`, {
        data: {
          mint: tokenAddress,
          wallet: 'ADMIN'
        }
      });
      successAlert('Token removed successfully');
      fetchTokens();
    } catch (error: any) {
      errorAlert(error.response?.data?.error || 'Failed to remove token');
    }
  };

  // If not admin, don't render the page
  if (!publicKey || publicKey.toString() !== ADMIN_WALLET) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Token List Management</h1>

      {/* Add New Token Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-8 shadow-lg">
        <h2 className="text-xl font-semibold mb-4">Add New Token</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Token Address</label>
            <input
              type="text"
              value={newTokenAddress}
              onChange={(e) => setNewTokenAddress(e.target.value)}
              className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              placeholder="Enter token address"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Token Name</label>
            <input
              type="text"
              value={newTokenName}
              onChange={(e) => setNewTokenName(e.target.value)}
              className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              placeholder="Enter token name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Token Symbol</label>
            <input
              type="text"
              value={newTokenSymbol}
              onChange={(e) => setNewTokenSymbol(e.target.value)}
              className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              placeholder="Enter token symbol"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Logo URL</label>
            <input
              type="text"
              value={newTokenLogo}
              onChange={(e) => setNewTokenLogo(e.target.value)}
              className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              placeholder="Enter logo URL"
            />
          </div>
        </div>
        <button
          onClick={handleAddToken}
          disabled={isLoading}
          className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
        >
          {isLoading ? 'Adding...' : 'Add Token'}
        </button>
      </div>

      {/* Token List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
        <h2 className="text-xl font-semibold mb-4">Token List</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b dark:border-gray-700">
                <th className="text-left p-4">Logo</th>
                <th className="text-left p-4">Name</th>
                <th className="text-left p-4">Symbol</th>
                <th className="text-left p-4">Address</th>
                <th className="text-left p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tokens.map((token) => (
                <tr key={token.address} className="border-b dark:border-gray-700">
                  <td className="p-4">
                    <img
                      src={token.img}
                      alt={token.symbol}
                      className="w-8 h-8 rounded-full"
                    />
                  </td>
                  <td className="p-4">{token.name}</td>
                  <td className="p-4">{token.symbol}</td>
                  <td className="p-4">
                    <div className="max-w-xs truncate">{token.address}</div>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => handleRemoveToken(token.address)}
                      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Admin; 