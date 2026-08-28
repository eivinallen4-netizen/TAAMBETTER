import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import client from '@/lib/db';
import { AppError, handleError, ErrorCodes } from '@/lib/errors';
import { logger, getClientIp } from '@/lib/logger';
import { addSecurityHeaders } from '@/lib/security-headers';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const clientIp = getClientIp(request.headers);

  try {
    const session = await getSession();
    if (!session) {
      throw new AppError(401, 'Unauthorized', ErrorCodes.UNAUTHORIZED);
    }

    const { id } = await params;

    if (!id || typeof id !== 'string') {
      throw new AppError(400, 'Invalid intake link ID', ErrorCodes.VALIDATION_ERROR);
    }

    // Verify ownership of intake link
    const linkResult = await client.execute({
      sql: 'SELECT id FROM intake_links WHERE id = ? AND user_id = ?',
      args: [id, session.userId],
    });

    if (linkResult.rows.length === 0) {
      throw new AppError(404, 'Intake link not found', ErrorCodes.VALIDATION_ERROR);
    }

    // Get submissions
    const result = await client.execute({
      sql: `
        SELECT id, submitted_by_email, submitted_by_name, account_count, platforms, created_at
        FROM submissions
        WHERE intake_link_id = ?
        ORDER BY created_at DESC
      `,
      args: [id],
    });

    const submissions = result.rows.map((row: any) => ({
      id: row.id,
      email: row.submitted_by_email,
      name: row.submitted_by_name,
      accountCount: row.account_count,
      platforms: row.platforms ? row.platforms.split(',') : [],
      submittedAt: row.created_at,
    }));

    logger.debug('Fetched submissions', {
      userId: session.userId,
      linkId: id,
      submissionCount: submissions.length,
      ip: clientIp,
    });

    const response = NextResponse.json({ success: true, submissions }, { status: 200 });
    return addSecurityHeaders(response);
  } catch (error) {
    if (error instanceof AppError) {
      logger.warn('Failed to fetch submissions', {
        error: error.message,
        code: error.code,
        ip: clientIp,
      });
    } else {
      logger.error('Unexpected error fetching submissions', error, { ip: clientIp });
    }
    return addSecurityHeaders(handleError(error));
  }
}
