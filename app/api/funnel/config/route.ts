import { NextResponse } from 'next/server';
import { dbMock } from '../../../../lib/dbMock';

export async function GET() {
  try {
    const config = await dbMock.getSystemConfig();
    
    // Safely return ONLY the active sessions count to keep the passcode secure
    return NextResponse.json({
      success: true,
      activeSessions: config.activeSessions,
    });
  } catch (error: any) {
    console.error('Error fetching public config:', error);
    return NextResponse.json(
      { success: false, activeSessions: 3 }, // fallback to 3
      { status: 500 }
    );
  }
}
