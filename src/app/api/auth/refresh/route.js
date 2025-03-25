import { NextResponse } from 'next/server';
import { refreshAccessToken } from '@/lib/auth';

export async function POST(request) {
  try {
    const body = await request.json();
    const { refreshToken } = body;
    
    if (!refreshToken) {
      return NextResponse.json(
        { success: false, message: 'Refresh token is required' },
        { status: 400 }
      );
    }
    
    const result = await refreshAccessToken(refreshToken);
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 401 }
      );
    }
    
    return NextResponse.json({
      success: true,
      accessToken: result.accessToken
    });
    
  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json(
      { success: false, message: 'Token refresh failed' },
      { status: 500 }
    );
  }
} 