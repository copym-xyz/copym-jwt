import { NextResponse } from 'next/server';
import { registerIssuer } from '@/lib/auth';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password, token } = body;
    
    // Validate required fields
    if (!email || !password || !token) {
      return NextResponse.json(
        { success: false, message: 'Email, password, and invitation token are required' },
        { status: 400 }
      );
    }
    
    // Register issuer with the invitation token
    const result = await registerIssuer(email, password, token);
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Issuer registration successful. You can now log in.',
      userId: result.userId
    });
    
  } catch (error) {
    console.error('Issuer registration error:', error);
    return NextResponse.json(
      { success: false, message: 'Issuer registration failed' },
      { status: 500 }
    );
  }
} 