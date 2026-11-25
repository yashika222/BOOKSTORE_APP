import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IAddressDocument extends Document {
  userId: string;
  fullName: string;
  mobile: string;
  pincode: string;
  locality: string;
  addressLine: string;
  city: string;
  state: string;
  addressType: 'Home' | 'Work' | 'Other';
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AddressSchema = new Schema<IAddressDocument>(
  {
    userId: { type: String, required: true, index: true },
    fullName: { type: String, required: true, trim: true, maxlength: 80 },
    mobile: { type: String, required: true, trim: true, maxlength: 15 },
    pincode: { type: String, required: true, trim: true, maxlength: 10 },
    locality: { type: String, required: true, trim: true, maxlength: 120 },
    addressLine: { type: String, required: true, trim: true, maxlength: 240 },
    city: { type: String, required: true, trim: true, maxlength: 80 },
    state: { type: String, required: true, trim: true, maxlength: 80 },
    addressType: { type: String, enum: ['Home', 'Work', 'Other'], default: 'Home' },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Address: Model<IAddressDocument> =
  mongoose.models.Address || mongoose.model<IAddressDocument>('Address', AddressSchema);

export default Address;
