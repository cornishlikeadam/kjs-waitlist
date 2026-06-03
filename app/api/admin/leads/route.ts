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
    const leads = await dbMock.getAllLeads();
    const config = await dbMock.getSystemConfig();

    return NextResponse.json({
      success: true,
      leads: leads.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
      config,
    });
  } catch (error: any) {
    console.error('Error fetching admin data:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while fetching leads.' },
      { status: 500 }
    );
  }
}
