import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { TokenData } from '../../types';
import axios from 'axios';
import { BACKEND_URL } from '../../utils/util';
import { WalletContextState } from '@solana/wallet-adapter-react';

interface TokenState {
  platformTokens: TokenData[];
  customTokens: TokenData[];
  loading: boolean;
  error: string | null;
}

const initialState: TokenState = {
  platformTokens: [],
  customTokens: [],
  loading: false,
  error: null,
};

export const fetchPlatformTokens = createAsyncThunk(
  'tokens/fetchPlatformTokens',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${BACKEND_URL}/token/default`);
      if (Array.isArray(response.data)) {
        return response.data.map((token: any) => ({
          id: token.symbol || '',
          text: token.name || '',
          img: token.logoURI || 'https://swap.pump.fun/tokens/usde.webp',
          address: token.mint || '',
          name: token.name || '',
          symbol: token.symbol || ''
        }));
      }
      return [];
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch platform tokens');
    }
  }
);

export const fetchCustomTokens = createAsyncThunk(
  'tokens/fetchCustomTokens',
  async (wallet: WalletContextState, { rejectWithValue }) => {
    try {
      if (!wallet.publicKey) {
        return [];
      }

      const response = await axios.post(`${BACKEND_URL}/token/custom`, {
        wallet: wallet.publicKey.toString()
      });

      if (Array.isArray(response.data)) {
        return response.data.map((token: any) => ({
          id: token.symbol || '',
          text: token.name || '',
          img: token.logoURI || 'https://swap.pump.fun/tokens/usde.webp',
          address: token.mint || '',
          name: token.name || '',
          symbol: token.symbol || ''
        }));
      }
      return [];
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch custom tokens');
    }
  }
);

export const addCustomToken = createAsyncThunk(
  'tokens/addCustomToken',
  async ({ token, wallet }: { token: TokenData; wallet: WalletContextState }, { rejectWithValue }) => {
    try {
      if (!wallet.publicKey) {
        throw new Error('Wallet not connected');
      }

      const response = await axios.post(`${BACKEND_URL}/token/add`, {
        token,
        wallet: wallet.publicKey.toString()
      });

      if (response.data.message === "Token added successfully") {
        return token;
      }
      throw new Error(response.data.error || "Failed to add token");
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to add token');
    }
  }
);

const tokenSlice = createSlice({
  name: 'tokens',
  initialState,
  reducers: {
    clearTokens: (state) => {
      state.platformTokens = [];
      state.customTokens = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Platform Tokens
      .addCase(fetchPlatformTokens.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPlatformTokens.fulfilled, (state, action) => {
        state.loading = false;
        state.platformTokens = action.payload;
      })
      .addCase(fetchPlatformTokens.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Custom Tokens
      .addCase(fetchCustomTokens.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomTokens.fulfilled, (state, action) => {
        state.loading = false;
        state.customTokens = action.payload;
      })
      .addCase(fetchCustomTokens.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Add Custom Token
      .addCase(addCustomToken.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addCustomToken.fulfilled, (state, action) => {
        state.loading = false;
        state.customTokens.push(action.payload);
      })
      .addCase(addCustomToken.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearTokens } = tokenSlice.actions;
export default tokenSlice.reducer; 