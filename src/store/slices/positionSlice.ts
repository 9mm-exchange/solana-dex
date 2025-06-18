import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { PositionData } from '../../types';
import { getPoolListWithWallet } from '../../utils/getPoolList';
import { getTokenBalance } from '../../program/web3';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';

interface PositionState {
  positions: PositionData[];
  loading: boolean;
  error: string | null;
}

const initialState: PositionState = {
  positions: [],
  loading: false,
  error: null,
};

export const fetchPositions = createAsyncThunk(
  'positions/fetchPositions',
  async (wallet: ReturnType<typeof useWallet>, { rejectWithValue }) => {
    try {
      if (!wallet.publicKey) {
        return [];
      }
      const positionList = await getPoolListWithWallet(wallet.publicKey as PublicKey);
      console.log("🚀 ~ positionList:", positionList)
      const transformedPositions = await Promise.all(positionList.map(async pool => {
        let token0Amount = '0';
        let token1Amount = '0';
        let lpAmount = '0';
        
        if (pool.token0 && wallet.publicKey) {
          token0Amount = await getTokenBalance(wallet.publicKey.toBase58(), pool.token0.address);
        }
        if (pool.token1 && wallet.publicKey) {
          token1Amount = await getTokenBalance(wallet.publicKey.toBase58(), pool.token1.address);
        }
        if (pool.lpMint && wallet.publicKey) {
          lpAmount = await getTokenBalance(wallet.publicKey.toBase58(), pool.lpMint.toString());
        }

        return {
          ...pool,
          token0: pool.token0 ? {
            ...pool.token0,
            amount: token0Amount
          } : undefined,
          token1: pool.token1 ? {
            ...pool.token1,
            amount: token1Amount
          } : undefined,
          vol: pool.vol || '0',
          liquidity: lpAmount,
          address: pool.address,
          lpMint: pool.lpMint,
          userEarned: pool.userEarned
        };
      }));

      return transformedPositions;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch positions');
    }
  }
);

const positionSlice = createSlice({
  name: 'positions',
  initialState,
  reducers: {
    clearPositions: (state) => {
      state.positions = [];
      state.error = null;
    },
    updatePositionLiquidity: (state, action) => {
      const { lpMint, newLiquidity } = action.payload;
      const position = state.positions.find(p => p.lpMint?.toString() === lpMint.toString());
      if (position) {
        position.liquidity = newLiquidity;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPositions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPositions.fulfilled, (state, action) => {
        state.loading = false;
        state.positions = action.payload;
      })
      .addCase(fetchPositions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearPositions, updatePositionLiquidity } = positionSlice.actions;
export default positionSlice.reducer; 