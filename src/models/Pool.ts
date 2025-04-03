import mongoose from "mongoose";

const poolSchema = new mongoose.Schema({
  poolAddress : { type: String, required: true, unique: true },
  creator : { type: String, required: true },
  token0Mint : { type: String, required: true },
  token1Mint : { type: String, required: true },
  token0Amount : { type: String, required: true },
  token1Amount : { type: String, required: true },
  lpMint : { type: String, required: true },
  liquidity : { type: String, required: true },
});

const PoolModel = mongoose.model("PoolModel", poolSchema);

export default PoolModel;