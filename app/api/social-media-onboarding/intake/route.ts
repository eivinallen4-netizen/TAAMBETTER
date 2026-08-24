import { NextRequest, NextResponse } from 'next/server';
import { saveSocialMediaAccount } from '@/lib/db/queries';
import { SocialMediaAccountInput } from '@/lib/types';
import { AppError, handleError, ErrorCodes } from '@/lib/errors';
import { logger, getClientIp } from '@/lib/logger';
import { onboardingLimiter, handleRateLimit } from '@/lib/ratelimit';
import { addSecurityHeaders } from '@/lib/security-headers';
import client from '@/lib/db';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request.headers);

  // Apply rate limiting
  const rateLimitResult = onboardingLimiter(request, clientIp);
  if (!rateLimitResult.allowed) {
    return addSecurityHeaders(handleRateLimit(rateLimitResult.resetTime!));
  }

  try {
    let body: {
      accounts: SocialMediaAccountInput[];
      intakeToken: string;
      submitterEmail: string;
      submitterName?: string;
    };
    try {
      body = await request.json();
    } catch {
      throw new AppError(400, 'Invalid JSON in request body', ErrorCodes.VALIDATION_ERROR);
    }

    const { accounts, intakeToken, submitterEmail, submitterName } = body;

    // Validate intake token
    if (!intakeToken || typeof intakeToken !== 'string') {
      throw new AppError(400, 'Missing intake token', ErrorCodes.VALIDATION_ERROR);
    }

    if (!submitterEmail || typeof submitterEmail !== 'string') {
      throw new AppError(400, 'Submitter email is required', ErrorCodes.VALIDATION_ERROR);
    }

    // Get intake link and owner
    const linkResult = await client.execute({
      sql: `
        SELECT id, user_id, is_active, expires_at
        FROM intake_links
        WHERE token = ?
      `,
      args: [intakeToken],
    });

    if (linkResult.rows.length === 0) {
      throw new AppError(404, 'Intake link not found', ErrorCodes.VALIDATION_ERROR);
    }

    const link = linkResult.rows[0] as any;

    if (!link.is_active) {
      throw new AppError(400, 'Intake link is inactive', ErrorCodes.VALIDATION_ERROR);
    }

    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      throw new AppError(400, 'Intake link has expired', ErrorCodes.VALIDATION_ERROR);
    }

    const intakeLinkId = link.id;
    const ownerId = link.user_id;

    // Validate accounts
    if (!accounts || !Array.isArray(accounts) || accounts.length === 0) {
      throw new AppError(400, 'No accounts provided', ErrorCodes.VALIDATION_ERROR);
    }

    const validPlatforms = ['instagram', 'facebook', 'tiktok', 'youtube', 'linkedin', 'twitter'];
    for (let i = 0; i < accounts.length; i++) {
      const account = accounts[i];

      if (!account.platform || !account.username || !account.email || !account.password) {
        throw new AppError(
          400,
          `Account ${i + 1}: Missing required fields`,
          ErrorCodes.VALIDATION_ERROR
        );
      }

      if (!validPlatforms.includes(account.platform)) {
        throw new AppError(400, `Account ${i + 1}: Invalid platform`, ErrorCodes.VALIDATION_ERROR);
      }

      if (account.username.trim().length === 0) {
        throw new AppError(400, `Account ${i + 1}: Username cannot be empty`, ErrorCodes.VALIDATION_ERROR);
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(account.email)) {
        throw new AppError(400, `Account ${i + 1}: Invalid email format`, ErrorCodes.VALIDATION_ERROR);
      }

      if (account.password.length < 6) {
        throw new AppError(
          400,
          `Account ${i + 1}: Password must be at least 6 characters`,
          ErrorCodes.VALIDATION_ERROR
        );
      }
    }

    // Save accounts to the owner's account with referrer ID
    const savedAccounts = [];
    for (let i = 0; i < accounts.length; i++) {
      try {
        const account = accounts[i];
        // Note: We need to modify saveSocialMediaAccount to support referrer_id
        const saved = await saveSocialMediaAccount(ownerId, account);
        savedAccounts.push(saved);
      } catch (error) {
        console.error(`Failed to save account ${i + 1}:`, error);
        throw new AppError(500, `Failed to save account. Please try again.`, ErrorCodes.DATABASE_ERROR);
      }
    }

    // Create submission record
    const submissionId = randomUUID();
    const now = new Date().toISOString();

    await client.execute({
      sql: `
        INSERT INTO submissions (id, intake_link_id, submitted_by_email, submitted_by_name, account_count, platforms, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        submissionId,
        intakeLinkId,
        submitterEmail,
        submitterName || null,
        savedAccounts.length,
        savedAccounts.map((a) => a.platform).join(','),
        now,
      ],
    });

    logger.info('Intake form submitted', {
      intakeLinkId,
      ownerId,
      submitterEmail,
      accountCount: savedAccounts.length,
      platforms: savedAccounts.map((a) => a.platform),
      ip: clientIp,
    });

    const response = NextResponse.json(
      {
        success: true,
        message: 'Thank you for your submission!',
        accountCount: savedAccounts.length,
      },
      { status: 200 }
    );

    return addSecurityHeaders(response);
  } catch (error) {
    if (error instanceof AppError) {
      logger.warn('Intake form submission failed', {
        error: error.message,
        code: error.code,
        ip: clientIp,
      });
    } else {
      logger.error('Unexpected error during intake submission', error, { ip: clientIp });
    }
    return addSecurityHeaders(handleError(error));
  }
}
