// models/PoolStatus.ts
import mongoose from "mongoose";

const poolStatusSchema = new mongoose.Schema({

  poolId: { type: mongoose.Schema.Types.ObjectId, ref: "Pool", required: true },
  record: [
    {
      holder: {
        type: String,
        required: true,
      },
      time: { type: Date, default: Date.now },
      swapAmount: { type: Number, default: 0, required: true },
      swapDirection: { type: Number, default: 0, required: true },
      tx: { type: String, required: true },
    },
  ],
});

const PoolStatus = mongoose.model("PoolStatus", poolStatusSchema);

export default PoolStatus;