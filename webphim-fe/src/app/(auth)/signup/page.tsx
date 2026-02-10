'use client';

import { useState, FormEvent, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { AuthData, ApiErrorResponse } from '@/types';
import { AxiosError } from 'axios';

function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score, label: 'Weak', color: 'bg-red-500' };
  if (score <= 2) return { score, label: 'Fair', color: 'bg-orange-500' };
  if (score <= 3) return { score, label: 'Good', color: 'bg-yellow-500' };
  return { score, label: 'Strong', color: 'bg-green-500' };
}

export default function SignupPage() {
  const router = useRouter();
  const { setAuth, isLoading, error, setLoading, setError } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!name.trim()) {
      errors.name = 'Name is required.';
    } else if (name.trim().length < 2 || name.trim().length > 50) {
      errors.name = 'Name must be between 2 and 50 characters.';
    }
    if (!email) {
      errors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address.';
    }
    if (!password) {
      errors.password = 'Password is required.';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters.';
    } else if (!/[A-Z]/.test(password)) {
      errors.password = 'Password must contain at least 1 uppercase letter.';
    } else if (!/[a-z]/.test(password)) {
      errors.password = 'Password must contain at least 1 lowercase letter.';
    } else if (!/[0-9]/.test(password)) {
      errors.password = 'Password must contain at least 1 number.';
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
      const { data } = await api.post<{ success: true; data: AuthData }>('/auth/register', {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password,
      });
      setAuth(data.data.user, data.data.accessToken);
      router.push('/profiles');
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      setError(axiosError.response?.data?.message || 'Signup failed. Please try again.');
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

      {/* Signup Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md rounded-md bg-black/70 px-8 py-12 shadow-2xl backdrop-blur-sm sm:px-14 sm:py-14"
      >
        <h1 className="mb-8 text-3xl font-bold text-white">Sign Up</h1>

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
          {/* Name */}
          <div>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setValidationErrors((prev) => ({ ...prev, name: '' }));
              }}
              placeholder="Name"
              className="w-full rounded bg-netflix-gray/50 px-5 py-4 text-white placeholder-netflix-light-gray outline-none ring-1 ring-white/10 transition-all duration-200 focus:bg-netflix-gray/60 focus:ring-white/30"
            />
            {validationErrors.name && (
              <p className="mt-1.5 text-sm text-orange-500">{validationErrors.name}</p>
            )}
          </div>

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

            {/* Password Strength Indicator */}
            {password && (
              <div className="mt-3">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div
                      key={level}
                      className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                        level <= passwordStrength.score ? passwordStrength.color : 'bg-white/10'
                      }`}
                    />
                  ))}
                </div>
                <p className="mt-1.5 text-xs text-netflix-mid-gray">
                  Password strength: <span className="text-netflix-light-gray">{passwordStrength.label}</span>
                </p>
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 w-full cursor-pointer rounded bg-netflix-red py-3.5 text-lg font-semibold text-white transition-all duration-200 hover:bg-netflix-red-hover hover:shadow-[0_4px_20px_rgba(229,9,20,0.35)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-12 text-netflix-light-gray">
          <span>Already have an account? </span>
          <Link href="/login" className="font-medium text-white transition-colors hover:underline">
            Sign in
          </Link>
          .
        </div>
      </motion.div>
    </div>
  );
}
