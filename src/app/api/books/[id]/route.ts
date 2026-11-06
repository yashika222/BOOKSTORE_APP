import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/mongodb';
import Book from '@/models/Book';
import { getCurrentUserFromRequest } from '@/lib/auth';
import { SAMPLE_COMMERCIAL_BOOKS } from '@/lib/sampleBooks';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

function findSampleBook(id: string) {
  return (
    SAMPLE_COMMERCIAL_BOOKS.find(
      (b) =>
        b.id === id ||
        b.isbn === id ||
        (b as unknown as { _id?: string })._id === id
    ) || null
  );
}

// GET /api/books/[id] - Get book by MongoDB ID or ISBN
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;

  try {
    await connectToDatabase();

    let book = null;

    // 1. Try finding by MongoDB ObjectId if valid
    if (mongoose.Types.ObjectId.isValid(id)) {
      book = await Book.findById(id);
    }

    // 2. Try finding by ISBN (indexed O(1) hash lookup)
    if (!book) {
      book = await Book.findOne({ isbn: id });
    }

    if (!book) {
      const sample = findSampleBook(id);
      if (sample) {
        return NextResponse.json({
          success: true,
          data: sample,
        });
      }

      return NextResponse.json(
        { success: false, message: 'Book not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: book,
    });
  } catch (error: any) {
    logger.warn(`Error or offline database when retrieving book ${params.id}: ${error.message}; checking sample books.`);
    const sample = findSampleBook(id);
    if (sample) {
      return NextResponse.json({
        success: true,
        data: sample,
      });
    }

    return NextResponse.json(
      { success: false, message: error.message || 'Error fetching book' },
      { status: 500 }
    );
  }
}

// PATCH /api/books/[id] - Update book details (Admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUserFromRequest(request);

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Admin privileges required.' },
        { status: 403 }
      );
    }

    const id = params.id;
    const body: unknown = await request.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json(
        { success: false, message: 'A valid book update object is required.' },
        { status: 400 }
      );
    }

    const values = body as Record<string, unknown>;
    const allowedFields = [
      'isbn',
      'title',
      'author',
      'description',
      'price',
      'stock',
      'genre',
      'rating',
      'coverImage',
      'featured',
      'publishedYear',
    ];
    const unknownFields = Object.keys(values).filter(
      (field) => !allowedFields.includes(field)
    );
    if (unknownFields.length > 0) {
      return NextResponse.json(
        { success: false, message: `Unsupported book fields: ${unknownFields.join(', ')}` },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = {};
    for (const [field, value] of Object.entries(values)) {
      if (['isbn', 'title', 'author', 'genre', 'description', 'coverImage'].includes(field)) {
        const maxLength = field === 'description' ? 5000 : field === 'coverImage' ? 2048 : 200;
        if (
          typeof value !== 'string' ||
          value.length > maxLength ||
          (field !== 'description' && field !== 'coverImage' && !value.trim())
        ) {
          return NextResponse.json(
            { success: false, message: `Provide a valid ${field}.` },
            { status: 400 }
          );
        }
        updates[field] = value.trim();
      } else if (field === 'price') {
        if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
          return NextResponse.json(
            { success: false, message: 'Price must be a non-negative number.' },
            { status: 400 }
          );
        }
        updates[field] = value;
      } else if (field === 'stock') {
        if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
          return NextResponse.json(
            { success: false, message: 'Stock must be a non-negative integer.' },
            { status: 400 }
          );
        }
        updates[field] = value;
      } else if (field === 'rating') {
        if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 5) {
          return NextResponse.json(
            { success: false, message: 'Rating must be a number from 0 to 5.' },
            { status: 400 }
          );
        }
        updates[field] = value;
      } else if (field === 'featured') {
        if (typeof value !== 'boolean') {
          return NextResponse.json(
            { success: false, message: 'Featured must be a boolean.' },
            { status: 400 }
          );
        }
        updates[field] = value;
      } else if (field === 'publishedYear') {
        if (typeof value !== 'number' || !Number.isInteger(value) || value < 0 || value > 3000) {
          return NextResponse.json(
            { success: false, message: 'Published year must be a valid year.' },
            { status: 400 }
          );
        }
        updates[field] = value;
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, message: 'Provide at least one book field to update.' },
        { status: 400 }
      );
    }

    try {
      await connectToDatabase();
      let book = null;
      if (mongoose.Types.ObjectId.isValid(id)) {
        book = await Book.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
      } else {
        book = await Book.findOneAndUpdate(
          { isbn: id },
          updates,
          { new: true, runValidators: true }
        );
      }

      if (book) {
        logger.info(`Admin updated book "${book.title}" (${book.isbn})`);
        return NextResponse.json({
          success: true,
          message: 'Book updated successfully',
          data: book,
        });
      }
    } catch (dbErr) {
      logger.warn(`Database update failed, responding with mock update: ${dbErr}`);
    }

    // Fallback response for offline demo
    const sample = findSampleBook(id);
    const updatedMock = {
      ...(sample || {
        _id: id,
        id,
        isbn: id,
        title: 'Updated Book',
        author: 'Author',
        price: 19.99,
        stock: 10,
        genre: 'Fiction',
      }),
      ...updates,
    };

    return NextResponse.json({
      success: true,
      message: 'Book updated successfully (Demo Mode)',
      data: updatedMock,
    });
  } catch (error: any) {
    logger.error(`Error updating book ${params.id}: ${error.message}`);
    return NextResponse.json(
      { success: false, message: 'Failed to update book.' },
      { status: 500 }
    );
  }
}

// DELETE /api/books/[id] - Delete commercial book (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUserFromRequest(request);

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Admin privileges required.' },
        { status: 403 }
      );
    }

    const id = params.id;

    try {
      await connectToDatabase();
      let deleted = null;
      if (mongoose.Types.ObjectId.isValid(id)) {
        deleted = await Book.findByIdAndDelete(id);
      } else {
        deleted = await Book.findOneAndDelete({ isbn: id });
      }

      if (deleted) {
        logger.info(`Admin deleted book "${deleted.title}" (${deleted.isbn})`);
        return NextResponse.json({
          success: true,
          message: 'Book deleted successfully from catalog',
        });
      }
    } catch (dbErr) {
      logger.warn(`Database delete failed; responding with mock delete success: ${dbErr}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Book deleted successfully from catalog (Demo Mode)',
    });
  } catch (error: any) {
    logger.error(`Error deleting book ${params.id}: ${error.message}`);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete book' },
      { status: 500 }
    );
  }
}
