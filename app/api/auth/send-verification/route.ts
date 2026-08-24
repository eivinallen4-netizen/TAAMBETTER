import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { sendVerificationEmail, isEmailVerified } from '@/lib/verification';
import client from '@/lib/db';
import { AppError, handleError, ErrorCodes } from '@/lib/errors';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      throw new AppError(401, 'Unauthorized', ErrorCodes.UNAUTHORIZED);
    }

    // Check if already verified
    const isVerified = await isEmailVerified(session.userId);
    if (isVerified) {
      throw new AppError(400, 'Email already verified', ErrorCodes.VALIDATION_ERROR);
    }

    // Get user email
    try {
      const userResult = await client.execute({
        sql: 'SELECT email FROM users WHERE id = ?',
        args: [session.userId],
      });

      if (userResult.rows.length === 0) {
        throw new AppError(404, 'User not found', ErrorCodes.USER_NOT_FOUND);
      }

      const userEmail = (userResult.rows[0] as any).email;
      const token = await sendVerificationEmail(session.userId, userEmail);

      return NextResponse.json(
        {
          success: true,
          message: 'Verification email sent',
          // For development, return token so user can test
          ...(process.env.NODE_ENV === 'development' && { token }),
        },
        { status: 200 }
      );
    } catch (dbError) {
      throw new AppError(500, 'Failed to process verification request', ErrorCodes.DATABASE_ERROR);
    }
  } catch (error) {
    return handleError(error);
  }
}
