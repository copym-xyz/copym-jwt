"use server";

import passport from 'passport';
import { Strategy as OAuth2Strategy } from 'passport-oauth2';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { executeQuery } from './db';
import { generateAccessToken, generateRefreshToken } from './jwt';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

// Configure Passport to use OAuth2
export function configurePassport() {
  // OAuth2 strategy
  passport.use('oauth2', new OAuth2Strategy({
    authorizationURL: 'https://your-oauth2-provider.com/oauth2/authorize',
    tokenURL: 'https://your-oauth2-provider.com/oauth2/token',
    clientID: process.env.OAUTH2_CLIENT_ID,
    clientSecret: process.env.OAUTH2_CLIENT_SECRET,
    callbackURL: process.env.OAUTH2_CALLBACK_URL,
    state: true
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      // In a real implementation, you would receive user profile data from the OAuth provider
      // For this example, we'll simulate fetching user data from the OAuth provider
      const oauthUserInfo = await fetchUserInfoFromOAuthProvider(accessToken);
      
      // Check if user already exists in our database
      const users = await executeQuery('SELECT * FROM users WHERE email = ?', [oauthUserInfo.email]);
      
      if (users.length > 0) {
        // User exists, return user
        return done(null, users[0]);
      } else {
        // User doesn't exist, create a new user with investor role by default
        const result = await executeQuery(
          'INSERT INTO users (email, role) VALUES (?, ?)',
          [oauthUserInfo.email, 'investor']
        );
        
        const newUser = {
          id: result.insertId,
          email: oauthUserInfo.email,
          role: 'investor'
        };
        
        return done(null, newUser);
      }
    } catch (error) {
      return done(error);
    }
  }));
  
  // JWT strategy for protected routes
  passport.use('jwt', new JwtStrategy({
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET
  }, async (payload, done) => {
    try {
      // Find user by ID
      const users = await executeQuery('SELECT id, email, role FROM users WHERE id = ?', [payload.sub]);
      
      if (users.length === 0) {
        return done(null, false);
      }
      
      return done(null, users[0]);
    } catch (error) {
      return done(error, false);
    }
  }));
  
  // Serialize user to session
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  
  // Deserialize user from session
  passport.deserializeUser(async (id, done) => {
    try {
      const users = await executeQuery('SELECT id, email, role FROM users WHERE id = ?', [id]);
      
      if (users.length === 0) {
        return done(null, false);
      }
      
      done(null, users[0]);
    } catch (error) {
      done(error, false);
    }
  });
  
  return passport;
}

// Mock function to simulate getting user info from OAuth provider
async function fetchUserInfoFromOAuthProvider(accessToken) {
  // In a real implementation, this would make an API call to the OAuth provider
  // using the accessToken to get user information
  
  // For this example, we'll return a mock user
  return {
    id: 'oauth-user-123',
    email: 'oauth-user@example.com',
    name: 'OAuth User',
  };
}

// Handle OAuth2 callback and generate JWT tokens
export async function handleOAuthCallback(req, res) {
  try {
    // This would be triggered after a successful OAuth authentication
    // The user object would be available in req.user
    
    const user = req.user;
    
    // Generate JWT tokens
    const accessToken = generateAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role
    });
    
    const refreshToken = generateRefreshToken({
      sub: user.id
    });
    
    // Store refresh token in database
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
    console.error('OAuth callback error:', error);
    return { success: false, message: 'Authentication failed' };
  }
} 