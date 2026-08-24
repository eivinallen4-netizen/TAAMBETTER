import { NextRequest, NextResponse } from 'next/server';
import { createSession } from '@/lib/auth';
import { AppError, handleError, ErrorCodes } from '@/lib/errors';
import { logger, getClientIp, getUserAgent } from '@/lib/logger';
import { loginLimiter, handleRateLimit } from '@/lib/ratelimit';
import { addSecurityHeaders } from '@/lib/security-headers';

export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request.headers);
  const userAgent = getUserAgent(request.headers);

  // Apply rate limiting
  const rateLimitResult = loginLimiter(request, clientIp);
  if (!rateLimitResult.allowed) {
    return addSecurityHeaders(handleRateLimit(rateLimitResult.resetTime!));
  }

  try {
    let body: { email: string; name?: string };
    try {
      body = await request.json();
    } catch {
      logger.warn('Invalid JSON in login request', { ip: clientIp, userAgent });
      throw new AppError(400, 'Invalid JSON in request body', ErrorCodes.VALIDATION_ERROR);
    }

    const { email, name } = body;

    if (!email || typeof email !== 'string' || email.trim() === '') {
      logger.warn('Login attempt with missing email', { ip: clientIp, userAgent });
      throw new AppError(400, 'Email is required', ErrorCodes.VALIDATION_ERROR);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      logger.warn('Login attempt with invalid email format', { email: email.split('@')[1], ip: clientIp });
      throw new AppError(400, 'Invalid email format', ErrorCodes.INVALID_EMAIL);
    }

    // Validate name if provided
    if (name && typeof name !== 'string') {
      throw new AppError(400, 'Name must be a string', ErrorCodes.VALIDATION_ERROR);
    }

    // Create session and user if needed
    await createSession(email, name);

    logger.info('User logged in successfully', { email, name, ip: clientIp });

    const response = NextResponse.json(
      {
        success: true,
        message: 'Successfully signed in',
      },
      { status: 200 }
    );

    return addSecurityHeaders(response);
  } catch (error) {
    if (error instanceof AppError) {
      logger.warn('Login failed', { error: error.message, code: error.code, ip: clientIp });
    } else {
      logger.error('Unexpected error during login', error, { ip: clientIp });
    }
    const response = handleError(error);
    return addSecurityHeaders(response);
  }
}
