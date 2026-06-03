import { NextResponse } from 'next/server';
import { dbMock } from '../../../../lib/dbMock';

function isAuthorized(request: Request) {
  const expectedPasscode = process.env.ADMIN_PASSCODE || '9938';
  const headers = request.headers;
  
  // Custom header
  const customHeader = headers.get('x-admin-passcode');
  if (customHeader === expectedPasscode) return true;

  // Authorization header
  const authHeader = headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    if (authHeader.substring(7).trim() === expectedPasscode) return true;
  }

  // Cookie header
  const cookieHeader = headers.get('cookie') || '';
  const match = cookieHeader.match(/(?:^|; )admin_passcode=([^;]*)/);
  if (match && match[1] === expectedPasscode) return true;

  return false;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { success: false, message: '401 Unauthorized: Access restricted.' },
      { status: 401 }
    );
  }

  try {
    const config = await dbMock.getSystemConfig();
    return NextResponse.json({
      success: true,
      config,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve system configuration.', error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { success: false, message: '401 Unauthorized: Access restricted.' },
      { status: 401 }
    );
  }

  try {
    let body: any;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json(
        { success: false, message: 'Invalid JSON body.' },
        { status: 400 }
      );
    }

    const { activeSessions, adminPasscode } = body;
    const updates: any = {};

    if (activeSessions !== undefined) {
      const val = parseInt(activeSessions, 10);
      if (isNaN(val) || val < 0) {
        return NextResponse.json(
          { success: false, message: 'Active sessions must be a non-negative number.' },
          { status: 400 }
        );
      }
      updates.activeSessions = val;
    }

    if (adminPasscode !== undefined) {
      if (typeof adminPasscode !== 'string' || adminPasscode.trim().length < 4) {
        return NextResponse.json(
          { success: false, message: 'Passcode must be at least 4 characters long.' },
          { status: 400 }
        );
      }
      updates.adminPasscode = adminPasscode.trim();
    }

    const updatedConfig = await dbMock.updateSystemConfig(updates);

    return NextResponse.json({
      success: true,
      message: 'System configuration updated successfully.',
      config: updatedConfig,
    });
  } catch (error: any) {
    console.error('Error updating system config:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while updating configuration.' },
      { status: 500 }
    );
  }
}
