import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IWishlistDocument extends Document {
  userId: string;
  bookIds: string[];
}

const WishlistSchema = new Schema<IWishlistDocument>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    bookIds: { type: [String], default: [] },
  },
  { timestamps: true }
);

const Wishlist: Model<IWishlistDocument> =
  mongoose.models.UserWishlist || mongoose.model<IWishlistDocument>('UserWishlist', WishlistSchema);

export default Wishlist;
