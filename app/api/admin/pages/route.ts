import { NextRequest, NextResponse } from 'next/server';
import { createPage, listPages, PageError } from '@/lib/pages/store';
import { adminContext, logAdmin, pageErrorResponse, readJson } from './helpers';

// SEO pages for /admin/pages. Claude drafts them over MCP (create_page); this is the same data and
// the same guardrails (lib/pages/store.ts) for logged-in admins.

export async function GET(request: NextRequest) {
  try {
    const { db } = await adminContext();
    const q = request.nextUrl.searchParams;
    const sort = q.get('sort');
    return NextResponse.json(
      await listPages(db, {
        status: q.get('status') ?? undefined,
        query: q.get('q') ?? undefined,
        sort: sort === 'oldest' || sort === 'updated' || sort === 'published' ? sort : 'newest',
      })
    );
  } catch (error) {
    return pageErrorResponse(error, 'Pages list error');
  }
}

export async function POST(request: NextRequest) {
  let ctx: Awaited<ReturnType<typeof adminContext>> | null = null;
  let body: Record<string, unknown> = {};
  try {
    ctx = await adminContext();
    body = await readJson(request);
    const page = await createPage(ctx.db, body, ctx.actor);
    await logAdmin(ctx.db, ctx.actor, 'create_page', page.slug, { title: page.title, main_keyword: page.main_keyword });
    return NextResponse.json(page, { status: 201 });
  } catch (error) {
    if (ctx && error instanceof PageError) await logAdmin(ctx.db, ctx.actor, 'create_page', String(body.slug ?? ''), undefined, error.message);
    return pageErrorResponse(error, 'Page create error');
  }
}
