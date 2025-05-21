import { PublicKey } from '@solana/web3.js';
import { Token, LPPosition } from '../types';
import { WRAPPED_SOL_MINT } from '../utils/solana';

// Enhanced tokens data with more Solana ecosystem tokens
export const tokens: Token[] = [
  {
    id: '1',
    symbol: 'SOL',
    name: 'Solana',
    logoURI: 'https://s2.coinmarketcap.com/static/img/coins/64x64/5426.png',
    balance: '1.45',
    price: 125.75,
    mint: WRAPPED_SOL_MINT,
    decimals: 9
  },
  {
    id: '2',
    symbol: 'USDC',
    name: 'USD Coin',
    logoURI: 'https://s2.coinmarketcap.com/static/img/coins/64x64/3408.png',
    balance: '5280.42',
    price: 1.00,
    mint: new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
    decimals: 6
  },
  {
    id: '3',
    symbol: 'USDT',
    name: 'Tether USD',
    logoURI: 'https://s2.coinmarketcap.com/static/img/coins/64x64/825.png',
    balance: '3500.00',
    price: 1.00,
    mint: new PublicKey('Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'),
    decimals: 6
  },
  {
    id: '4',
    symbol: 'RAY',
    name: 'Raydium',
    logoURI: 'https://s2.coinmarketcap.com/static/img/coins/64x64/8526.png',
    balance: '1250.00',
    price: 1.25,
    mint: new PublicKey('4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R'),
    decimals: 6
  },
  {
    id: '5',
    symbol: 'JUP',
    name: 'Jupiter',
    logoURI: 'https://s2.coinmarketcap.com/static/img/coins/64x64/29210.png',
    balance: '3200.00',
    price: 0.45,
    mint: new PublicKey('JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN'),
    decimals: 6
  },
  {
    id: '6',
    symbol: 'BONK',
    name: 'Bonk',
    logoURI: 'https://s2.coinmarketcap.com/static/img/coins/64x64/23095.png',
    balance: '5000000.00',
    price: 0.000012,
    mint: new PublicKey('DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263'),
    decimals: 5
  },
  {
    id: '7',
    symbol: 'MSOL',
    name: 'Marinade Staked SOL',
    logoURI: 'https://s2.coinmarketcap.com/static/img/coins/64x64/11461.png',
    balance: '2.10',
    price: 126.50,
    mint: new PublicKey('mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So'),
    decimals: 9
  },
  {
    id: '8',
    symbol: 'JTO',
    name: 'Jito',
    logoURI: 'https://s2.coinmarketcap.com/static/img/coins/64x64/28541.png',
    balance: '1500.00',
    price: 1.80,
    mint: new PublicKey('jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL'),
    decimals: 6
  },
  {
    id: '9',
    symbol: 'PYTH',
    name: 'Pyth Network',
    logoURI: 'https://s2.coinmarketcap.com/static/img/coins/64x64/28177.png',
    balance: '4200.00',
    price: 0.32,
    mint: new PublicKey('HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3'),
    decimals: 6
  },
  {
    id: '10',
    symbol: 'WIF',
    name: 'Dogwifhat',
    logoURI: 'https://assets.coingecko.com/coins/images/33566/standard/dogwifhat.jpg',
    balance: '1200.00',
    price: 2.10,
    mint: new PublicKey('EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm'),
    decimals: 6
  }
];

