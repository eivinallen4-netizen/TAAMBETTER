import { NextRequest, NextResponse } from 'next/server';
import { countWords } from '@/lib/pages/rules';
import { getRevision, listRevisions, PageError, previewPath, restoreRevision } from '@/lib/pages/store';
import { adminContext, logAdmin, pageErrorResponse } from '../../../helpers';

type Params = { params: Promise<{ id: string; revisionId: string }> };

/** One revision and the one before it, for the diff. */
export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { db } = await adminContext();
    const { id, revisionId } = await params;
    const found = await getRevision(db, id, revisionId);
    if (!found) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(found);
  } catch (error) {
    return pageErrorResponse(error, 'Revision fetch error');
  }
}

/** Restore this version's content as a new save (same guardrails as any save). */
export async function POST(_request: NextRequest, { params }: Params) {
  let ctx: Awaited<ReturnType<typeof adminContext>> | null = null;
  const { id, revisionId } = await params;
  try {
    ctx = await adminContext();
    const page = await restoreRevision(ctx.db, id, revisionId, ctx.actor);
    await logAdmin(ctx.db, ctx.actor, 'restore_revision', page.slug, { revision: revisionId });
    return NextResponse.json({ page, preview_path: previewPath(page.preview_token), word_count: countWords(page.body), revisions: await listRevisions(ctx.db, id) });
  } catch (error) {
    if (ctx && error instanceof PageError) await logAdmin(ctx.db, ctx.actor, 'restore_revision', id, { revision: revisionId }, error.message);
    return pageErrorResponse(error, 'Revision restore error');
  }
}
