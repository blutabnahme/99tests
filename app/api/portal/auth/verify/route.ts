export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { verifyMagicLinkToken } from '@/lib/patient-auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.redirect(new URL('/portal/login?error=missing_token', request.url));
    }

    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '';
    const userAgent = request.headers.get('user-agent') || '';

    const session = await verifyMagicLinkToken(token, ip, userAgent);

    if (!session) {
      return NextResponse.redirect(new URL('/portal/login?error=invalid_or_expired', request.url));
    }

    // Set session cookie and redirect to portal
    const response = NextResponse.redirect(new URL('/portal', request.url));
    response.cookies.set('patient_session', session.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      expires: session.expiresAt,
    });

    return response;
  } catch (error: any) {
    console.error('[Portal Auth] Verify error:', error);
    return NextResponse.redirect(new URL('/portal/login?error=server_error', request.url));
  }
}
