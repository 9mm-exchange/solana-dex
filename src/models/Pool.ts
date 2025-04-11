import mongoose from "mongoose";

const poolSchema = new mongoose.Schema({
  poolAddress: { type: String, required: true },
  creator: { type: String, required: true },
  token0Mint: { type: String, required: true },
  token1Mint: { type: String, required: true },
  token0Amount: { type: String, required: true },
  token1Amount: { type: String, required: true },
  lpMint: { type: String, required: true },
  liquidity: { type: String, required: true },
  volume24h: { type: String, default: '0' },
  createdAt: { type: Date, default: Date.now }
});

const Pool = mongoose.model("Pool", poolSchema);

export default Pool;