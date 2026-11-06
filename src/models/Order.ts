import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IOrderDocument extends Document {
  orderId: string;
  userId: string;
  userEmail: string;
  items: Array<{
    bookId: string;
    title: string;
    author: string;
    price: number;
    quantity: number;
    coverImage?: string;
  }>;
  subtotal: number;
  shippingFee: number;
  total: number;
  shippingAddress: {
    fullName: string;
    email: string;
    phone: string;
    addressLine: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentMethod: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrderDocument>(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    userEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    items: [
      {
        bookId: { type: String, required: true },
        title: { type: String, required: true },
        author: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true, min: 1 },
        coverImage: { type: String, default: '' },
      },
    ],
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    shippingFee: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    shippingAddress: {
      fullName: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
      addressLine: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, required: true, default: 'India' },
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
    paymentMethod: {
      type: String,
      default: 'simulated_card',
    },
  },
  {
    timestamps: true,
  }
);

const Order: Model<IOrderDocument> =
  mongoose.models.Order || mongoose.model<IOrderDocument>('Order', OrderSchema);

export default Order;
