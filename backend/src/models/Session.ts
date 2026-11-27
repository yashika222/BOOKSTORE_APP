import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export interface ISessionDocument extends Document {
  userId: Types.ObjectId;
  jti: string;
  expiresAt: Date;
  absoluteExpiresAt: Date;
  passwordVersion: Date | null;
  revokedAt?: Date | null;
  createdAt: Date;
}

const SessionSchema = new Schema<ISessionDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    jti: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    absoluteExpiresAt: { type: Date, required: true },
    passwordVersion: { type: Date, default: null },
    revokedAt: { type: Date, default: null, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Session: Model<ISessionDocument> =
  mongoose.models.Session || mongoose.model<ISessionDocument>('Session', SessionSchema);

export default Session;
