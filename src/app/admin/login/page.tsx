'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        router.replace('/admin');
        router.refresh();
      } else {
        setError(json?.error ?? 'Login failed.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main
      className="min-h-screen flex items-center justify-center px-4"
      dir="rtl"
    >
      <div className="w-full max-w-sm">
        <div className="glass-card p-8">
          <div className="w-12 h-12 mx-auto mb-5 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
            <Lock size={20} className="text-blue-400" />
          </div>
          <h1 className="text-xl font-bold text-slate-100 text-center mb-1">
            Admin Dashboard
          </h1>
          <p className="text-sm text-slate-400 text-center mb-6">
            ghanbariomid.ir command center
          </p>
          <form onSubmit={onSubmit} className="space-y-4">
            <label htmlFor="password" className=" block text-sm text-slate-300">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              dir="ltr"
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoFocus
            />
            {error && (
              <p role="alert" className="text-xs text-red-400">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={submitting || password.length === 0}
              className="w-full btn-primary justify-center disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Sign in'
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}