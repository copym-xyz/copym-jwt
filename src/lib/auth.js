"use server";

import { verifyToken, extractTokenFromHeader, generateAccessToken, generateRefreshToken } from './jwt';
import { executeQuery } from './db';
import bcrypt from 'bcryptjs';

// Authenticate a user with email/password
export async function authenticateUser(email, password) {
  try {
    // Find user by email
    console.log('Attempting to authenticate user:', email);
    const users = await executeQuery('SELECT * FROM users WHERE email = ?', [email]);
    
    if (users.length === 0) {
      console.log('User not found in database');
      return { success: false, message: 'Invalid credentials' };
    }
    
    const user = users[0];
    console.log('User found:', user.id, user.email, user.role);
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('Password valid:', isPasswordValid);
    
    if (!isPasswordValid) {
      return { success: false, message: 'Invalid credentials' };
    }
    
    // Generate tokens
    const accessToken = await generateAccessToken({ 
      sub: user.id, 
      email: user.email, 
      role: user.role 
    });
    
    const refreshToken = await generateRefreshToken({ 
      sub: user.id 
    });
    
    // Store refresh token in the database
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await executeQuery(
      'UPDATE users SET refresh_token = ? WHERE id = ?',
      [hashedRefreshToken, user.id]
    );
    
    return {
      success: true,
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return { success: false, message: 'Authentication failed: ' + error.message };
  }
}

// Register a new user (investor only by default)
export async function registerUser(email, password, role = 'investor') {
  try {
    // Check if user already exists
    const existingUsers = await executeQuery('SELECT * FROM users WHERE email = ?', [email]);
    
    if (existingUsers.length > 0) {
      return { success: false, message: 'User already exists' };
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Insert new user
    const result = await executeQuery(
      'INSERT INTO users (email, password, role) VALUES (?, ?, ?)',
      [email, hashedPassword, role]
    );
    
    return {
      success: true,
      userId: result.insertId,
      message: 'User registered successfully'
    };
  } catch (error) {
    console.error('Registration error:', error);
    return { success: false, message: 'Registration failed' };
  }
}

// Register a new issuer with an invitation token
export async function registerIssuer(email, password, invitationToken) {
  try {
    // Verify invitation token
    const invitations = await executeQuery(
      'SELECT * FROM issuer_invitations WHERE token = ? AND used = FALSE AND expires_at > NOW()',
      [invitationToken]
    );
    
    if (invitations.length === 0) {
      return { success: false, message: 'Invalid or expired invitation' };
    }
    
    const invitation = invitations[0];
    
    // Check if the email matches the invitation
    if (invitation.email !== email) {
      return { success: false, message: 'Email does not match invitation' };
    }
    
    // Register the issuer
    const result = await registerUser(email, password, 'issuer');
    
    if (result.success) {
      // Mark invitation as used
      await executeQuery(
        'UPDATE issuer_invitations SET used = TRUE WHERE id = ?',
        [invitation.id]
      );
    }
    
    return result;
  } catch (error) {
    console.error('Issuer registration error:', error);
    return { success: false, message: 'Issuer registration failed' };
  }
}

// Create a time-limited invitation link for a new issuer (admin only)
export async function createIssuerInvitation(issuerEmail, adminId) {
  try {
    // Verify the admin
    const admins = await executeQuery(
      'SELECT * FROM users WHERE id = ? AND role = "admin"',
      [adminId]
    );
    
    if (admins.length === 0) {
      return { success: false, message: 'Unauthorized: Admin privileges required' };
    }
    
    // Generate a unique token
    const token = require('crypto').randomBytes(32).toString('hex');
    
    // Set expiration to 7 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    // Insert invitation record
    await executeQuery(
      'INSERT INTO issuer_invitations (token, email, expires_at, created_by) VALUES (?, ?, ?, ?)',
      [token, issuerEmail, expiresAt, adminId]
    );
    
    // Generate invitation link
    const invitationLink = `${process.env.NEXTAUTH_URL}/register/issuer?token=${token}&email=${encodeURIComponent(issuerEmail)}`;
    
    return {
      success: true,
      invitationLink,
      expiresAt
    };
  } catch (error) {
    console.error('Invitation creation error:', error);
    return { success: false, message: 'Failed to create invitation' };
  }
}

// Middleware to check if a user is authenticated
export async function isAuthenticated(request) {
  // Get authorization header
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return { authenticated: false, message: 'No token provided' };
  }
  
  // Extract and verify token
  const token = await extractTokenFromHeader(authHeader);
  if (!token) {
    return { authenticated: false, message: 'Invalid token format' };
  }
  
  const decoded = await verifyToken(token);
  if (!decoded) {
    return { authenticated: false, message: 'Invalid or expired token' };
  }
  
  // Verify user exists in the database
  const users = await executeQuery('SELECT id, email, role FROM users WHERE id = ?', [decoded.sub]);
  if (users.length === 0) {
    return { authenticated: false, message: 'User not found' };
  }
  
  // Return authenticated user
  return {
    authenticated: true,
    user: {
      id: users[0].id,
      email: users[0].email,
      role: users[0].role
    }
  };
}

// Middleware to check if user has a specific role
export async function hasRole(request, requiredRole) {
  const authResult = await isAuthenticated(request);
  
  if (!authResult.authenticated) {
    return authResult;
  }
  
  // Check user role
  if (authResult.user.role !== requiredRole) {
    return {
      authenticated: true,
      authorized: false,
      message: `Access denied: ${requiredRole} role required`
    };
  }
  
  return {
    authenticated: true,
    authorized: true,
    user: authResult.user
  };
}

// Refresh access token using refresh token
export async function refreshAccessToken(refreshToken) {
  try {
    // Verify the refresh token
    const decoded = await verifyToken(refreshToken);
    if (!decoded) {
      return { success: false, message: 'Invalid refresh token' };
    }
    
    // Get user
    const users = await executeQuery('SELECT * FROM users WHERE id = ?', [decoded.sub]);
    if (users.length === 0) {
      return { success: false, message: 'User not found' };
    }
    
    const user = users[0];
    
    // Verify stored refresh token
    const isValidRefreshToken = await bcrypt.compare(refreshToken, user.refresh_token);
    if (!isValidRefreshToken) {
      return { success: false, message: 'Invalid refresh token' };
    }
    
    // Generate new access token
    const accessToken = await generateAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role
    });
    
    return {
      success: true,
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    };
  } catch (error) {
    console.error('Token refresh error:', error);
    return { success: false, message: 'Failed to refresh token' };
  }
}

// Logout (invalidate refresh token)
export async function logout(userId) {
  try {
    await executeQuery('UPDATE users SET refresh_token = NULL WHERE id = ?', [userId]);
    return { success: true, message: 'Logged out successfully' };
  } catch (error) {
    console.error('Logout error:', error);
    return { success: false, message: 'Logout failed' };
  }
} 