"use client";

import { Suspense } from 'react';
import RegisterForm from '@/components/RegisterForm';

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Suspense fallback={<div className="p-8 rounded-lg bg-white shadow-md">Loading registration form...</div>}>
        <RegisterForm />
      </Suspense>
    </div>
  );
} 