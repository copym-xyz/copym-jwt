import { NextResponse } from 'next/server';
import { hasRole } from '@/lib/auth';
import { executeQuery } from '@/lib/db';

export async function GET(request) {
  try {
    // Check if user is authenticated and has admin role
    const authResult = await hasRole(request, 'admin');
    
    if (!authResult.authenticated || !authResult.authorized) {
      return NextResponse.json(
        { success: false, message: authResult.message },
        { status: 403 }
      );
    }
    
    // Fetch all users (excluding passwords and refresh tokens)
    const users = await executeQuery(`
      SELECT id, email, role, created_at, updated_at
      FROM users
      ORDER BY id
    `);
    
    return NextResponse.json({
      success: true,
      users
    });
    
  } catch (error) {
    console.error('Fetch users error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch users' },
      { status: 500 }
    );
  }
} 