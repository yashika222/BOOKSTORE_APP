import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IPendingRegistration extends Document {
  email: string;
  name: string;
  passwordHash: string;
  mobile: string;
  otpHash: string;
  otpExpires: Date;
  attempts: number;
  lastSentAt: Date;
  createdAt: Date;
}

const PendingRegistrationSchema = new Schema<IPendingRegistration>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    name: { type: String, required: true },
    passwordHash: { type: String, required: true },
    mobile: { type: String, default: '' },
    otpHash: { type: String, required: true },
    otpExpires: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
    lastSentAt: { type: Date, required: true },
  },
  { timestamps: true }
);

PendingRegistrationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 });

const PendingRegistration: Model<IPendingRegistration> =
  mongoose.models.PendingRegistration ||
  mongoose.model<IPendingRegistration>('PendingRegistration', PendingRegistrationSchema);

export default PendingRegistration;
