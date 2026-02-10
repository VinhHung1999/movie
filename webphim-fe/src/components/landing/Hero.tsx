'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

export default function Hero() {
  const [email, setEmail] = useState('');
  const router = useRouter();

  const handleGetStarted = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/signup${email ? `?email=${encodeURIComponent(email)}` : ''}`);
  };

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
      {/* Layered cinematic background */}
      <div className="absolute inset-0">
        {/* Base: deep dark gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#0d0d2b] to-[#1a0a0a]" />

        {/* Subtle radial glow behind content */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(229,9,20,0.15)_0%,transparent_70%)]" />

        {/* Film grain texture overlay */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Vignette effect */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.6)_100%)]" />
      </div>

      {/* Top fade for navbar blending */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/80 to-transparent" />

      {/* Bottom fade to next section */}
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-netflix-black to-transparent" />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
        <motion.h1
          className="mb-5 text-4xl font-extrabold tracking-tight text-white md:text-5xl lg:text-7xl"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          Unlimited movies, TV shows, and more
        </motion.h1>

        <motion.p
          className="mb-3 text-xl font-medium text-white/90 md:text-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.15 }}
        >
          Watch anywhere. Cancel anytime.
        </motion.p>

        <motion.p
          className="mb-6 text-base text-netflix-light-gray md:text-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
        >
          Ready to watch? Enter your email to create or restart your membership.
        </motion.p>

        <motion.form
          onSubmit={handleGetStarted}
          className="mx-auto flex max-w-xl flex-col gap-3 sm:flex-row"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.45 }}
        >
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 rounded-sm border border-white/20 bg-black/50 px-5 py-3.5 text-base text-white placeholder-netflix-mid-gray backdrop-blur-sm outline-none transition-all duration-200 focus:border-white/50 focus:bg-black/60 focus:shadow-[0_0_0_1px_rgba(255,255,255,0.2)]"
          />
          <button
            type="submit"
            className="flex cursor-pointer items-center justify-center gap-1.5 rounded-sm bg-netflix-red px-8 py-3.5 text-xl font-semibold text-white transition-all duration-200 hover:bg-netflix-red-hover hover:shadow-[0_4px_20px_rgba(229,9,20,0.4)]"
          >
            Get Started
            <ChevronRight size={24} strokeWidth={2.5} />
          </button>
        </motion.form>
      </div>
    </section>
  );
}
