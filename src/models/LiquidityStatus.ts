// models/LiquidityStatus.ts
import mongoose from "mongoose";

const liquiditStatusSchema = new mongoose.Schema({

  poolId: { type: mongoose.Schema.Types.ObjectId, ref: "Pool", required: true },
  record: [
    {
      holder: {
        type: String,
        required: true,
      },
      time: { type: Date, default: Date.now },
      totalLiquidity: { type: Number, default: 0, required: true },
      Amount: { type: Number, default: 0, required: true },
      Direction: { type: Number, default: 0, required: true },
      tx: { type: String, required: true }
    },
  ],
});

const LiquidityStatus = mongoose.model("LiquidityStatus", liquiditStatusSchema);

export default LiquidityStatus;