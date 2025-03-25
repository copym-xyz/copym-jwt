"use client";

import { useState } from 'react';
import Link from 'next/link';

export default function VerifyPage() {
  const [certificateId, setCertificateId] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [error, setError] = useState('');

  const handleVerify = async (e) => {
    e.preventDefault();
    
    if (!certificateId.trim()) {
      setError('Please enter a Certificate ID');
      return;
    }
    
    setIsVerifying(true);
    setError('');
    setVerificationResult(null);
    
    try {
      const response = await fetch(`/api/certificates/${certificateId}/verify`);
      const data = await response.json();
      
      if (data.success) {
        setVerificationResult({
          isValid: data.isValid,
          certificate: data.certificate
        });
      } else {
        setError(data.message || 'Verification failed. Please try again.');
      }
    } catch (err) {
      console.error('Certificate verification error:', err);
      setError('An error occurred during verification. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-4">Verify Certificate</h1>
          <p className="text-gray-600 max-w-xl mx-auto">
            Enter a Certificate ID to verify its authenticity. 
            This will check if the certificate is valid and has not been tampered with.
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <form onSubmit={handleVerify}>
            <div className="mb-4">
              <label htmlFor="certificateId" className="block text-sm font-medium text-gray-700 mb-1">
                Certificate ID
              </label>
              <input
                type="text"
                id="certificateId"
                value={certificateId}
                onChange={(e) => setCertificateId(e.target.value)}
                placeholder="Enter Certificate ID"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={isVerifying}
              className={`w-full px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                isVerifying ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isVerifying ? 'Verifying...' : 'Verify Certificate'}
            </button>
          </form>
          
          {error && (
            <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-md">
              {error}
            </div>
          )}
        </div>
        
        {verificationResult && (
          <div className={`bg-white rounded-lg shadow-md p-6 border-t-4 ${
            verificationResult.isValid 
              ? 'border-green-500' 
              : 'border-red-500'
          }`}>
            <div className="flex items-center mb-4">
              {verificationResult.isValid ? (
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              ) : (
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              )}
              
              <div>
                <h2 className="text-xl font-semibold">
                  {verificationResult.isValid 
                    ? 'Certificate is Valid' 
                    : 'Certificate is Invalid'}
                </h2>
                <p className="text-gray-600">
                  {verificationResult.isValid 
                    ? 'This certificate is authentic and has not been tampered with.' 
                    : 'This certificate could not be verified or has been tampered with.'}
                </p>
              </div>
            </div>
            
            {verificationResult.isValid && verificationResult.certificate && (
              <div className="mt-6 border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Certificate Details</h3>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Certificate ID</p>
                    <p className="font-medium">{verificationResult.certificate.id}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500">Title</p>
                    <p className="font-medium">{verificationResult.certificate.title}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500">Recipient</p>
                    <p className="font-medium">
                      {verificationResult.certificate.recipient_name || verificationResult.certificate.recipient_email}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500">Issued By</p>
                    <p className="font-medium">{verificationResult.certificate.issuer_name}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500">Issue Date</p>
                    <p className="font-medium">
                      {new Date(verificationResult.certificate.issued_at).toLocaleDateString()}
                    </p>
                  </div>
                  
                  {verificationResult.certificate.blockchain_hash && (
                    <div>
                      <p className="text-sm text-gray-500">Blockchain Hash</p>
                      <p className="font-medium text-xs break-all">
                        {verificationResult.certificate.blockchain_hash}
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="mt-6">
                  <Link
                    href={`/certificates/${verificationResult.certificate.id}`}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    View Full Certificate
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 