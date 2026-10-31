import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Order from '@/models/Order';
import { getUserFromRequest } from '@/lib/auth';
import { globalOrderQueue } from '@/lib/dsa';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

// GET /api/orders - List orders for authenticated user or all orders for admin
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Please log in to view orders' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    let query: any = {};
    if (user.role !== 'admin') {
      // Customer can only view their own orders
      query = { userEmail: user.email.toLowerCase() };
    }

    const orders = await Order.find(query).sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      count: orders.length,
      data: orders,
      queueState: user.role === 'admin' ? globalOrderQueue.getAll() : undefined,
    });
  } catch (error: any) {
    logger.error(`Error fetching orders: ${error.message}`);
    return NextResponse.json(
      { success: false, message: error.message || 'Error fetching orders' },
      { status: 500 }
    );
  }
}

// POST /api/orders - Create a new order (Checkout)
export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    await connectToDatabase();

    const body = await request.json();
    const { items, shippingAddress, subtotal, shippingFee, total, paymentMethod } = body;

    // Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Order must contain at least one item' },
        { status: 400 }
      );
    }

    // Validate shipping info
    if (
      !shippingAddress ||
      !shippingAddress.fullName ||
      !shippingAddress.email ||
      !shippingAddress.phone ||
      !shippingAddress.addressLine ||
      !shippingAddress.city ||
      !shippingAddress.postalCode
    ) {
      return NextResponse.json(
        { success: false, message: 'Please complete all required shipping fields' },
        { status: 400 }
      );
    }

    // Generate unique order reference (e.g. ORD-98231)
    const orderId = `ORD-${Math.random().toString(36).substring(2, 7).toUpperCase()}-${Date.now().toString().slice(-4)}`;

    // Enqueue order in FIFO Order Processing Queue (DSA requirement)
    const buyerEmail = user?.email || shippingAddress.email;
    const queuedTask = globalOrderQueue.enqueue(orderId, buyerEmail, total);
    const queuePos = globalOrderQueue.getPosition(orderId);

    // Save in MongoDB
    const newOrder = await Order.create({
      orderId,
      userId: user?.userId || undefined,
      userEmail: buyerEmail.toLowerCase(),
      items: items.map((i: any) => ({
        bookId: String(i.bookId),
        title: i.title,
        author: i.author,
        price: Number(i.price),
        quantity: Number(i.qty || i.quantity || 1),
        coverImage: i.coverImage || '',
      })),
      subtotal: Number(subtotal),
      shippingFee: Number(shippingFee || 0),
      total: Number(total),
      shippingAddress: {
        fullName: shippingAddress.fullName.trim(),
        email: shippingAddress.email.trim(),
        phone: shippingAddress.phone.trim(),
        addressLine: shippingAddress.addressLine.trim(),
        city: shippingAddress.city.trim(),
        state: shippingAddress.state?.trim() || '',
        postalCode: shippingAddress.postalCode.trim(),
        country: shippingAddress.country?.trim() || 'India',
      },
      status: 'pending',
      paymentMethod: paymentMethod || 'simulated_card',
      queuePosition: queuePos,
    });

    logger.info(`New Order Created: ${orderId} by ${buyerEmail} (Queue Pos #${queuePos})`);

    return NextResponse.json(
      {
        success: true,
        message: 'Order created successfully and entered fulfillment queue.',
        order: newOrder,
        queuePosition: queuePos,
      },
      { status: 201 }
    );
  } catch (error: any) {
    logger.error(`Error creating order: ${error.message}`);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to place order' },
      { status: 500 }
    );
  }
}
