import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/mongodb';
import Book from '@/models/Book';
import { getUserFromRequest } from '@/lib/auth';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

// GET /api/books/[id] - Get book by MongoDB ID or ISBN
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const id = params.id;

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
    logger.error(`Error retrieving book ${params.id}: ${error.message}`);
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
    const user = getUserFromRequest(request);

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Admin privileges required.' },
        { status: 403 }
      );
    }

    await connectToDatabase();
    const id = params.id;
    const body = await request.json();

    let book = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      book = await Book.findByIdAndUpdate(id, body, { new: true, runValidators: true });
    } else {
      book = await Book.findOneAndUpdate({ isbn: id }, body, { new: true, runValidators: true });
    }

    if (!book) {
      return NextResponse.json(
        { success: false, message: 'Book not found' },
        { status: 404 }
      );
    }

    logger.info(`Admin updated book "${book.title}" (${book.isbn})`);

    return NextResponse.json({
      success: true,
      message: 'Book updated successfully',
      data: book,
    });
  } catch (error: any) {
    logger.error(`Error updating book ${params.id}: ${error.message}`);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update book' },
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
    const user = getUserFromRequest(request);

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Admin privileges required.' },
        { status: 403 }
      );
    }

    await connectToDatabase();
    const id = params.id;

    let deleted = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      deleted = await Book.findByIdAndDelete(id);
    } else {
      deleted = await Book.findOneAndDelete({ isbn: id });
    }

    if (!deleted) {
      return NextResponse.json(
        { success: false, message: 'Book not found' },
        { status: 404 }
      );
    }

    logger.info(`Admin deleted book "${deleted.title}" (${deleted.isbn})`);

    return NextResponse.json({
      success: true,
      message: 'Book deleted successfully from catalog',
    });
  } catch (error: any) {
    logger.error(`Error deleting book ${params.id}: ${error.message}`);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete book' },
      { status: 500 }
    );
  }
}
