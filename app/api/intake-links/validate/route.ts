import { NextRequest, NextResponse } from 'next/server';
import client from '@/lib/db';
import { AppError, handleError, ErrorCodes } from '@/lib/errors';
import { addSecurityHeaders } from '@/lib/security-headers';

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token');

    if (!token || typeof token !== 'string' || token.trim() === '') {
      throw new AppError(400, 'Missing or invalid token', ErrorCodes.VALIDATION_ERROR);
    }

    const result = await client.execute({
      sql: `
        SELECT id, title, is_active, expires_at
        FROM intake_links
        WHERE token = ?
      `,
      args: [token],
    });

    if (result.rows.length === 0) {
      throw new AppError(404, 'Intake link not found', ErrorCodes.VALIDATION_ERROR);
    }

    const link = result.rows[0] as any;

    // Check if expired
    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      throw new AppError(400, 'Intake link has expired', ErrorCodes.VALIDATION_ERROR);
    }

    // Check if active
    if (!link.is_active) {
      throw new AppError(400, 'Intake link is inactive', ErrorCodes.VALIDATION_ERROR);
    }

    const response = NextResponse.json(
      {
        success: true,
        valid: true,
        title: link.title,
      },
      { status: 200 }
    );

    return addSecurityHeaders(response);
  } catch (error) {
    return addSecurityHeaders(handleError(error));
  }
}
