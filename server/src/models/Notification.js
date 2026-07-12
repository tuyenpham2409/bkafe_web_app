import mongoose from 'mongoose';


const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true }, 
    type: {
      type: String,
      enum: ['post_approved', 'post_rejected', 'reply', 'comment', 'system', 'new_pending_post', 'new_contact', 'account_banned', 'post_deleted_by_admin', 'post_edited_by_admin', 'post_rated', 'comment_rated'],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, default: '' },
    link: { type: String, default: '' }, 
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model('Notification', notificationSchema);
