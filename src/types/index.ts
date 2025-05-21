import { PublicKey } from '@solana/web3.js';

/** ----------------------------- Token ----------------------------- **/

export interface Token {
  id: string;
  symbol: string;
  name: string;
  logoURI: string;
  balance?: string;
  price?: number;
  mint?: PublicKey;
  decimals: number;
}

/** ----------------------------- LP Position ----------------------------- **/

export interface LPPosition {
  id: string;
  token0: Token;
  token0Amount: string;
  token1: Token;
  token1Amount: string;
  liquidity: string;
  balance: string;
  apr: number;
  value: string;
  earned: string;
  poolType: string;
  feeTier: string;
  tvl: string;
  poolAddress?: PublicKey;
  lpMint?: PublicKey;
}

/** ----------------------------- Swap ----------------------------- **/

export interface SwapState {
  fromToken: Token | null;
  toToken: Token | null;
  fromAmount: string;
  toAmount: string;
  slippage: number;
  priceImpact: number;
}

/** ----------------------------- Transaction & Wallet ----------------------------- **/

export interface WalletError {
  code: number;
  message: string;
  name: string;
}

export interface TransactionState {
  status: 'idle' | 'pending' | 'success' | 'error';
  error?: WalletError;
  signature?: string;
}

/** ----------------------------- UI Component Props ----------------------------- **/

export interface PoolInfoCardProps {
  token0: Token | null;
  token1: Token | null;
  amount0: any;
  amount1: any;
  totalValueUSD: number;
  poolExists: boolean;
}

export interface PoolExistsWarningProps {
  token0: Token | null;
  token1: Token | null;
  onNavigate: () => void;
}

export interface TokenInputSectionProps {
  label: string;
  amount: string;
  token: Token | null;
  balance?: string;
  usdValue?: number;
  exceedsBalance: boolean;
  onChange: (value: string) => void;
  onSelectToken: () => void;
  onMaxClick?: () => void;
}

export interface TokenInputProps {
  value: string;
  onChange: (value: string) => void;
  onSelectToken: () => void;
  token: Token | null;
  label?: string;
  placeholder?: string;
  balance?: string;
  maxButton?: boolean;
  onMaxClick?: () => void;
  disabled?: boolean;
}

export interface PositionInputSectionProps {
  selectedPosition: LPPosition | null;
  onSelect: () => void;
  withdrawAmount: string;
  onAmountChange: (value: string) => void;
  onMaxClick: () => void;
  exceedsBalance: boolean;
}

export interface PositionSelectorModalProps {
  show: boolean;
  onClose: () => void;
  positions: LPPosition[];
  selectedPosition: LPPosition | null;
  onSelect: (position: LPPosition) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export interface PoolSelectorModalProps {
  show: boolean;
  onClose: () => void;
  positions: LPPosition[];
  selectedPosition: LPPosition | null;
  onSelect: (position: LPPosition) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export interface PoolSelectorButtonProps {
  position: LPPosition | null;
  onClick: () => void;
}

export interface PoolTableProps {
  pools: Array<{
    id: string;
    token0: Token;
    token1: Token;
    volume24h: string;
    volumeChange24h: string;
    fee24h: string;
    apr: number | string;
    liquidity: string;
    balance?: string;
    token0Amount?: string;
    token1Amount?: string;
    lpMint?: PublicKey;
  }>;
}

export interface PriceInfoCardProps {
  position: LPPosition;
  withdrawAmount: string;
  balance: string;
}

export interface TokenBreakdownCardProps {
  position: LPPosition;
  token0Amount: string;
  token1Amount: string;
  token0UsdValue: number;
  token1UsdValue: number;
  totalUsdValue: number;
}

export interface EmptyStateProps {
  title: string;
  description: string;
  buttonText: string;
  onButtonClick: () => void;
}

export interface PositionCardProps {
  position: {
    token0: Token;
    token1: Token;
    liquidity: string;
    apr: number | string;
    value: string;
    earned: string;
  };
}

export interface PoolStatsCardProps {
  title: string;
  value: string;
  gradient: string;
  icon: React.ReactNode;
}

export interface NoPoolWarningProps {
  token0Symbol: string;
  token1Symbol: string;
  onCreateNew: () => void;
}

export interface userInfo {
  _id?: string;
  name?: string;
  wallet: string;
  avatar?: string;
  // isLedger?: Boolean;
  isLedger?: number;
  signature?: string;
}

export interface TokenData {
  id: string;
  text: string;
  img: string;
  address: string;
  name?: string;
  symbol?: string;
  price?: number;
} 


export interface PoolData {
  vol: string;
  liquidity: string;
  address: string;
  lpMint: string;
  quoteToken?: {
    address: string;
    symbol: string;
    name: string;
    image: string;
    amount?: string;
  };
  baseToken?: {
    address: string;
    symbol: string;
    name: string;
    image: string;
    amount?: string;
  };
}


export interface PositionData {
  vol: string;
  liquidity: string;
  address: string;
  lpMint: string;
  quoteToken?: {
    address: string;
    symbol: string;
    name: string;
    image: string;
    amount?: string;
  };
  baseToken?: {
    address: string;
    symbol: string;
    name: string;
    image: string;
    amount?: string;
  };
}

export interface PoolDataNew {
  vol: string;
  liquidity: string;
  address: string;
  lpMint: string;
  quoteToken?: {
    address: string;
    symbol: string;
    name: string;
    image: string;
    amount?: string;
  };
  baseToken?: {
    address: string;
    symbol: string;
    name: string;
    image: string;
    amount?: string;
  };
}

export interface TransformedPool {
  token0: {
    symbol: string;
    logoURI: string;
    mint: string;
  };
  token1: {
    symbol: string;
    logoURI: string;
    mint: string;
  };
  liquidity: string;
  volume24h: string;
  volumeChange24h: string;
  fee24h: string;
  apr: string;
}


/** ----------------------------- Theme ----------------------------- **/

export type ThemeMode = 'dark' | 'light';


