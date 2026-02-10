'use client';

import { useState, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { AuthData, ApiErrorResponse } from '@/types';
import { AxiosError } from 'axios';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth, isLoading, error, setLoading, setError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!email) {
      errors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address.';
    }
    if (!password) {
      errors.password = 'Password is required.';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters.';
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!validate()) return;

    setLoading(true);
    try {
      const { data } = await api.post<{ success: true; data: AuthData }>('/auth/login', {
        email,
        password,
      });
      setAuth(data.data.user, data.data.accessToken);
      const callbackUrl = searchParams.get('callbackUrl') || '/profiles';
      router.push(callbackUrl);
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      setError(axiosError.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      {/* Rich background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#0d0d2b] to-[#1a0a0a]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(229,9,20,0.08)_0%,transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(59,130,246,0.06)_0%,transparent_50%)]" />
      </div>

      {/* Logo */}
      <div className="absolute top-0 left-0 z-20 p-6 md:p-8">
        <Link href="/" className="text-2xl font-bold tracking-wider text-netflix-red md:text-3xl">
          WEBPHIM
        </Link>
      </div>

      {/* Login Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md rounded-md bg-black/70 px-8 py-12 shadow-2xl backdrop-blur-sm sm:px-14 sm:py-14"
      >
        <h1 className="mb-8 text-3xl font-bold text-white">Sign In</h1>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 rounded bg-orange-500/15 px-4 py-3 text-sm text-orange-400"
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setValidationErrors((prev) => ({ ...prev, email: '' }));
              }}
              placeholder="Email address"
              className="w-full rounded bg-netflix-gray/50 px-5 py-4 text-white placeholder-netflix-light-gray outline-none ring-1 ring-white/10 transition-all duration-200 focus:bg-netflix-gray/60 focus:ring-white/30"
            />
            {validationErrors.email && (
              <p className="mt-1.5 text-sm text-orange-500">{validationErrors.email}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setValidationErrors((prev) => ({ ...prev, password: '' }));
              }}
              placeholder="Password"
              className="w-full rounded bg-netflix-gray/50 px-5 py-4 text-white placeholder-netflix-light-gray outline-none ring-1 ring-white/10 transition-all duration-200 focus:bg-netflix-gray/60 focus:ring-white/30"
            />
            {validationErrors.password && (
              <p className="mt-1.5 text-sm text-orange-500">{validationErrors.password}</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 w-full cursor-pointer rounded bg-netflix-red py-3.5 text-lg font-semibold text-white transition-all duration-200 hover:bg-netflix-red-hover hover:shadow-[0_4px_20px_rgba(229,9,20,0.35)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-12 text-netflix-light-gray">
          <span>New to WebPhim? </span>
          <Link href="/signup" className="font-medium text-white transition-colors hover:underline">
            Sign up now
          </Link>
          .
        </div>
      </motion.div>
    </div>
  );
}
