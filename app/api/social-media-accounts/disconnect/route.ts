import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { deleteSocialMediaAccount } from '@/lib/db/queries';
import { AppError, handleError, ErrorCodes } from '@/lib/errors';
import { logger, getClientIp } from '@/lib/logger';

export async function DELETE(request: NextRequest) {
  const clientIp = getClientIp(request.headers);

  try {
    const session = await getSession();
    if (!session) {
      throw new AppError(401, 'Unauthorized', ErrorCodes.UNAUTHORIZED);
    }

    let body: { accountId: string };
    try {
      body = await request.json();
    } catch {
      throw new AppError(400, 'Invalid JSON in request body', ErrorCodes.VALIDATION_ERROR);
    }

    const { accountId } = body;

    if (!accountId || typeof accountId !== 'string' || accountId.trim() === '') {
      throw new AppError(400, 'Account ID is required', ErrorCodes.VALIDATION_ERROR);
    }

    // Delete the account (soft delete - marks as inactive)
    await deleteSocialMediaAccount(accountId, session.userId);

    logger.info('Social media account disconnected', {
      userId: session.userId,
      accountId,
      ip: clientIp,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Account disconnected successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof AppError) {
      logger.warn('Account disconnection failed', {
        error: error.message,
        code: error.code,
        ip: clientIp,
      });
    } else {
      logger.error('Unexpected error during account disconnection', error, { ip: clientIp });
    }
    return handleError(error);
  }
}
