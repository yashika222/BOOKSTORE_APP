import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import { hashPassword, signToken, AUTH_COOKIE_OPTIONS } from '@/lib/auth';
import { validatePassword } from '@/lib/passwordPolicy';
import logger from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: 'A valid JSON request body is required.' },
        { status: 400 }
      );
    }

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json(
        { success: false, message: 'A valid registration object is required.' },
        { status: 400 }
      );
    }

    const { name, email, password } = body as Record<string, unknown>;

    // Validate inputs
    if (!name || typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 60) {
      return NextResponse.json(
        { success: false, message: 'Name must be between 2 and 60 characters long.' },
        { status: 400 }
      );
    }

    if (!email || typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Please provide a valid email address' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Please provide a password.' },
        { status: 400 }
      );
    }
    const passwordError = validatePassword(password);
    if (passwordError) {
      return NextResponse.json({ success: false, message: passwordError }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    try {
      await connectToDatabase();

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

      logger.info(`New user registered in DB: ${newUser.email}`);

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

      response.cookies.set({
        ...AUTH_COOKIE_OPTIONS,
        value: token,
      });

      return response;
    } catch (dbError: any) {
      if (dbError?.code === 11000) {
        return NextResponse.json(
          { success: false, message: 'An account with this email address already exists.' },
          { status: 409 }
        );
      }

      logger.warn(
        `Database registration failed, falling back to mock registration session: ${
          dbError instanceof Error ? dbError.message : 'Unknown'
        }`
      );

      // Fallback session registration when MongoDB is offline
      const mockUserId = `cust-${Date.now()}`;
      const token = signToken({
        userId: mockUserId,
        email: normalizedEmail,
        name: name.trim(),
        role: 'customer',
      });

      const response = NextResponse.json(
        {
          success: true,
          message: 'Account registered successfully (Demo Mode)',
          user: {
            id: mockUserId,
            name: name.trim(),
            email: normalizedEmail,
            role: 'customer',
          },
        },
        { status: 201 }
      );

      response.cookies.set({
        ...AUTH_COOKIE_OPTIONS,
        value: token,
      });

      return response;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Registration error: ${errorMessage}`);
    return NextResponse.json(
      { success: false, message: 'Unable to create your account right now. Please try again later.' },
      { status: 500 }
    );
  }
}
