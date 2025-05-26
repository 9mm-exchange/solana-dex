import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
// import { CiSearch } from "react-icons/ci";
// import { IoMdAdd } from "react-icons/io";
import { TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import { checkTokenStandard } from '../../program/utils';
import { getMetadata, getMetaData2022 } from '../../program/web3';
// import { successAlert, errorAlert, warningAlert } from '../../ToastGroup';
import { useWallet } from '@solana/wallet-adapter-react';
import axios from 'axios';
import { ChevronRight, Search, X } from 'lucide-react';
import { TokenList } from '../../../config';
import UserContext from '../../context/UserContext';
import { TokenData } from '../../types';
import { BACKEND_URL } from '../../utils/util';
import { errorAlert, successAlert } from '../ui/ToastGroup';
// import { Spinner } from '../Spinner';

interface SelectTokenModalProps {
  selectState: any;
  onSelect: (token: TokenData) => void | Promise<void>;
  onClose: () => void;
}

const SelectTokenModal: React.FC<SelectTokenModalProps> = ({ selectState, onSelect, onClose }) => {
  const { isLoading, setIsLoading, slippageModal, setSlippageModal } = useContext(UserContext);
  const { publicKey } = useWallet();
  const [searchQuery, setSearchQuery] = useState('');
  const [newTokenSymbol, setNewTokenSymbol] = useState('');
  const [newTokenName, setNewTokenName] = useState('');
  const [isMetadataFetched, setIsMetadataFetched] = useState(false);
  const [defaultTokens] = useState<TokenData[]>(TokenList.map(token => ({
    id: token.id,
    text: token.text,
    img: token.img,
    address: token.address,
    name: token.text,
    symbol: token.id
  })));
  const [customTokens, setCustomTokens] = useState<TokenData[]>([]);
  const menuDropdown = useRef<HTMLDivElement | null>(null);

  const hasFetched = useRef(false);

  // Helper function to fetch token metadata
  const fetchTokenMetadata = async (address: string) => {
    try {
      const tokenStandard = await checkTokenStandard(address);
      let metadata;

      if (tokenStandard === TOKEN_2022_PROGRAM_ID) {
        metadata = await getMetaData2022(address);
      } else {
        metadata = await getMetadata(address);
      }

      return metadata;
    } catch (error) {
      console.error("Error fetching metadata:", error);
      return null;
    }
  };

  // Fetch custom tokens on component mount
  useEffect(() => {
    const fetchCustomTokens = async () => {
      if (!publicKey) {
        setCustomTokens([]);
        return;
      }

      try {
        const response = await axios.post(`${BACKEND_URL}/user/getCustomList`, {
          wallet: publicKey.toString()
        });
        console.log("Tokenlist response", response);
        
        if (Array.isArray(response.data)) {
          const formattedTokens = response.data.map((token: any) => ({
            id: token.symbol || '',
            text: token.name || '',
            img: token.logoURI || 'https://swap.pump.fun/tokens/usde.webp',
            address: token.mint || '',
            name: token.name || '',
            symbol: token.symbol || ''
          }));
          setCustomTokens(formattedTokens);
        } else {
          setCustomTokens([]);
        }
      } catch (error) {
        console.error('Error fetching custom tokens:', error);
        setCustomTokens([]);
      }
    };
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchCustomTokens();
    }
  }, [publicKey]);

  // Enhanced search function
  const filteredTokens = [...defaultTokens, ...customTokens].filter(token =>
    (token.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (token.symbol?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (token.address || '').includes(searchQuery)
  );

  // Handle fetching metadata when searchQuery changes
  useEffect(() => {
    const fetchMetadata = async () => {
      if (searchQuery && searchQuery.length >= 43) {
        const metadata = await fetchTokenMetadata(searchQuery);
        if (metadata) {
          setNewTokenName(metadata.name || "");
          setNewTokenSymbol(metadata.symbol || "");
          setIsMetadataFetched(true);
        } else {
          setIsMetadataFetched(false);
        }
      } else {
        setNewTokenName("");
        setNewTokenSymbol("");
        setIsMetadataFetched(false);
      }
    };

    fetchMetadata();
  }, [searchQuery]);

  const handleAddToken = async () => {
    if (!publicKey) {
      errorAlert("Wallet not connected");
      return;
    }

    setIsLoading(true);
    
    console.log("Add new token with search query:", searchQuery);
    const metadata = await fetchTokenMetadata(searchQuery);
    
    if (!metadata) {
      errorAlert("Failed to fetch token metadata");
      return;
    }
    
    const newToken: TokenData = {
      id: metadata.symbol || newTokenSymbol || "",
      text: metadata.name || newTokenName || "",
      img: metadata.img || "https://swap.pump.fun/tokens/usde.webp",
      address: searchQuery,
      name: metadata.name || newTokenName || "",
      symbol: metadata.symbol || newTokenSymbol || ""
    };
    console.log("🚀 ~ handleAddToken ~ newToken:", newToken)

    try {
      const response = await axios.post(`${BACKEND_URL}/user/addToken`, {
        token: newToken,
        wallet: publicKey.toString()
      });
      
      if (response.data.message === "Token added successfully") {
        setIsLoading(false);
        successAlert("Token added successfully!");
        
        const tokensResponse = await axios.post(`${BACKEND_URL}/user/getCustomList`, {
          wallet: publicKey.toString()
        });
        
        if (Array.isArray(tokensResponse.data)) {
          const formattedTokens = tokensResponse.data.map((token: any) => ({
            id: token.symbol || '',
            text: token.name || '',
            img: token.logoURI || 'https://swap.pump.fun/tokens/usde.webp',
            address: token.mint || '',
            name: token.name || '',
            symbol: token.symbol || ''
          }));
          setCustomTokens(formattedTokens);
        }

        setSearchQuery('');
        setNewTokenSymbol('');
        setNewTokenName('');
        setIsMetadataFetched(false);
      } else {
        setIsLoading(false)
        errorAlert(response.data.error || "Failed to add token");
      }
    } catch (error: any) {
      setIsLoading(false)
      console.error("Error adding token:", error);
      errorAlert(error.response?.data?.error || "Failed to add token. Please try again.");
    }
  };

  // Handle outside clicks for modal
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuDropdown.current && !menuDropdown.current.contains(event.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuDropdown]);

  const popularTokens = useMemo(() => {
    const filteredTokens = defaultTokens.filter(token =>
      ['USDe', 'TRX', 'APT', 'WLD'].includes(token.id)
    );
  
    const uniqueTokens = Array.from(new Map(filteredTokens.map(token => [token.id, token])).values());
  
    return uniqueTokens;
  }, [defaultTokens]);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="w-full max-w-md p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-xl relative max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">Select Token</h3>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Close token selector"
            >
              <X size={20} />
            </button>
          </div>
          
          {/* Search Input */}
          <div className="relative mb-4">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by name, symbol or address"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              autoFocus
            />
          </div>
  
          {/* Popular Tokens */}
          {searchQuery === '' && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Popular Tokens</h4>
              <div className="flex flex-wrap gap-2">
                {popularTokens.map(token => (
                  <button
                    key={token.id}
                    onClick={() => onSelect(token)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors`}
                  >
  
                    <img 
                          src={token.img} 
                          alt={token.symbol} 
                          className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-800" 
                        />
                    <span className="font-medium">{token.symbol}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
  
          {/* Token List */}
          <div className="overflow-y-auto flex-grow -mx-2 px-2">
                {/* {filteredTokens.length === 0 ? (
                    <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                      <Search size={40} className="mx-auto mb-2 text-gray-300" />
                      <p>No tokens found</p>
                      {searchQuery && (
                        <button 
                          onClick={() => setSearchQuery('')}
                          className="mt-2 text-purple-600 dark:text-purple-400 hover:underline"
                        >
                          Clear search
                        </button>
                      )}
                    </div>
                  ) : ( */}
                <div className="divide-y divide-gray-100 dark:divide-gray-700">

                {filteredTokens.map((token, index) => (
                  <button
                    key={index}
                    onClick={() => onSelect(token)}
                    className={`w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors`}
                  >
                    <img 
                          src={token.img}
                          alt={token.name} 
                          className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800" 
                        />
                    <div className="text-left flex-grow">
                      <div className="font-medium">{token.symbol}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{token.name}</div>
                    </div>
                    <div className="flex items-center">
                      {/* {token.balance && ( */}
                        <div className="text-right mr-3">
                          <div className="font-medium">1.45
                            {/* {token.balance} */}
                            </div>
                          {/* {token.price && ( */}
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              $182.34
                              {/* {(parseFloat(token.balance) * token.price).toFixed(2)} */}
                            </div>
                          {/* )} */}
                        </div>
                      {/* )} */}
                      <ChevronRight size={16} className="text-gray-400" />
                    </div>
                  </button>
                ))}

                {searchQuery && filteredTokens.length < 3 && (
                  <div className='flex flex-col items-center justify-center p-2 gap-4'>
                    <div className='flex flex-row items-center justify-between gap-3 w-full'>
                      <p className='text-white w-24'>Name:</p>
                      <input
                        type="text"
                        placeholder="Name"
                        className={`bg-gray-900 w-full text-white outline-none p-2 ${isMetadataFetched ? 'opacity-75 cursor-not-allowed' : ''}`}
                        value={newTokenName}
                        onChange={(e) => setNewTokenName(e.target.value)}
                        disabled={isMetadataFetched}
                      />
                    </div>

                    <div className='flex flex-row items-center justify-between gap-3 w-full'>
                      <p className='text-white w-24'>Symbol:</p>
                      <input
                        type="text"
                        placeholder="Symbol"
                        className={`bg-gray-900 w-full text-white outline-none p-2 ${isMetadataFetched ? 'opacity-75 cursor-not-allowed' : ''}`}
                        value={newTokenSymbol}
                        onChange={(e) => setNewTokenSymbol(e.target.value)}
                        disabled={isMetadataFetched}
                      />
                    </div>

                    <div
                      className={`flex flex-row items-center justify-center p-3 bg-slate-900 rounded-md hover:bg-slate-600 transition-colors mt-2 ${filteredTokens.length !== 0 ? "bg-slate-900 cursor-not-allowed" : "bg-slate-800 cursor-pointer"}`}
                      onClick={ filteredTokens.length !== 0 ? undefined : handleAddToken}
                    >
                      <span className={`${filteredTokens.length !== 0 ? "text-gray-400" : "text-white"}`}>Add to token list</span>
                    </div>
                  </div>
                )} 
              </div>
            {/* )} */}
          </div>
        </div>
      </div>
          
    </>
  );
};

export default SelectTokenModal;
