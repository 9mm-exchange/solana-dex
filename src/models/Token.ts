import mongoose from 'mongoose';

const tokenSchema = new mongoose.Schema({
  mint: { type: String, required: true },
  symbol: { type: String, required: true },
  name: { type: String, required: true },
  logoURI: { type: String, required: true },
  decimals: { type: Number, default: 0 },
  addedBy: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const Token = mongoose.model('Token', tokenSchema);

export default Token; 