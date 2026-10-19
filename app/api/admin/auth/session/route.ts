import { NextResponse } from 'next/server';
import { requireStaff, sessionRole } from '@/lib/admin-auth';

export async function GET() {
  try {
    const session = await requireStaff();
    return NextResponse.json({ authenticated: true, role: sessionRole(session), name: session.name ?? 'Admin', id: session.sub });
  } catch {
    return NextResponse.json({ authenticated: false });
  }
}
