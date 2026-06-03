import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only run validation checks for admin API endpoints or admin dashboard routes
  const isAdminRoute = pathname.startsWith('/api/admin') || pathname.startsWith('/hidden-deck');

  if (isAdminRoute) {
    const expectedPasscode = process.env.ADMIN_PASSCODE || '9938';

    // 1. Check incoming header strings: Authorization Bearer token or custom x-admin-passcode header
    let authorized = false;

    // Check custom header first
    const customHeaderPasscode = request.headers.get('x-admin-passcode');
    if (customHeaderPasscode === expectedPasscode) {
      authorized = true;
    }

    // Check standard Authorization header (Bearer <token>)
    if (!authorized) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7).trim();
        if (token === expectedPasscode) {
          authorized = true;
        }
      }
    }

    // 2. Check authorization cookies (admin_passcode)
    if (!authorized) {
      const adminCookie = request.cookies.get('admin_passcode');
      if (adminCookie && adminCookie.value === expectedPasscode) {
        authorized = true;
      }
    }

    // 3. If credentials fail validation criteria, instantly yield a clean 401 Unauthorized response payload
    if (!authorized) {
      // Determine if request expects JSON (like API routes) or standard HTML/other
      const isApiRoute = pathname.startsWith('/api/');

      if (isApiRoute) {
        return new NextResponse(
          JSON.stringify({
            success: false,
            message: '401 Unauthorized: Access to administrative dashboard records is restricted.',
          }),
          {
            status: 401,
            headers: {
              'Content-Type': 'application/json',
              'WWW-Authenticate': 'Bearer realm="Admin Area"',
            },
          }
        );
      } else {
        // Yield a clean 401 Unauthorized plain text / minimal response payload for page requests
        return new NextResponse(
          `<!DOCTYPE html>
          <html>
            <head>
              <title>401 Unauthorized</title>
              <style>
                body {
                  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                  background: #ffffff;
                  color: #000000;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  justify-content: center;
                  height: 100vh;
                  margin: 0;
                }
                .container {
                  text-align: center;
                  border: 1px solid #eaeaea;
                  padding: 40px;
                  border-radius: 8px;
                  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
                }
                h1 {
                  font-size: 24px;
                  font-weight: 600;
                  margin-bottom: 8px;
                }
                p {
                  color: #666;
                  font-size: 14px;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>401 Unauthorized</h1>
                <p>You do not have access credentials to view this administrative asset.</p>
              </div>
            </body>
          </html>`,
          {
            status: 401,
            headers: {
              'Content-Type': 'text/html',
            },
          }
        );
      }
    }
  }

  // Continue standard routing pipeline if authorized or non-admin route
  return NextResponse.next();
}

// Configuration to optimize matcher overhead and filter target routes
export const config = {
  matcher: [
    '/api/admin/:path*',
    '/hidden-deck/:path*',
  ],
};
