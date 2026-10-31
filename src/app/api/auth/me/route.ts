import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = getUserFromRequest(request);

    if (!session) {
      return NextResponse.json(
        { success: false, user: null },
        { status: 200 }
      );
    }

    await connectToDatabase();
    const user = await User.findById(session.userId).select('-password');

    if (!user) {
      return NextResponse.json(
        { success: false, user: null },
        { status: 200 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, user: null },
      { status: 200 }
    );
  }
}
