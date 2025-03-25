import { NextResponse } from 'next/server';
import { hasRole } from '@/lib/auth';

export async function GET(request) {
  try {
    // Check if user is authenticated and has issuer role
    const authResult = await hasRole(request, 'issuer');
    
    if (!authResult.authenticated || !authResult.authorized) {
      return NextResponse.json(
        { success: false, message: authResult.message },
        { status: 403 }
      );
    }
    
    // Mock data for assets
    // In a real implementation, this would fetch from the database
    const assets = [
      { id: 1, name: 'Asset A', value: 1000000, status: 'pending' },
      { id: 2, name: 'Asset B', value: 500000, status: 'active' },
    ];
    
    return NextResponse.json({
      success: true,
      assets
    });
    
  } catch (error) {
    console.error('Fetch issuer assets error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch assets' },
      { status: 500 }
    );
  }
} 