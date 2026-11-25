import mongoose, { Document, Model, Schema } from 'mongoose';

export interface CartLine {
  bookId: string;
  qty: number;
  savedForLater: boolean;
}

export interface ICartDocument extends Document {
  userId: string;
  items: CartLine[];
  updatedAt: Date;
}

const CartSchema = new Schema<ICartDocument>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    items: {
      type: [
        {
          bookId: { type: String, required: true },
          qty: { type: Number, required: true, min: 1 },
          savedForLater: { type: Boolean, default: false },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

const Cart: Model<ICartDocument> =
  mongoose.models.UserCart || mongoose.model<ICartDocument>('UserCart', CartSchema);

export default Cart;
