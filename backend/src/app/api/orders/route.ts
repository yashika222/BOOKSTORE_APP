import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/mongodb';
import Book from '@/models/Book';
import Order, { IOrderDocument } from '@/models/Order';
import { getCurrentUserFromRequest } from '@/lib/auth';
import logger from '@/lib/logger';
import { queueEmail, sendOrderConfirmationEmail } from '@/lib/mail';
import { shippingFeeFor } from '@/lib/currency';

export const dynamic = 'force-dynamic';

interface SubmittedOrderItem {
  bookId?: unknown;
  qty?: unknown;
  isCommercial?: unknown;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

// GET /api/orders - Customers see their own orders; admins see all orders.
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Please log in to view orders.' },
        { status: 401 }
      );
    }

    try {
      await connectToDatabase();
      const query = user.role === 'admin' ? {} : { userId: user.userId };
      const orders = await Order.find(query).sort({ createdAt: -1 });

      return NextResponse.json({
        success: true,
        count: orders.length,
        data: orders,
      });
    } catch (dbErr) {
      logger.warn(`Database offline when fetching orders, returning empty order list: ${dbErr}`);
      return NextResponse.json({
        success: true,
        count: 0,
        data: [],
      });
    }
  } catch (error) {
    logger.error(`Error fetching orders: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return NextResponse.json(
      { success: false, message: 'Unable to load orders right now.' },
      { status: 500 }
    );
  }
}

// POST /api/orders - Create a customer order from verified commercial inventory.
export async function POST(request: NextRequest) {
  let duplicateLookup: { orderId: string; userId: string } | null = null;

  try {
    const user = await getCurrentUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Please log in before placing an order.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const submittedItems = body?.items as SubmittedOrderItem[] | undefined;
    const address = body?.shippingAddress;

    if (!Array.isArray(submittedItems) || submittedItems.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Order must contain at least one item.' },
        { status: 400 }
      );
    }

    if (
      !address ||
      !isNonEmptyString(address.fullName) ||
      !isNonEmptyString(address.email) ||
      !/^\S+@\S+\.\S+$/.test(address.email) ||
      !isNonEmptyString(address.phone) ||
      !isNonEmptyString(address.addressLine) ||
      !isNonEmptyString(address.city) ||
      !isNonEmptyString(address.postalCode)
    ) {
      return NextResponse.json(
        { success: false, message: 'Please complete all required shipping fields.' },
        { status: 400 }
      );
    }

    const quantities = new Map<string, number>();
    for (const item of submittedItems) {
      if (
        !item ||
        !isNonEmptyString(item.bookId) ||
        !Number.isInteger(item.qty) ||
        Number(item.qty) < 1 ||
        Number(item.qty) > 99
      ) {
        return NextResponse.json(
          { success: false, message: 'Order items must be valid books with quantities from 1 to 99.' },
          { status: 400 }
        );
      }

      const bookId = item.bookId.trim();
      quantities.set(bookId, (quantities.get(bookId) || 0) + Number(item.qty));
    }

    if (Array.from(quantities.values()).some((quantity) => quantity > 99)) {
      return NextResponse.json(
        { success: false, message: 'The maximum quantity per book is 99.' },
        { status: 400 }
      );
    }

    const requestId =
      typeof body.requestId === 'string' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.requestId)
        ? body.requestId
        : crypto.randomUUID();
    const paymentMethod = 'cash_on_delivery';
    const orderId = `ORD-${requestId.toUpperCase()}`;
    duplicateLookup = { orderId, userId: user.userId };
    let orderDocument: IOrderDocument | undefined;

    try {
      await connectToDatabase();
      const previousOrder = await Order.findOne({ orderId, userId: user.userId });
      if (previousOrder) {
        return NextResponse.json(
          {
            success: true,
            message: 'This order has already been placed.',
            order: previousOrder,
          }
        );
      }

      const objectIds = Array.from(quantities.keys()).filter(
        (id) => mongoose.Types.ObjectId.isValid(id) && /^[a-fA-F0-9]{24}$/.test(id)
      );
      const isbns = Array.from(quantities.keys());

      const books = await Book.find({
        $or: [
          { _id: { $in: objectIds } },
          { isbn: { $in: isbns } },
          { sourceId: { $in: isbns } },
        ],
      });

      if (books.length === quantities.size) {
        let subtotal = 0;
        const resolvedItems = [];

        for (const [requestedKey, quantity] of Array.from(quantities.entries())) {
          const book = books.find(
            (candidate) =>
              candidate._id.toString() === requestedKey ||
              candidate.isbn === requestedKey ||
              candidate.sourceId === requestedKey
          );

          if (!book || typeof book.price !== 'number' || book.stock < quantity) {
            throw new Error(`STOCK_UNAVAILABLE:${requestedKey}`);
          }

          subtotal += book.price * quantity;
          resolvedItems.push({
            bookId: book._id.toString(),
            title: book.title,
            author: book.author,
            price: book.price,
            ...(typeof book.originalPrice === 'number' &&
            book.originalPrice > book.price
              ? { originalPrice: book.originalPrice }
              : {}),
            quantity,
            coverImage: book.coverImage || '',
          });
        }

        const shippingFee = shippingFeeFor(subtotal);
        const total = Number((subtotal + shippingFee).toFixed(2));

        for (const [requestedKey, quantity] of Array.from(quantities.entries())) {
          const book = books.find(
            (candidate) =>
              candidate._id.toString() === requestedKey ||
              candidate.isbn === requestedKey ||
              candidate.sourceId === requestedKey
          );
          if (!book) throw new Error(`STOCK_UNAVAILABLE:${requestedKey}`);
          const updated = await Book.findOneAndUpdate(
            { _id: book._id, stock: { $gte: quantity } },
            { $inc: { stock: -quantity } },
            { new: true }
          );
          if (!updated) throw new Error(`STOCK_UNAVAILABLE:${requestedKey}`);
        }

        const [createdOrder] = await Order.create([
          {
            orderId,
            userId: user.userId,
            userEmail: user.email,
            items: resolvedItems,
            subtotal,
            shippingFee,
            total,
            shippingAddress: {
              fullName: address.fullName.trim(),
              email: address.email.trim(),
              phone: address.phone.trim(),
              addressLine: address.addressLine.trim(),
              city: address.city.trim(),
              state: isNonEmptyString(address.state) ? address.state.trim() : 'N/A',
              postalCode: address.postalCode.trim(),
              country: isNonEmptyString(address.country) ? address.country.trim() : 'India',
              addressType: ['Home', 'Work', 'Other'].includes(address.addressType)
                ? address.addressType
                : 'Home',
            },
            status: 'pending',
            paymentMethod,
          },
        ]);

        orderDocument = createdOrder;
      }
    } catch (dbErr: unknown) {
      const message = dbErr instanceof Error ? dbErr.message : 'Unknown error';
      if (message.startsWith('STOCK_UNAVAILABLE:')) {
        return NextResponse.json(
          { success: false, message: 'One or more books are out of stock.' },
          { status: 409 }
        );
      }
      logger.warn(`Database order processing encountered error: ${message}`);
      return NextResponse.json(
        { success: false, message: 'Unable to place your order because inventory could not be verified.' },
        { status: 503 }
      );
    }

    if (!orderDocument) {
      return NextResponse.json(
        { success: false, message: 'One or more books are unavailable for checkout.' },
        { status: 409 }
      );
    }

    logger.info(`New order created: ${orderId} by ${user.email}`);
    queueEmail(
      () =>
        sendOrderConfirmationEmail({
          to: user.email,
          name: user.name,
          orderId: orderDocument.orderId,
          items: orderDocument.items.map((item) => ({
            title: item.title,
            quantity: item.quantity,
            price: item.price,
          })),
          subtotal: orderDocument.subtotal,
          shippingFee: orderDocument.shippingFee,
          total: orderDocument.total,
          paymentMethod: orderDocument.paymentMethod,
          status: orderDocument.status,
          orderDate: orderDocument.createdAt || new Date(),
          address: {
            fullName: orderDocument.shippingAddress.fullName,
            addressLine: orderDocument.shippingAddress.addressLine,
            city: orderDocument.shippingAddress.city,
            state: orderDocument.shippingAddress.state,
            postalCode: orderDocument.shippingAddress.postalCode,
            phone: orderDocument.shippingAddress.phone,
            country: orderDocument.shippingAddress.country,
          },
        }),
      'Order confirmation email'
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Order created successfully.',
        order: orderDocument,
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Error creating order: ${message}`);

    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 11000 &&
      duplicateLookup
    ) {
      return NextResponse.json({
        success: true,
        message: 'This order has already been placed.',
      });
    }

    return NextResponse.json(
      { success: false, message: 'Unable to place your order right now.' },
      { status: 500 }
    );
  }
}
