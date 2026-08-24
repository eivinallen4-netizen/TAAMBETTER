import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { randomBytes } from 'crypto';
import { randomUUID } from 'crypto';
import client from '@/lib/db';
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

    const result = await client.execute({
      sql: `
        SELECT id, token, title, is_active, expires_at, created_at, updated_at
        FROM intake_links
        WHERE user_id = ?
        ORDER BY created_at DESC
      `,
      args: [session.userId],
    });

    const links = result.rows.map((row: any) => ({
      id: row.id,
      token: row.token,
      title: row.title,
      is_active: row.is_active,
      expires_at: row.expires_at,
      created_at: row.created_at,
      updated_at: row.updated_at,
      url: `${process.env.NEXT_PUBLIC_SITE_URL}/intake/${row.token}`,
    }));

    const response = NextResponse.json({ success: true, links }, { status: 200 });
    return addSecurityHeaders(response);
  } catch (error) {
    if (error instanceof AppError) {
      logger.warn('Failed to fetch intake links', {
        error: error.message,
        code: error.code,
        ip: clientIp,
      });
    } else {
      logger.error('Unexpected error fetching intake links', error, { ip: clientIp });
    }
    return addSecurityHeaders(handleError(error));
  }
}

export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request.headers);

  try {
    const session = await getSession();
    if (!session) {
      throw new AppError(401, 'Unauthorized', ErrorCodes.UNAUTHORIZED);
    }

    let body: { title?: string };
    try {
      body = await request.json();
    } catch {
      throw new AppError(400, 'Invalid JSON in request body', ErrorCodes.VALIDATION_ERROR);
    }

    const { title } = body;

    if (title && typeof title !== 'string') {
      throw new AppError(400, 'Title must be a string', ErrorCodes.VALIDATION_ERROR);
    }

    const id = randomUUID();
    const token = randomBytes(32).toString('hex');
    const now = new Date().toISOString();

    await client.execute({
      sql: `
        INSERT INTO intake_links (id, user_id, token, title, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      args: [id, session.userId, token, title || null, true, now, now],
    });

    logger.info('Intake link created', {
      userId: session.userId,
      linkId: id,
      title,
      ip: clientIp,
    });

    const response = NextResponse.json(
      {
        success: true,
        link: {
          id,
          token,
          title: title || null,
          url: `${process.env.NEXT_PUBLIC_SITE_URL}/intake/${token}`,
        },
      },
      { status: 201 }
    );

    return addSecurityHeaders(response);
  } catch (error) {
    if (error instanceof AppError) {
      logger.warn('Failed to create intake link', {
        error: error.message,
        code: error.code,
        ip: clientIp,
      });
    } else {
      logger.error('Unexpected error creating intake link', error, { ip: clientIp });
    }
    return addSecurityHeaders(handleError(error));
  }
}
