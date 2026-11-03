import { NextResponse } from 'next/server';
import { countNeedsReview } from '@/lib/pages/store';
import { adminContext, pageErrorResponse } from '../helpers';

/** The "Needs review" badge in the admin nav. */
export async function GET() {
  try {
    const { db } = await adminContext();
    return NextResponse.json({ needs_review: await countNeedsReview(db) });
  } catch (error) {
    return pageErrorResponse(error, 'Pages count error');
  }
}
