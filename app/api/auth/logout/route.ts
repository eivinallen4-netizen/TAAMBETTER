import { NextRequest, NextResponse } from 'next/server';
import { logout } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await logout();

    return NextResponse.json(
      {
        success: true,
        message: 'Successfully logged out',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'Failed to logout' }, { status: 500 });
  }
}
