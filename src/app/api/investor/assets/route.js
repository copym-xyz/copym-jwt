import { NextResponse } from 'next/server';
import { hasRole } from '@/lib/auth';

export async function GET(request) {
  try {
    // Check if user is authenticated and has investor role
    const authResult = await hasRole(request, 'investor');
    
    if (!authResult.authenticated || !authResult.authorized) {
      return NextResponse.json(
        { success: false, message: authResult.message },
        { status: 403 }
      );
    }
    
    // Mock data for assets available to investors
    // In a real implementation, this would fetch from the database
    const assets = [
      { id: 1, name: 'Asset 1', value: 100, tokenPrice: 10, totalTokens: 1000 },
      { id: 2, name: 'Asset 2', value: 200, tokenPrice: 20, totalTokens: 500 },
    ];
    
    return NextResponse.json({
      success: true,
      assets
    });
    
  } catch (error) {
    console.error('Fetch investor assets error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch assets' },
      { status: 500 }
    );
  }
} 