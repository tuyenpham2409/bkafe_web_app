import mongoose from 'mongoose';


const mediaSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['image', 'video'], required: true },
    url: { type: String, required: true },
  },
  { _id: false }
);

const contactSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    message: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, 
    handled: { type: Boolean, default: false },
    media: { type: [mediaSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model('Contact', contactSchema);
