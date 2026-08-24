import { NextRequest, NextResponse } from 'next/server';
import { verifyEmail } from '@/lib/verification';
import { AppError, handleError, ErrorCodes } from '@/lib/errors';

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token');

    if (!token || typeof token !== 'string' || token.trim() === '') {
      throw new AppError(400, 'Missing or invalid verification token', ErrorCodes.VALIDATION_ERROR);
    }

    try {
      const success = await verifyEmail(token);

      if (!success) {
        throw new AppError(400, 'Invalid or expired verification token', ErrorCodes.VALIDATION_ERROR);
      }

      // Redirect to onboarding on success
      return NextResponse.redirect(new URL('/social-media-onboarding', request.url));
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(500, 'Failed to verify email', ErrorCodes.DATABASE_ERROR);
    }
  } catch (error) {
    return handleError(error);
  }
}
