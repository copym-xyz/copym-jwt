"use client";

import { useState, useEffect } from 'react';
import AuthProtect from '@/components/AuthProtect';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const accessToken = localStorage.getItem('accessToken');
        
        const response = await fetch('/api/admin/users', {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });
        
        const data = await response.json();
        
        if (data.success) {
          setUsers(data.users);
        } else {
          setError(data.message || 'Failed to fetch users');
        }
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('An error occurred while fetching users');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUsers();
  }, []);

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    setInviteSuccess('');
    setError('');
    
    if (!inviteEmail) {
      setError('Email is required');
      return;
    }
    
    try {
      const accessToken = localStorage.getItem('accessToken');
      
      const response = await fetch('/api/admin/create-issuer-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ issuerEmail: inviteEmail })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setInviteLink(data.invitationLink);
        setInviteSuccess(`Invitation link created for ${inviteEmail}. Expires: ${new Date(data.expiresAt).toLocaleString()}`);
        setInviteEmail('');
      } else {
        setError(data.message || 'Failed to create invitation link');
      }
    } catch (err) {
      console.error('Error creating invitation:', err);
      setError('An error occurred while creating invitation');
    }
  };

  return (
    <AuthProtect requiredRole="admin">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
        
        <div className="mb-10 p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Create Issuer Invitation</h2>
          
          {error && (
            <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
              {error}
            </div>
          )}
          
          {inviteSuccess && (
            <div className="bg-green-100 text-green-700 p-3 rounded mb-4">
              {inviteSuccess}
            </div>
          )}
          
          {inviteLink && (
            <div className="bg-blue-50 p-4 rounded-md mb-4">
              <p className="mb-2 font-medium">Invitation Link:</p>
              <input 
                type="text" 
                value={inviteLink} 
                readOnly
                className="w-full p-2 border rounded mb-2"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(inviteLink);
                  alert('Link copied to clipboard!');
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Copy
              </button>
            </div>
          )}
          
          <form onSubmit={handleInviteSubmit}>
            <div className="mb-4">
              <label htmlFor="inviteEmail" className="block text-sm font-medium mb-1">
                Issuer Email
              </label>
              <input
                type="email"
                id="inviteEmail"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Create Invitation
            </button>
          </form>
        </div>
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <h2 className="text-xl font-semibold p-6 border-b">User Management</h2>
          
          {isLoading ? (
            <div className="p-6 text-center">Loading users...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">{user.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.role === 'admin' 
                            ? 'bg-purple-100 text-purple-800' 
                            : user.role === 'issuer' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-green-100 text-green-800'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {new Date(user.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                        No users found
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