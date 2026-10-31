import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import { hashPassword, signToken, AUTH_COOKIE_NAME, AUTH_COOKIE_OPTIONS } from '@/lib/auth';
import logger from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const body = await request.json();
    const { name, email, password } = body;

    // Validate inputs
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json(
        { success: false, message: 'Name must be at least 2 characters long' },
        { status: 400 }
      );
    }

    if (!email || typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Please provide a valid email address' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'An account with this email address already exists' },
        { status: 409 }
      );
    }

    // Hash password using bcrypt
    const hashedPassword = await hashPassword(password);

    // Create user in MongoDB
    const newUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: 'customer',
    });

    logger.info(`New user registered: ${newUser.email}`);

    // Generate JWT token
    const token = signToken({
      userId: newUser._id.toString(),
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
    });

    const response = NextResponse.json(
      {
        success: true,
        message: 'Account registered successfully',
        user: {
          id: newUser._id.toString(),
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
        },
      },
      { status: 201 }
    );

    // Set secure HTTP-only cookie
    response.cookies.set({
      ...AUTH_COOKIE_OPTIONS,
      value: token,
    });

    return response;
  } catch (error: any) {
    logger.error(`Registration error: ${error.message}`);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error during registration' },
      { status: 500 }
    );
  }
}
