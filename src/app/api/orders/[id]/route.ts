import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Order from '@/models/Order';
import { getCurrentUserFromRequest } from '@/lib/auth';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

const STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'] as const;

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUserFromRequest(request);
  if (!user || user.role !== 'admin') {
    return NextResponse.json(
      { success: false, message: 'Unauthorized. Admin privileges required.' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const status = body?.status;
    if (!STATUSES.includes(status)) {
      return NextResponse.json(
        { success: false, message: 'Provide a valid order status.' },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const order = await Order.findOneAndUpdate(
      { orderId: params.id },
      { status },
      { new: true }
    );

    if (!order) {
      return NextResponse.json({ success: false, message: 'Order not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: order });
  } catch (error) {
    logger.error(`Order update failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return NextResponse.json(
      { success: false, message: 'Unable to update this order right now.' },
      { status: 500 }
    );
  }
}
