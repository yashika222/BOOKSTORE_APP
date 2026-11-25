import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Address from '@/models/Address';
import { getCurrentUserFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ success: false, message: 'Please log in.' }, { status: 401 });
  }
  const body = await request.json() as Record<string, unknown>;
  await connectToDatabase();
  if (body.isDefault === true) {
    await Address.updateMany({ userId: user.userId }, { $set: { isDefault: false } });
  }

  // Whitelist fields to prevent MongoDB operator injection via raw $set: body
  const allowed: Record<string, unknown> = {};
  const textFields = ['fullName', 'mobile', 'pincode', 'locality', 'addressLine', 'city', 'state'] as const;
  for (const field of textFields) {
    if (typeof body[field] === 'string' && (body[field] as string).trim()) {
      allowed[field] = (body[field] as string).trim();
    }
  }
  if (
    body.addressType === 'Work' ||
    body.addressType === 'Home' ||
    body.addressType === 'Other'
  ) {
    allowed.addressType = body.addressType;
  }
  if (typeof body.isDefault === 'boolean') {
    allowed.isDefault = body.isDefault;
  }

  const address = await Address.findOneAndUpdate(
    { _id: params.id, userId: user.userId },
    { $set: allowed },
    { new: true }
  );
  if (!address) {
    return NextResponse.json({ success: false, message: 'Address not found.' }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: address });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ success: false, message: 'Please log in.' }, { status: 401 });
  }
  await connectToDatabase();
  const deleted = await Address.findOneAndDelete({ _id: params.id, userId: user.userId });
  if (!deleted) {
    return NextResponse.json({ success: false, message: 'Address not found.' }, { status: 404 });
  }
  return NextResponse.json({ success: true, message: 'Address deleted.' });
}
