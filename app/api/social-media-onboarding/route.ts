import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { saveSocialMediaAccount } from '@/lib/db/queries';
import { SocialMediaAccountInput } from '@/lib/types';
import { AppError, handleError, ErrorCodes } from '@/lib/errors';
import { logger, getClientIp } from '@/lib/logger';
import { onboardingLimiter, handleRateLimit } from '@/lib/ratelimit';
import { addSecurityHeaders } from '@/lib/security-headers';

export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request.headers);

  // Apply rate limiting
  const rateLimitResult = onboardingLimiter(request, clientIp);
  if (!rateLimitResult.allowed) {
    return addSecurityHeaders(handleRateLimit(rateLimitResult.resetTime!));
  }

  try {
    // Check authentication
    const session = await getSession();
    if (!session) {
      throw new AppError(401, 'Unauthorized', ErrorCodes.UNAUTHORIZED);
    }

    let body: { accounts: SocialMediaAccountInput[] };
    try {
      body = await request.json();
    } catch {
      throw new AppError(400, 'Invalid JSON in request body', ErrorCodes.VALIDATION_ERROR);
    }

    const { accounts } = body;

    if (!accounts || !Array.isArray(accounts) || accounts.length === 0) {
      throw new AppError(400, 'No accounts provided', ErrorCodes.VALIDATION_ERROR);
    }

    // Validate each account
    const validPlatforms = ['instagram', 'facebook', 'tiktok', 'youtube', 'linkedin', 'twitter'];
    for (let i = 0; i < accounts.length; i++) {
      const account = accounts[i];

      if (!account.platform || !account.username || !account.email || !account.password) {
        throw new AppError(
          400,
          `Account ${i + 1}: Missing required fields (platform, username, email, password)`,
          ErrorCodes.VALIDATION_ERROR
        );
      }

      if (!validPlatforms.includes(account.platform)) {
        throw new AppError(
          400,
          `Account ${i + 1}: Invalid platform "${account.platform}"`,
          ErrorCodes.VALIDATION_ERROR
        );
      }

      if (account.username.trim().length === 0) {
        throw new AppError(400, `Account ${i + 1}: Username cannot be empty`, ErrorCodes.VALIDATION_ERROR);
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(account.email)) {
        throw new AppError(400, `Account ${i + 1}: Invalid email format`, ErrorCodes.VALIDATION_ERROR);
      }

      if (account.password.length < 6) {
        throw new AppError(400, `Account ${i + 1}: Password must be at least 6 characters`, ErrorCodes.VALIDATION_ERROR);
      }
    }

    // Save all accounts
    const savedAccounts = [];
    for (let i = 0; i < accounts.length; i++) {
      try {
        const account = accounts[i];
        const saved = await saveSocialMediaAccount(session.userId, account);
        savedAccounts.push(saved);
      } catch (error) {
        console.error(`Failed to save account ${i + 1}:`, error);
        throw new AppError(
          500,
          `Failed to save ${accounts[i].platform} account. Please try again.`,
          ErrorCodes.DATABASE_ERROR
        );
      }
    }

    logger.info('Social media accounts saved successfully', {
      userId: session.userId,
      count: savedAccounts.length,
      platforms: savedAccounts.map((a) => a.platform),
      ip: clientIp,
    });

    const response = NextResponse.json(
      {
        success: true,
        message: 'Accounts connected successfully',
        accountCount: savedAccounts.length,
      },
      { status: 200 }
    );

    return addSecurityHeaders(response);
  } catch (error) {
    if (error instanceof AppError) {
      logger.warn('Account onboarding failed', {
        error: error.message,
        code: error.code,
        ip: clientIp,
      });
    } else {
      logger.error('Unexpected error during account onboarding', error, { ip: clientIp });
    }
    const response = handleError(error);
    return addSecurityHeaders(response);
  }
}
