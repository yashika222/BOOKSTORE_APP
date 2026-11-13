import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Address from '@/models/Address';
import { getCurrentUserFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function parseAddress(body: Record<string, unknown>) {
  const fields = ['fullName', 'mobile', 'pincode', 'locality', 'addressLine', 'city', 'state'] as const;
  const values: Record<string, string> = {};
  for (const field of fields) {
    if (typeof body[field] !== 'string' || !body[field].trim()) {
      throw new Error(`${field} is required.`);
    }
    values[field] = String(body[field]).trim();
  }
  const addressType = body.addressType === 'Work' ? 'Work' : 'Home';
  return { ...values, addressType, isDefault: body.isDefault === true };
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ success: false, message: 'Please log in.' }, { status: 401 });
  }
  await connectToDatabase();
  const addresses = await Address.find({ userId: user.userId }).sort({ isDefault: -1, createdAt: -1 });
  return NextResponse.json({ success: true, data: addresses });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ success: false, message: 'Please log in.' }, { status: 401 });
  }
  try {
    const body = await request.json();
    const values = parseAddress(body);
    await connectToDatabase();
    if (values.isDefault) {
      await Address.updateMany({ userId: user.userId }, { $set: { isDefault: false } });
    }
    const address = await Address.create({ ...values, userId: user.userId });
    return NextResponse.json({ success: true, data: address }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Unable to save address.' },
      { status: 400 }
    );
  }
}
