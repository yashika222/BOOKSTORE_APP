import mongoose, { Document, Model, Schema } from 'mongoose';

export interface RecentlyViewedBook {
  bookId: string;
  source: 'gutendex' | 'store';
  title: string;
  author: string;
  coverImage?: string;
  viewedAt: Date;
}

export interface IUserDocument extends Document {
  name: string;
  email: string;
  password?: string;
  googleId?: string;
  authProvider: 'local' | 'google';
  avatar?: string;
  role: 'customer' | 'admin';
  passwordResetTokenHash?: string;
  passwordResetExpires?: Date;
  passwordResetOtpHash?: string;
  passwordResetOtpExpires?: Date;
  passwordChangedAt?: Date;
  recentlyViewed: RecentlyViewedBook[];
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUserDocument>(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [60, 'Name cannot exceed 60 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email address'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address'],
      index: true,
    },
    password: {
      type: String,
      required: function requiredPassword(this: IUserDocument) {
        return this.authProvider !== 'google' && !this.googleId;
      },
      minlength: [8, 'Password must be at least 8 characters long'],
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    authProvider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local',
    },
    avatar: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      enum: ['customer', 'admin'],
      default: 'customer',
    },
    passwordResetTokenHash: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    passwordResetOtpHash: { type: String, select: false },
    passwordResetOtpExpires: { type: Date, select: false },
    passwordChangedAt: { type: Date, select: false },
    recentlyViewed: {
      type: [
        {
          bookId: { type: String, required: true },
          source: { type: String, enum: ['gutendex', 'store'], required: true },
          title: { type: String, required: true },
          author: { type: String, required: true },
          coverImage: { type: String, default: '' },
          viewedAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const User: Model<IUserDocument> =
  mongoose.models.User || mongoose.model<IUserDocument>('User', UserSchema);

export default User;
