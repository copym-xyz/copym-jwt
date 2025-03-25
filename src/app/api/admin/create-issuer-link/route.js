import { NextResponse } from 'next/server';
import { hasRole, createIssuerInvitation } from '@/lib/auth';

export async function POST(request) {
  try {
    // Check if user is authenticated and has admin role
    const authResult = await hasRole(request, 'admin');
    
    if (!authResult.authenticated || !authResult.authorized) {
      return NextResponse.json(
        { success: false, message: authResult.message },
        { status: 403 }
      );
    }
    
    // Get issuer email from request body
    const body = await request.json();
    const { issuerEmail } = body;
    
    if (!issuerEmail) {
      return NextResponse.json(
        { success: false, message: 'Issuer email is required' },
        { status: 400 }
      );
    }
    
    // Create invitation link
    const result = await createIssuerInvitation(issuerEmail, authResult.user.id);
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      invitationLink: result.invitationLink,
      expiresAt: result.expiresAt
    });
    
  } catch (error) {
    console.error('Create issuer link error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create issuer invitation' },
      { status: 500 }
    );
  }
} 