// Enhanced LP positions with more realistic data for withdrawal
export const lpPositions: LPPosition[] = [
  {
    id: '1',
    token0: tokens[0], // SOL
    token1: tokens[1], // USDC
    token0Amount: '1.5',
    token1Amount: '187.50',
    liquidity: '1.5 SOL + 187.5 USDC',
    apr: 24.5,
    value: '$376.88',
    earned: '$45.80',
    poolAddress: new PublicKey('58oQChx4yWmvKdwLLZzBi4ChoCc2fqCUWBkwMihLYQo2'),
    balance: '1.5', // LP token balance
    poolType: 'Raydium',
    feeTier: '0.25%',
    tvl: '$12,450,000',
    lpMint: new PublicKey('SoLEao8wTzSfqhuou8rcYsVoLjthVmiXuEjzdNPMnCz')
  },
  {
    id: '2',
    token0: tokens[0], // SOL
    token1: tokens[5], // BONK
    token0Amount: '2.1',
    token1Amount: '4200000',
    liquidity: '2.1 SOL + 4,200,000 BONK',
    apr: 45.2,
    value: '$264.08',
    earned: '$32.50',
    poolAddress: new PublicKey('8Gf8Cc6yr9fM7SfWQ1Lnp5oQyN1moHqD1kL2q8QJQ6tK'),
    balance: '2.1',
    poolType: 'Orca',
    feeTier: '0.30%',
    tvl: '$8,750,000',
    lpMint: new PublicKey('9Gf8Cc6yr9fM7SfWQ1Lnp5oQyN1moHqD1kL2q8QJQ6tK')
  },
  {
    id: '3',
    token0: tokens[1], // USDC
    token1: tokens[2], // USDT
    token0Amount: '2500',
    token1Amount: '2498.75',
    liquidity: '2,500 USDC + 2,498.75 USDT',
    apr: 5.2,
    value: '$4,998.75',
    earned: '$65.20',
    poolAddress: new PublicKey('5Z1Gywv6P8n8rndXZPVogJ8YVYyA6vEgQeD4g1ZYy1dK'),
    balance: '2500',
    poolType: 'Saber',
    feeTier: '0.01%',
    tvl: '$42,100,000',
    lpMint: new PublicKey('2poo1w1DL6yd2WNTCnNTzDqkC6MBXq7axo77P16yrBuf')
  },
  {
    id: '4',
    token0: tokens[0], // SOL
    token1: tokens[6], // MSOL
    token0Amount: '3.2',
    token1Amount: '3.15',
    liquidity: '3.2 SOL + 3.15 mSOL',
    apr: 8.5,
    value: '$800.40',
    earned: '$12.30',
    poolAddress: new PublicKey('mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So'),
    balance: '3.2',
    poolType: 'Marinade',
    feeTier: '0.10%',
    tvl: '$15,200,000',
    lpMint: new PublicKey('So11111111111111111111111111111111111111112')
  },
  {
    id: '5',
    token0: tokens[3], // RAY
    token1: tokens[1], // USDC
    token0Amount: '1250',
    token1Amount: '1560',
    liquidity: '1,250 RAY + 1,560 USDC',
    apr: 15.8,
    value: '$3,125.00',
    earned: '$82.50',
    poolAddress: new PublicKey('5Z1Kywv6P8n8rndXZPVogJ8YVYyA6vEgQeD4g1ZYy1dK'),
    balance: '1250',
    poolType: 'Raydium',
    feeTier: '0.25%',
    tvl: '$28,750,000',
    lpMint: new PublicKey('4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R')
  },
  {
    id: '6',
    token0: tokens[4], // JUP
    token1: tokens[1], // USDC
    token0Amount: '15000',
    token1Amount: '6750',
    liquidity: '15,000 JUP + 6,750 USDC',
    apr: 32.5,
    value: '$13,500.00',
    earned: '$850.00',
    poolAddress: new PublicKey('JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN'),
    balance: '15000',
    poolType: 'Jupiter',
    feeTier: '0.30%',
    tvl: '$62,100,000',
    lpMint: new PublicKey('JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN')
  },
  {
    id: '7',
    token0: tokens[7], // JTO
    token1: tokens[0], // SOL
    token0Amount: '1200',
    token1Amount: '21.6',
    liquidity: '1,200 JTO + 21.6 SOL',
    apr: 22.6,
    value: '$5,400.00',
    earned: '$240.00',
    poolAddress: new PublicKey('jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL'),
    balance: '1200',
    poolType: 'Orca',
    feeTier: '0.25%',
    tvl: '$18,600,000',
    lpMint: new PublicKey('jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL')
  },
  {
    id: '8',
    token0: tokens[8], // PYTH
    token1: tokens[1], // USDC
    token0Amount: '10000',
    token1Amount: '3200',
    liquidity: '10,000 PYTH + 3,200 USDC',
    apr: 25.4,
    value: '$6,400.00',
    earned: '$320.00',
    poolAddress: new PublicKey('HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3'),
    balance: '10000',
    poolType: 'Raydium',
    feeTier: '0.30%',
    tvl: '$35,200,000',
    lpMint: new PublicKey('HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3')
  },
  {
    id: '9',
    token0: tokens[9], // WIF
    token1: tokens[1], // USDC
    token0Amount: '2500',
    token1Amount: '5250',
    liquidity: '2,500 WIF + 5,250 USDC',
    apr: 28.7,
    value: '$10,500.00',
    earned: '$630.00',
    poolAddress: new PublicKey('EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm'),
    balance: '2500',
    poolType: 'Orca',
    feeTier: '0.25%',
    tvl: '$42,800,000',
    lpMint: new PublicKey('EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm')
  },
  {
    id: '10',
    token0: tokens[0], // SOL
    token1: tokens[4], // JUP
    token0Amount: '5.5',
    token1Amount: '12222.22',
    liquidity: '5.5 SOL + 12,222.22 JUP',
    apr: 18.9,
    value: '$1,375.00',
    earned: '$52.50',
    poolAddress: new PublicKey('5Z1Gywv6P8n8rndXZPVogJ8YVYyA6vEgQeD4g1ZYy1dK'),
    balance: '5.5',
    poolType: 'Raydium',
    feeTier: '0.25%',
    tvl: '$15,800,000',
    lpMint: new PublicKey('4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R')
  }
];

// Mock user positions (subset of all positions)
export const myPositions = [
  lpPositions[0], // SOL/USDC
  lpPositions[2], // USDC/USDT
  lpPositions[5], // JUP/USDC
  lpPositions[8]  // WIF/USDC
];

// Enhanced top pools with volume data
export const topPoolsByVolume = lpPositions.map(pool => ({
  ...pool,
  volume24h: `$${(Math.random() * 5000000).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`,
  volumeChange24h: (Math.random() * 50 - 10).toFixed(1),
  fee24h: `$${(Math.random() * 15000).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
})).sort((a, b) => 
  parseFloat(b.volume24h.replace(/[^0-9.]/g, '')) - 
  parseFloat(a.volume24h.replace(/[^0-9.]/g, ''))
).slice(0, 10); // now it's applied to the sorted array


// Feature items for homepage
export const features = [
  {
    title: 'Lightning Fast Swaps',
    description: 'Execute trades instantly on Solana with minimal slippage and fees',
    icon: 'EtherealIcon'
  },
  {
    title: 'High Yield Liquidity Pools',
    description: 'Earn passive income by providing liquidity to token pairs',
    icon: 'LineChart'
  },
  {
    title: 'Secure Transactions',
    description: 'Your funds are secured with Solana\'s industry-leading technology',
    icon: 'Wallet'
  },
  {
    title: 'Low Fees',
    description: 'Enjoy some of the lowest fees in DeFi for all transactions',
    icon: 'DollarSign'
  }
];