import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';

export async function GET() {
  try {
    // Check if users table exists by querying it
    const tables = await executeQuery('SHOW TABLES');
    const usersTable = await executeQuery('DESCRIBE users');
    
    return NextResponse.json({
      success: true,
      tables,
      usersTable
    });
  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Database test failed',
        error: error.message 
      },
      { status: 500 }
    );
  }
} 