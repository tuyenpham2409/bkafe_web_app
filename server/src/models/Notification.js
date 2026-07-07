import mongoose from 'mongoose';

// In-app notifications (e.g. post approved / rejected with reason, new reply).
const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true }, // recipient
    type: {
      type: String,
      enum: ['post_approved', 'post_rejected', 'reply', 'system', 'new_pending_post', 'new_contact'],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, default: '' },
    link: { type: String, default: '' }, // e.g. /post/<id>
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model('Notification', notificationSchema);
