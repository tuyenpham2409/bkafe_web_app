import mongoose from 'mongoose';

// Simple key/value counters (currently: total website views).
const counterSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: Number, default: 0 },
});

export default mongoose.model('Counter', counterSchema);
