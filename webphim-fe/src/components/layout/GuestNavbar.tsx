'use client';

import Link from 'next/link';

export default function GuestNavbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-4 md:px-12">
      <Link href="/" className="text-2xl font-bold text-netflix-red md:text-3xl">
        WEBPHIM
      </Link>
      <Link
        href="/login"
        className="rounded bg-netflix-red px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-netflix-red-hover"
      >
        Sign In
      </Link>
    </nav>
  );
}
