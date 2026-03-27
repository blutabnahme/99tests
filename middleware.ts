import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const stagingPassword = process.env.STAGING_PASSWORD;

  if (stagingPassword) {
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return new NextResponse('Authentication required', {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="99Tests Staging"',
        },
      });
    }
    
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = atob(base64Credentials);
    const [username, password] = credentials.split(':');
    
    // Username can be anything, only password matters
    if (password !== stagingPassword) {
      return new NextResponse('Invalid credentials', {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="99Tests Staging"',
        },
      });
    }
  }

  let res = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          req.cookies.set({ name, value, ...options });
          res.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          req.cookies.set({ name, value: '', ...options });
          res.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const url = req.nextUrl.clone();
  const path = url.pathname;

  if (!user) {
    if (path.startsWith('/bc') || path.startsWith('/admin')) {
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
    return res;
  }

  const userRole = user.user_metadata?.role;

  if (path.startsWith('/bc') && userRole !== 'blood_collector') {
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  if (path.startsWith('/admin') && userRole !== 'admin') {
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  if (path === '/login' || path.startsWith('/register')) {
    if (userRole === 'healthcare_company') url.pathname = '/dashboard';
    else if (userRole === 'blood_collector') url.pathname = '/bc';
    else if (userRole === 'patient') url.pathname = '/patient';
    else if (userRole === 'admin') url.pathname = '/admin';
    else url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return res;
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
