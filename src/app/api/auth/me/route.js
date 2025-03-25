import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { executeQuery } from '@/lib/db';

export async function GET(request) {
  try {
    // Check if the user is authenticated
    const authResult = await isAuthenticated(request);
    
    if (!authResult.authenticated) {
      return NextResponse.json(
        { success: false, message: authResult.message },
        { status: 401 }
      );
    }
    
    // Get full user data
    const users = await executeQuery(
      'SELECT id, email, role, created_at, updated_at FROM users WHERE id = ?', 
      [authResult.user.id]
    );
    
    if (users.length === 0) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }
    
    // Return user data
    return NextResponse.json({
      success: true,
      user: {
        id: users[0].id,
        email: users[0].email,
        role: users[0].role,
        createdAt: users[0].created_at,
        updatedAt: users[0].updated_at
      }
    });
    
  } catch (error) {
    console.error('Error getting user data:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve user data' },
      { status: 500 }
    );
  }
} 