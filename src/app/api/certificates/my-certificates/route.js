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
    
    // Get certificates for the user
    const certificates = await executeQuery(
      `SELECT c.*, u.email as issuer_email 
       FROM certificate c
       LEFT JOIN user u ON c.issuer_id = u.id
       WHERE c.owner_id = ?
       ORDER BY c.created_at DESC`,
      [authResult.user.id]
    );
    
    // Map certificates to include issuer name (using email if name is not available)
    const mappedCertificates = certificates.map(cert => ({
      id: cert.id,
      title: cert.title || 'Untitled Certificate',
      description: cert.description,
      issuer_id: cert.issuer_id,
      issuer_name: cert.issuer_name || cert.issuer_email || 'Unknown Issuer',
      owner_id: cert.owner_id,
      token_id: cert.token_id,
      metadata: cert.metadata,
      status: cert.status,
      created_at: cert.created_at,
      updated_at: cert.updated_at,
      issued_at: cert.issued_at || cert.created_at
    }));
    
    // Return certificates
    return NextResponse.json({
      success: true,
      certificates: mappedCertificates
    });
    
  } catch (error) {
    console.error('Error getting certificates:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve certificates' },
      { status: 500 }
    );
  }
} 