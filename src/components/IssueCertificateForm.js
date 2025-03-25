"use client";

import { useState } from 'react';

export default function IssueCertificateForm({ onCertificateIssued }) {
  const [formData, setFormData] = useState({
    recipientEmail: '',
    title: '',
    issueDate: new Date().toISOString().split('T')[0],
    description: '',
    skills: '',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');
    
    try {
      const accessToken = localStorage.getItem('accessToken');
      
      const response = await fetch('/api/issuer/issue-certificate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          recipientEmail: formData.recipientEmail,
          title: formData.title,
          issueDate: formData.issueDate,
          description: formData.description,
          skills: formData.skills.split(',').map(skill => skill.trim()).filter(Boolean),
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess('Certificate issued successfully!');
        setFormData({
          recipientEmail: '',
          title: '',
          issueDate: new Date().toISOString().split('T')[0],
          description: '',
          skills: '',
        });
        
        if (onCertificateIssued) {
          onCertificateIssued();
        }
      } else {
        setError(data.message || 'Failed to issue certificate');
      }
    } catch (err) {
      console.error('Error issuing certificate:', err);
      setError('An error occurred while issuing the certificate');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 text-green-700 p-3 rounded mb-4">
          {success}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="recipientEmail" className="block text-sm font-medium mb-1">
            Recipient Email *
          </label>
          <input
            type="email"
            id="recipientEmail"
            name="recipientEmail"
            value={formData.recipientEmail}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            required
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="title" className="block text-sm font-medium mb-1">
            Certificate Title *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            required
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="issueDate" className="block text-sm font-medium mb-1">
            Issue Date *
          </label>
          <input
            type="date"
            id="issueDate"
            name="issueDate"
            value={formData.issueDate}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            required
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="description" className="block text-sm font-medium mb-1">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="skills" className="block text-sm font-medium mb-1">
            Skills (comma separated)
          </label>
          <input
            type="text"
            id="skills"
            name="skills"
            value={formData.skills}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="e.g. JavaScript, React, Node.js"
          />
        </div>
        
        <button
          type="submit"
          disabled={isSubmitting}
          className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 ${
            isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isSubmitting ? 'Issuing...' : 'Issue Certificate'}
        </button>
      </form>
    </div>
  );
} 