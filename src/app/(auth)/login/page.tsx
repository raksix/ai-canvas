'use client';

import { LoginForm } from '@/components/auth/AuthForms';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">AI Canvas</h1>
          <p className="text-slate-400 text-sm sm:text-base">AI-powered infinite canvas for notes and diagrams</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
