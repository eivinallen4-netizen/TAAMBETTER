import { NextRequest, NextResponse } from 'next/server';
import { listActivity } from '@/lib/activity-log';
import { adminContext, pageErrorResponse } from '../pages/helpers';

/** Every MCP / API tool call and admin page action, newest first. Admin only. */
export async function GET(request: NextRequest) {
  try {
    const { db } = await adminContext();
    const q = request.nextUrl.searchParams;
    return NextResponse.json(
      await listActivity(db, {
        source: q.get('source') ?? undefined,
        search: q.get('q') ?? undefined,
        limit: Number(q.get('limit')) || 200,
        offset: Number(q.get('offset')) || 0,
      })
    );
  } catch (error) {
    return pageErrorResponse(error, 'Activity list error');
  }
}
