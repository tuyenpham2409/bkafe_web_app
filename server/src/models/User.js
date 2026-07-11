import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    // login username: unique, lowercase. Can be changed exactly once by the user.
    username: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    usernameChanged: { type: Boolean, default: false },
    displayName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    photoURL: { type: String, default: '' },
    bio: { type: String, default: '' },
    lastActiveAt: { type: Date, default: Date.now },
    // Admin can restrict specific activities
    bannedPosting:    { type: Boolean, default: false },
    bannedCommenting: { type: Boolean, default: false },
    banReason:        { type: String, default: '' },
  },
  { timestamps: true }
);

userSchema.methods.setPassword = async function (plain) {
  this.passwordHash = await bcrypt.hash(plain, 10);
};

userSchema.methods.verifyPassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

// Shape returned to clients (never leak the hash).
userSchema.methods.toPublic = function () {
  return {
    id: this._id,
    username: this.username,
    usernameChanged: this.usernameChanged,
    displayName: this.displayName,
    email: this.email,
    role: this.role,
    photoURL: this.photoURL,
    bio: this.bio,
    joinedAt: this.createdAt,
    lastActiveAt: this.lastActiveAt,
    bannedPosting: this.bannedPosting,
    bannedCommenting: this.bannedCommenting,
    banReason: this.banReason,
  };
};

export default mongoose.model('User', userSchema);
