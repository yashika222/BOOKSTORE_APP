import mongoose, { Document, Model, Schema } from 'mongoose';

export interface BookAuthor {
  name: string;
  birth_year?: number | null;
  death_year?: number | null;
}

export interface IBookDocument extends Document {
  source: 'gutendex' | 'admin';
  sourceId: string;
  title: string;
  authors: BookAuthor[];
  author: string;
  subjects: string[];
  languages: string[];
  coverImage: string;
  formats: Record<string, string>;
  downloadCount: number;
  isbn?: string;
  description: string;
  publisher?: string;
  price?: number;
  originalPrice?: number;
  stock: number;
  rating?: number;
  reviewCount?: number;
  pricingSource: 'unset' | 'demo' | 'admin';
  genre?: string;
  category?: string;
  featured?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BookSchema = new Schema<IBookDocument>(
  {
    source: { type: String, enum: ['gutendex', 'admin'], default: 'gutendex', index: true },
    sourceId: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 500, index: true },
    authors: {
      type: [
        {
          name: { type: String, required: true },
          birth_year: { type: Number, default: null },
          death_year: { type: Number, default: null },
        },
      ],
      default: [],
    },
    author: { type: String, default: 'Unknown Author', index: true },
    subjects: { type: [String], default: [] },
    languages: { type: [String], default: ['en'] },
    coverImage: { type: String, default: '' },
    formats: { type: Schema.Types.Mixed, default: {} },
    downloadCount: { type: Number, default: 0, index: true },
    isbn: { type: String, default: undefined, index: true, sparse: true },
    description: { type: String, default: '' },
    publisher: { type: String, default: '' },
    price: { type: Number, min: 0 },
    originalPrice: { type: Number, min: 0 },
    stock: { type: Number, default: 0, min: 0 },
    rating: { type: Number, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0, min: 0 },
    pricingSource: { type: String, enum: ['unset', 'demo', 'admin'], default: 'unset' },
    genre: { type: String, default: '', index: true },
    category: { type: String, default: '', index: true },
    featured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

BookSchema.index({ title: 'text', author: 'text', description: 'text' });
BookSchema.index({ 'authors.name': 1 });
BookSchema.index({ subjects: 1 });

const Book: Model<IBookDocument> =
  mongoose.models.Book || mongoose.model<IBookDocument>('Book', BookSchema);

export default Book;
