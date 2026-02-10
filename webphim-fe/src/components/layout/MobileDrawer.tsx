'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { type UserResponse } from '@/types';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  navLinks: Array<{ href: string; label: string }>;
  user: UserResponse | null;
  onSignOut: () => void;
}

export default function MobileDrawer({ isOpen, onClose, navLinks, user, onSignOut }: MobileDrawerProps) {
  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            className="fixed top-0 right-0 z-50 h-full w-72 bg-netflix-black/95 shadow-lg"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3, ease: 'easeInOut' }}
          >
            {/* Close button */}
            <div className="flex justify-end p-4">
              <button onClick={onClose} className="text-netflix-white hover:text-white" aria-label="Close menu">
                <X size={24} />
              </button>
            </div>

            {/* Profile section */}
            {user && (
              <div className="border-b border-netflix-border px-6 pb-4">
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded bg-netflix-red text-lg font-bold text-white">
                  {user.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <p className="text-sm font-medium text-white">{user.name}</p>
                <p className="text-xs text-netflix-mid-gray">{user.email}</p>
              </div>
            )}

            {/* Nav links */}
            <ul className="space-y-1 px-4 py-4">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={onClose}
                    className="block rounded px-3 py-3 text-base text-netflix-white transition-colors hover:bg-netflix-gray hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/account"
                  onClick={onClose}
                  className="block rounded px-3 py-3 text-base text-netflix-white transition-colors hover:bg-netflix-gray hover:text-white"
                >
                  Account
                </Link>
              </li>
            </ul>

            {/* Sign out */}
            <div className="mt-auto border-t border-netflix-border px-4 py-4">
              <button
                onClick={() => { onSignOut(); onClose(); }}
                className="w-full rounded px-3 py-3 text-left text-base text-netflix-white transition-colors hover:bg-netflix-gray hover:text-white"
              >
                Sign out of WebPhim
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
