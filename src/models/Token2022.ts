import mongoose from 'mongoose';

const token2022Schema = new mongoose.Schema({
  mint: { type: String, required: true },
  creator: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const Token2022 = mongoose.model('Token2022', token2022Schema);

export default Token2022; 