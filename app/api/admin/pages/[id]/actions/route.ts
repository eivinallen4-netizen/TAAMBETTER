import { NextRequest, NextResponse } from 'next/server';
import { countWords } from '@/lib/pages/rules';
import { changePageStatus, listRevisions, PageError, previewPath, type StatusAction } from '@/lib/pages/store';
import { adminContext, logAdmin, pageErrorResponse, readJson } from '../../helpers';

const ACTIONS: StatusAction[] = ['publish', 'unpublish', 'archive', 'restore', 'reject'];

/** Publish, unpublish, archive (soft delete), restore, or reject with a note. There is no hard delete. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let ctx: Awaited<ReturnType<typeof adminContext>> | null = null;
  const { id } = await params;
  let action = '';
  try {
    ctx = await adminContext();
    const body = await readJson(request);
    action = String(body.action ?? '');
    if (!ACTIONS.includes(action as StatusAction)) throw new PageError(400, `action must be one of ${ACTIONS.join(', ')}`);
    const note = typeof body.note === 'string' ? body.note : '';
    const page = await changePageStatus(ctx.db, id, action as StatusAction, ctx.actor, note);
    await logAdmin(ctx.db, ctx.actor, `${action}_page`, page.slug, note ? { note } : undefined);
    return NextResponse.json({ page, preview_path: previewPath(page.preview_token), word_count: countWords(page.body), revisions: await listRevisions(ctx.db, id) });
  } catch (error) {
    if (ctx && error instanceof PageError) await logAdmin(ctx.db, ctx.actor, `${action || 'unknown'}_page`, id, undefined, error.message);
    return pageErrorResponse(error, 'Page action error');
  }
}
