import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getSocialMediaAccounts } from '@/lib/db/queries';
import { AppError, handleError, ErrorCodes } from '@/lib/errors';
import { logger, getClientIp } from '@/lib/logger';

export async function GET(request: NextRequest) {
  const clientIp = getClientIp(request.headers);

  try {
    const session = await getSession();
    if (!session) {
      throw new AppError(401, 'Unauthorized', ErrorCodes.UNAUTHORIZED);
    }

    const accounts = await getSocialMediaAccounts(session.userId);

    logger.debug('Fetched social media accounts', {
      userId: session.userId,
      accountCount: accounts.length,
      ip: clientIp,
    });

    return NextResponse.json(
      {
        success: true,
        accounts: accounts.map((acc) => ({
          id: acc.id,
          platform: acc.platform,
          created_at: acc.created_at,
          updated_at: acc.updated_at,
          is_active: acc.is_active,
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof AppError) {
      logger.warn('Failed to fetch accounts', {
        error: error.message,
        code: error.code,
        ip: clientIp,
      });
    } else {
      logger.error('Unexpected error fetching accounts', error, { ip: clientIp });
    }
    return handleError(error);
  }
}
