import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import { comparePassword, signToken, AUTH_COOKIE_NAME, AUTH_COOKIE_OPTIONS, hashPassword } from '@/lib/auth';
import logger from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Please provide both email and password' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user exists
    let user = await User.findOne({ email: normalizedEmail });

    // Seed default admin if user logs in with admin credentials and doesn't exist yet
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@bookstore.com').toLowerCase().trim();
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';

    if (!user && normalizedEmail === adminEmail && password === adminPassword) {
      const hashedAdminPassword = await hashPassword(adminPassword);
      user = await User.create({
        name: process.env.ADMIN_NAME || 'Store Manager',
        email: adminEmail,
        password: hashedAdminPassword,
        role: 'admin',
      });
      logger.info('Initialized default admin account securely from environment variables.');
    }

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password with bcrypt
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    logger.info(`User logged in: ${user.email} (${user.role})`);

    // Generate JWT token
    const token = signToken({
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
    });

    const response = NextResponse.json({
      success: true,
      message: 'Logged in successfully',
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

    // Set HTTP-only cookie
    response.cookies.set({
      ...AUTH_COOKIE_OPTIONS,
      value: token,
    });

    return response;
  } catch (error: any) {
    logger.error(`Login error: ${error.message}`);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error during login' },
      { status: 500 }
    );
  }
}
