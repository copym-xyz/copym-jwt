"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthProtect({ children, requiredRole }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasRequiredRole, setHasRequiredRole] = useState(false);
  
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const accessToken = localStorage.getItem('accessToken');
        
        if (!accessToken) {
          // No token found, redirect to login
          router.push('/login');
          return;
        }
        
        try {
          // Verify the token with the backend
          const response = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          });

          // Check if the response is OK before parsing
          if (!response.ok) {
            // Handle non-200 responses
            console.error('Auth status check error:', response.status, response.statusText);
            throw new Error(`Authentication failed: ${response.statusText}`);
          }
          
          const data = await response.json();
          
          if (data.success) {
            setIsAuthenticated(true);
            
            // Check if the user has the required role
            if (requiredRole) {
              if (data.user.role === requiredRole) {
                setHasRequiredRole(true);
              } else {
                // If role doesn't match, redirect to appropriate dashboard
                if (data.user.role === 'admin') {
                  router.push('/admin/dashboard');
                } else if (data.user.role === 'issuer') {
                  router.push('/issuer/dashboard');
                } else {
                  router.push('/dashboard');
                }
              }
            } else {
              // If no specific role is required, consider the user has the required role
              setHasRequiredRole(true);
            }
          } else {
            // Invalid token, redirect to login
            localStorage.removeItem('accessToken');
            router.push('/login');
          }
        } catch (fetchError) {
          console.error('Auth check error:', fetchError);
          
          // On error, logout and redirect
          localStorage.removeItem('accessToken');
          router.push('/login');
        }
      } catch (err) {
        console.error('Auth general error:', err);
        
        // On error, logout and redirect
        localStorage.removeItem('accessToken');
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, [router, requiredRole]);
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-xl">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return null; // Will redirect in the useEffect
  }
  
  if (!hasRequiredRole) {
    return null; // Will redirect in the useEffect
  }
  
  return children;
} 