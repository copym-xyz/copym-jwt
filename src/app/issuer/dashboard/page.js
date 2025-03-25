"use client";

import { useState, useEffect } from 'react';
import AuthProtect from '@/components/AuthProtect';
import IssueCertificateForm from '@/components/IssueCertificateForm';

export default function IssuerDashboard() {
  const [issuedCertificates, setIssuedCertificates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        const accessToken = localStorage.getItem('accessToken');
        
        const response = await fetch('/api/issuer/certificates', {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });
        
        const data = await response.json();
        
        if (data.success) {
          setIssuedCertificates(data.certificates);
        } else {
          setError(data.message || 'Failed to fetch certificates');
        }
      } catch (err) {
        console.error('Error fetching certificates:', err);
        setError('An error occurred while fetching certificates');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCertificates();
  }, [refreshTrigger]);

  const handleCertificateIssued = () => {
    // Trigger a refresh of the certificates list
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <AuthProtect requiredRole="issuer">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Issuer Dashboard</h1>
        
        <div className="mb-10 p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Issue New Certificate</h2>
          
          <IssueCertificateForm onCertificateIssued={handleCertificateIssued} />
        </div>
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <h2 className="text-xl font-semibold p-6 border-b">Issued Certificates</h2>
          
          {error && (
            <div className="bg-red-100 text-red-700 p-3 m-6 rounded">
              {error}
            </div>
          )}
          
          {isLoading ? (
            <div className="p-6 text-center">Loading certificates...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recipient</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {issuedCertificates.map((cert) => (
                    <tr key={cert.id}>
                      <td className="px-6 py-4 whitespace-nowrap">{cert.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{cert.recipient_email}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{cert.title}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {new Date(cert.issued_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <a 
                          href={`/api/certificates/${cert.id}/download`}
                          className="text-blue-600 hover:text-blue-800 mr-4"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Download
                        </a>
                        <a 
                          href={`/certificates/${cert.id}`}
                          className="text-blue-600 hover:text-blue-800"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View
                        </a>
                      </td>
                    </tr>
                  ))}
                  
                  {issuedCertificates.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                        No certificates issued yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AuthProtect>
  );
} 