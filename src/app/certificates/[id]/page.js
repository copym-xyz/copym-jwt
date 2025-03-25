"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function CertificateView() {
  const { id } = useParams();
  const [certificate, setCertificate] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCertificate = async () => {
      try {
        const response = await fetch(`/api/certificates/${id}`);
        const data = await response.json();
        
        if (data.success) {
          setCertificate(data.certificate);
        } else {
          setError(data.message || 'Failed to fetch certificate');
        }
      } catch (err) {
        console.error('Error fetching certificate:', err);
        setError('An error occurred while fetching the certificate');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (id) {
      fetchCertificate();
    }
  }, [id]);

  const handleVerifyCertificate = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`/api/certificates/${id}/verify`);
      const data = await response.json();
      
      if (data.success) {
        alert(`Certificate is ${data.isValid ? 'valid' : 'invalid'}!`);
      } else {
        setError(data.message || 'Failed to verify certificate');
      }
    } catch (err) {
      console.error('Error verifying certificate:', err);
      setError('An error occurred while verifying the certificate');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="p-8 bg-white rounded-lg shadow-md">
          <p className="text-lg">Loading certificate...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="p-8 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-lg mb-4">{error}</p>
          <Link href="/" className="text-blue-600 hover:underline">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  if (!certificate) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="p-8 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4">Certificate Not Found</h2>
          <p className="text-lg mb-4">The certificate you are looking for does not exist.</p>
          <Link href="/" className="text-blue-600 hover:underline">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="relative h-32 bg-blue-600">
            <div className="absolute top-0 left-0 w-full h-full opacity-20">
              {/* Pattern or background design could go here */}
            </div>
          </div>
          
          <div className="p-8 relative">
            <div className="absolute top-0 right-0 -mt-16 mr-8">
              {certificate.issuer_logo && (
                <div className="w-24 h-24 rounded-full bg-white p-2 shadow-lg">
                  <Image
                    src={certificate.issuer_logo}
                    alt={certificate.issuer_name}
                    width={100}
                    height={100}
                    className="rounded-full object-contain"
                  />
                </div>
              )}
            </div>
            
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold text-gray-800">Certificate of Achievement</h1>
              <p className="text-gray-600 mt-2">This certifies that</p>
              <p className="text-2xl font-semibold text-blue-600 mt-2">{certificate.recipient_name || certificate.recipient_email}</p>
              <p className="text-gray-600 mt-2">has successfully completed</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{certificate.title}</p>
            </div>
            
            <div className="border-t border-b border-gray-200 py-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-gray-600 text-sm">Issued By</p>
                  <p className="font-semibold">{certificate.issuer_name}</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-600 text-sm">Issue Date</p>
                  <p className="font-semibold">{new Date(certificate.issued_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
            
            {certificate.description && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Description</h3>
                <p className="text-gray-700">{certificate.description}</p>
              </div>
            )}
            
            {certificate.skills && certificate.skills.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {certificate.skills.map((skill, index) => (
                    <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex justify-between items-center mt-8">
              <button
                onClick={handleVerifyCertificate}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Verify Certificate
              </button>
              
              <a
                href={`/api/certificates/${id}/download`}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                download
              >
                Download Certificate
              </a>
            </div>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                Certificate ID: {certificate.id}
              </p>
              {certificate.blockchain_hash && (
                <p className="text-sm text-gray-500 mt-1">
                  Blockchain Hash: {certificate.blockchain_hash}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 