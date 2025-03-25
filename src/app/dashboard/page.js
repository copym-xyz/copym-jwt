"use client";

import { useState, useEffect } from 'react';
import AuthProtect from '@/components/AuthProtect';
import Link from 'next/link';

export default function UserDashboard() {
  const [certificates, setCertificates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const accessToken = localStorage.getItem('accessToken');
        
        if (!accessToken) {
          setError('You are not logged in');
          setIsLoading(false);
          return;
        }
        
        try {
          // Fetch user data
          const userResponse = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          });
          
          if (!userResponse.ok) {
            throw new Error(`Failed to fetch user data: ${userResponse.status} ${userResponse.statusText}`);
          }
          
          const userData = await userResponse.json();
          
          if (userData.success) {
            setUser(userData.user);
            
            try {
              // Fetch user's certificates
              const certificatesResponse = await fetch('/api/certificates/my-certificates', {
                headers: {
                  'Authorization': `Bearer ${accessToken}`
                }
              });
              
              if (!certificatesResponse.ok) {
                throw new Error(`Failed to fetch certificates: ${certificatesResponse.status} ${certificatesResponse.statusText}`);
              }
              
              const certificatesData = await certificatesResponse.json();
              
              if (certificatesData.success) {
                setCertificates(certificatesData.certificates || []);
              } else {
                setError(certificatesData.message || 'Failed to fetch certificates');
              }
            } catch (certError) {
              console.error('Error fetching certificates:', certError);
              setError('Failed to load certificates. Please try again later.');
            }
          } else {
            setError(userData.message || 'Failed to fetch user data');
          }
        } catch (userError) {
          console.error('Error fetching user data:', userError);
          setError('Failed to load user data. Please try again later.');
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('An error occurred while loading your dashboard');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  return (
    <AuthProtect>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Your Dashboard</h1>
        
        {isLoading ? (
          <div className="p-6 text-center">Loading your dashboard...</div>
        ) : (
          <>
            {error && (
              <div className="bg-red-100 text-red-700 p-4 rounded mb-6">
                {error}
              </div>
            )}
            
            {user && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <h2 className="text-xl font-semibold mb-4">Welcome, {user.name || user.email}!</h2>
                <p className="text-gray-600">
                  Here you can view and manage all your certificates.
                </p>
              </div>
            )}
            
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <h2 className="text-xl font-semibold p-6 border-b">Your Certificates</h2>
              
              {certificates.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-gray-600 mb-4">You don&apos;t have any certificates yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                  {certificates.map((cert) => (
                    <div key={cert.id} className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                      <div className="p-4 bg-blue-50 border-b">
                        <h3 className="font-semibold text-lg truncate">{cert.title}</h3>
                      </div>
                      <div className="p-4">
                        <p className="text-sm text-gray-600 mb-2">
                          <span className="font-semibold">Issued by:</span> {cert.issuer_name}
                        </p>
                        <p className="text-sm text-gray-600 mb-4">
                          <span className="font-semibold">Issue date:</span> {new Date(cert.issued_at).toLocaleDateString()}
                        </p>
                        <div className="flex space-x-2">
                          <Link 
                            href={`/certificates/${cert.id}`}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                          >
                            View
                          </Link>
                          <a 
                            href={`/api/certificates/${cert.id}/download`}
                            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                            download
                          >
                            Download
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AuthProtect>
  );
} 