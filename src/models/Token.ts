import mongoose from 'mongoose';

const tokenSchema = new mongoose.Schema({
  address: { type: String, required: true },
  symbol: { type: String, required: true },
  name: { type: String, required: true },
  image: { type: String, required: true },
  addedBy: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const Token = mongoose.model('Token', tokenSchema);

export default Token; 