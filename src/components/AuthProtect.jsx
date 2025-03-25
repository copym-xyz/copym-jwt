"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthProtect({ 
  children, 
  requiredRole = null 
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  
  useEffect(() => {
    // Check if user is authenticated
    const accessToken = localStorage.getItem('accessToken');
    const userRole = localStorage.getItem('userRole');
    
    if (!accessToken) {
      // No token found, redirect to login
      router.push('/login');
      return;
    }
    
    // If a specific role is required, check it
    if (requiredRole && userRole !== requiredRole) {
      // User doesn't have the required role, redirect to appropriate dashboard
      switch (userRole) {
        case 'admin':
          router.push('/admin/dashboard');
          break;
        case 'issuer':
          router.push('/issuer/dashboard');
          break;
        case 'investor':
          router.push('/investor/dashboard');
          break;
        default:
          router.push('/login');
      }
      return;
    }
    
    // Verify token with the server
    verifyToken(accessToken).then(isValid => {
      if (!isValid) {
        // Token is invalid, try to refresh
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          refreshAccessToken(refreshToken).then(newToken => {
            if (newToken) {
              // Got new token, consider authenticated
              localStorage.setItem('accessToken', newToken);
              setIsAuthenticated(true);
            } else {
              // Couldn't refresh token, redirect to login
              clearAuth();
              router.push('/login');
            }
            setIsLoading(false);
          });
        } else {
          // No refresh token, redirect to login
          clearAuth();
          router.push('/login');
          setIsLoading(false);
        }
      } else {
        // Token is valid
        setIsAuthenticated(true);
        setIsLoading(false);
      }
    });
  }, [router, requiredRole]);
  
  // Helper function to verify token with the server
  const verifyToken = async (token) => {
    try {
      // This would be a call to your server to verify the token
      // For this example, we'll just check if the token exists and hasn't expired
      // In a real app, you would verify the token with the server
      
      if (!token) return false;
      
      // Decode the token (this is a simple check, not secure)
      const parts = token.split('.');
      if (parts.length !== 3) return false;
      
      const payload = JSON.parse(atob(parts[1]));
      const exp = payload.exp * 1000; // Convert to milliseconds
      
      return Date.now() < exp;
    } catch (error) {
      console.error('Token verification error:', error);
      return false;
    }
  };
  
  // Helper function to refresh the access token
  const refreshAccessToken = async (refreshToken) => {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        return data.accessToken;
      }
      
      return null;
    } catch (error) {
      console.error('Token refresh error:', error);
      return null;
    }
  };
  
  // Helper function to clear authentication
  const clearAuth = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
  };
  
  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return null; // Will redirect in the useEffect
  }
  
  return <>{children}</>;
} 