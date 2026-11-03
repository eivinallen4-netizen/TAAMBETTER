import { NextRequest, NextResponse } from 'next/server';
import { emptyPageFields, pickPageFields } from '@/lib/pages/rules';
import { validatePage } from '@/lib/pages/store';
import { adminContext, pageErrorResponse, readJson } from '../helpers';

/** The editor's live guardrail check: the exact validation a save runs, without saving. Body: { id?, ...fields }. */
export async function POST(request: NextRequest) {
  try {
    const { db } = await adminContext();
    const body = await readJson(request);
    const id = typeof body.id === 'string' ? body.id : undefined;
    return NextResponse.json(await validatePage(db, { ...emptyPageFields(), ...pickPageFields(body) }, id));
  } catch (error) {
    return pageErrorResponse(error, 'Page validate error');
  }
}
