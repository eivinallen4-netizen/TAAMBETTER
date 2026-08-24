import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { AppError, handleError, ErrorCodes } from '@/lib/errors';
import { logger, getClientIp } from '@/lib/logger';
import { addSecurityHeaders } from '@/lib/security-headers';

export async function GET(request: NextRequest) {
  const clientIp = getClientIp(request.headers);

  try {
    const session = await getSession();

    if (!session) {
      throw new AppError(401, 'Unauthorized', ErrorCodes.UNAUTHORIZED);
    }

    const response = NextResponse.json(
      {
        success: true,
        session,
      },
      { status: 200 }
    );

    return addSecurityHeaders(response);
  } catch (error) {
    if (error instanceof AppError) {
      logger.debug('No active session', { code: error.code, ip: clientIp });
    } else {
      logger.error('Unexpected error checking session', error, { ip: clientIp });
    }
    return addSecurityHeaders(handleError(error));
  }
}
