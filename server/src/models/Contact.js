import mongoose from 'mongoose';

// Feedback / contact messages submitted from the "Giới thiệu & Liên hệ" page.
const contactSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    message: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // set if sent while logged in
    handled: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model('Contact', contactSchema);
