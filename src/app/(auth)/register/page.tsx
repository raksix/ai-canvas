'use client';

import { RegisterForm } from '@/components/auth/AuthForms';
import Link from 'next/link';

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">AI Canvas</h1>
          <p className="text-slate-400 text-sm sm:text-base">AI-powered infinite canvas for notes and diagrams</p>
        </div>
        <RegisterForm />
        <p className="text-center mt-4 text-slate-400 text-sm">
          Already have an account?{' '}
          <Link href="/login" className="text-white hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
