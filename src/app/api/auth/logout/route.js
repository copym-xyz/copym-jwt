import { NextResponse } from 'next/server';
import { logout, isAuthenticated } from '@/lib/auth';

export async function POST(request) {
  try {
    // Verify the user is authenticated
    const authResult = await isAuthenticated(request);
    
    if (!authResult.authenticated) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Log the user out (invalidate refresh token)
    const result = await logout(authResult.user.id);
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });
    
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, message: 'Logout failed' },
      { status: 500 }
    );
  }
} 