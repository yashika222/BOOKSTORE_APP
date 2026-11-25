import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import { comparePassword, signToken, AUTH_COOKIE_OPTIONS } from '@/lib/auth';
import logger from '@/lib/logger';
import { queueEmail, sendLoginNotificationEmail } from '@/lib/mail';

interface FallbackUser {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'admin';
}

function getFallbackUser(email: string, password: string): FallbackUser | null {
  const normEmail = email.toLowerCase().trim();
  if (normEmail === 'admin@bookstore.com' && (password === 'Admin@123456' || password === 'admin123')) {
    return {
      id: 'demo-admin-id-001',
      name: 'Store Manager (Admin)',
      email: 'admin@bookstore.com',
      role: 'admin',
    };
  }
  if (normEmail === 'reader@bookstore.com' && (password === 'Reader@123456' || password === 'reader123')) {
    return {
      id: 'demo-customer-id-001',
      name: 'Jane Reader',
      email: 'reader@bookstore.com',
      role: 'customer',
    };
  }
  return null;
}

export async function POST(request: NextRequest) {
  let email = '';
  let password = '';

  try {
    const body = await request.json();
    email = body?.email ?? '';
    password = body?.password ?? '';

    if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
      return NextResponse.json(
        { success: false, message: 'Please provide both email and password' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    try {
      await connectToDatabase();

      // Check if user exists in database
      const user = await User.findOne({ email: normalizedEmail });

      if (user) {
        if (!user.password) {
          return NextResponse.json(
            { success: false, message: 'This account uses Google sign-in. Continue with Google to access it.' },
            { status: 401 }
          );
        }

        if (user.emailVerified === false) {
          return NextResponse.json(
            { success: false, message: 'Please verify your email before signing in.' },
            { status: 403 }
          );
        }

        // Verify password with bcrypt
        const isPasswordValid = await comparePassword(password, user.password ?? '');
        if (isPasswordValid) {
          logger.info(`User logged in: ${user.email} (${user.role})`);
          queueEmail(
            () => sendLoginNotificationEmail({ to: user.email, name: user.name }),
            'Login notification'
          );

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

          response.cookies.set({
            ...AUTH_COOKIE_OPTIONS,
            value: token,
          });

          return response;
        }
      }
    } catch (dbError) {
      logger.warn(`Database connection during login failed; attempting fallback demo auth: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`);
    }

    // Check demo fallback users
    const fallback = getFallbackUser(normalizedEmail, password);
    if (fallback) {
      logger.info(`Demo fallback user logged in: ${fallback.email} (${fallback.role})`);
      const token = signToken({
        userId: fallback.id,
        email: fallback.email,
        name: fallback.name,
        role: fallback.role,
      });

      const response = NextResponse.json({
        success: true,
        message: 'Logged in successfully (Demo Session)',
        user: fallback,
      });

      response.cookies.set({
        ...AUTH_COOKIE_OPTIONS,
        value: token,
      });

      return response;
    }

    return NextResponse.json(
      { success: false, message: 'Invalid email or password' },
      { status: 401 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Login error: ${errorMessage}`);
    return NextResponse.json(
      { success: false, message: 'Unable to log in right now. Please try again later.' },
      { status: 500 }
    );
  }
}
