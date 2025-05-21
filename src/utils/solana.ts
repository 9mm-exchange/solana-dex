import { 
  Connection, 
  PublicKey, 
  Transaction, 
  LAMPORTS_PER_SOL,
  TransactionSignature 
} from '@solana/web3.js';
import { 
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  getAccount,
  getMint,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID
} from '@solana/spl-token';
import { WalletContextState } from '@solana/wallet-adapter-react';
import toast from 'react-hot-toast';

export const WRAPPED_SOL_MINT = new PublicKey('So11111111111111111111111111111111111111112');

export interface Token {
  mint: PublicKey | null;
  decimals: number;
  symbol?: string;
  name?: string;
}

export interface TransactionState {
  status: 'success' | 'error';
  signature?: TransactionSignature;
  error?: {
    code: number;
    message: string;
    name: string;
  };
}

export async function getTokenBalance(
  connection: Connection,
  wallet: WalletContextState,
  token: Token
): Promise<string> {
  if (!wallet.publicKey) throw new Error('Wallet not connected');
  if (!token.mint) throw new Error('Token mint address is required');

  try {
    // Handle SOL balance
    if (token.mint.equals(WRAPPED_SOL_MINT)) {
      const balance = await connection.getBalance(wallet.publicKey);
      return (balance / LAMPORTS_PER_SOL).toString();
    }

    // Handle token balance
    const tokenAccount = await getAssociatedTokenAddress(
      token.mint,
      wallet.publicKey,
      false, // not a delegate
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    try {
      const accountInfo = await getAccount(connection, tokenAccount);
      const mintInfo = await getMint(connection, token.mint);
      return (Number(accountInfo.amount) / Math.pow(10, mintInfo.decimals)).toString();
    } catch (error) {
      // Token account doesn't exist
      return '0';
    }
  } catch (error) {
    console.error('Error getting token balance:', error);
    return '0';
  }
}

export async function createTokenAccount(
  connection: Connection,
  wallet: WalletContextState,
  mint: PublicKey
): Promise<PublicKey> {
  if (!wallet.publicKey) throw new Error('Wallet not connected');
  if (!wallet.sendTransaction) throw new Error('Wallet does not support sending transactions');

  const associatedTokenAddress = await getAssociatedTokenAddress(
    mint,
    wallet.publicKey,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  try {
    // Check if account already exists
    const accountInfo = await connection.getAccountInfo(associatedTokenAddress);
    if (accountInfo) return associatedTokenAddress;

    const transaction = new Transaction().add(
      createAssociatedTokenAccountInstruction(
        wallet.publicKey,
        associatedTokenAddress,
        wallet.publicKey,
        mint,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      )
    );

    transaction.feePayer = wallet.publicKey;
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;

    const signature = await wallet.sendTransaction(transaction, connection);
    await connection.confirmTransaction(signature);

    return associatedTokenAddress;
  } catch (error) {
    console.error('Error creating token account:', error);
    throw error;
  }
}

export async function handleTransaction(
  promise: Promise<TransactionSignature>,
  successMessage: string
): Promise<TransactionState> {
  try {
    const loadingToast = toast.loading('Transaction pending...');
    const signature = await promise;
    
    toast.dismiss(loadingToast);
    toast.success(successMessage);
    
    return {
      status: 'success',
      signature
    };
  } catch (error: any) {
    console.error('Transaction error:', error);
    
    toast.error(error.message || 'Transaction failed');
    
    return {
      status: 'error',
      error: {
        code: error.code || -1,
        message: error.message || 'Unknown error',
        name: error.name || 'TransactionError'
      }
    };
  }
}

export function shortenAddress(address: string | PublicKey, chars = 4): string {
  const addr = typeof address === 'string' ? address : address.toString();
  return `${addr.slice(0, chars)}...${addr.slice(-chars)}`;
}

export function formatAmount(amount: string | number, decimals: number = 6): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: decimals
  });
}

// Utility function to check if token account exists
export async function tokenAccountExists(
  connection: Connection,
  mint: PublicKey,
  wallet: WalletContextState
): Promise<boolean> {
  if (!wallet.publicKey) return false;
  
  const tokenAccount = await getAssociatedTokenAddress(
    mint,
    wallet.publicKey,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  try {
    const accountInfo = await connection.getAccountInfo(tokenAccount);
    return accountInfo !== null;
  } catch {
    return false;
  }
}

export function sendTransaction(): Promise<string> {
  return new Promise((resolve) => {
    const delay = Math.random() * 2000 + 1000; // simulate 1-3 seconds delay
    setTimeout(() => {
      const fakeHash = '0x' + Math.floor(Math.random() * 1e16).toString(16).padStart(64, '0');
      console.log('Simulated transaction sent:', fakeHash);
      resolve(fakeHash);
    }, delay);
  });
}