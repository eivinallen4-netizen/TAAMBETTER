import { NextRequest, NextResponse } from 'next/server';
import { countWords } from '@/lib/pages/rules';
import { getPageById, listRevisions, PageError, previewPath, updatePage } from '@/lib/pages/store';
import { adminContext, logAdmin, pageErrorResponse, readJson } from '../helpers';

type Params = { params: Promise<{ id: string }> };

/** The page, its history and its private preview link. */
export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { db } = await adminContext();
    const { id } = await params;
    const page = await getPageById(db, id);
    if (!page) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ page, preview_path: previewPath(page.preview_token), word_count: countWords(page.body), revisions: await listRevisions(db, id) });
  } catch (error) {
    return pageErrorResponse(error, 'Page fetch error');
  }
}

/** Save: only the fields sent change; the status stays (a live page stays live). */
export async function PATCH(request: NextRequest, { params }: Params) {
  let ctx: Awaited<ReturnType<typeof adminContext>> | null = null;
  const { id } = await params;
  try {
    ctx = await adminContext();
    const body = await readJson(request);
    const page = await updatePage(ctx.db, id, body, ctx.actor);
    await logAdmin(ctx.db, ctx.actor, 'save_page', page.slug, { fields: Object.keys(body) });
    return NextResponse.json({ page, preview_path: previewPath(page.preview_token), word_count: countWords(page.body), revisions: await listRevisions(ctx.db, id) });
  } catch (error) {
    if (ctx && error instanceof PageError) await logAdmin(ctx.db, ctx.actor, 'save_page', id, undefined, error.message);
    return pageErrorResponse(error, 'Page save error');
  }
}
