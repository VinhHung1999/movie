'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, ChevronDown } from 'lucide-react';
import SearchBar from '@/components/search/SearchBar';
import { clsx } from 'clsx';
import { useScrollPosition } from '@/hooks/useScrollPosition';
import { useAuthStore } from '@/store/auth.store';
import { useProfileStore } from '@/store/profile.store';
import api from '@/lib/api';
import MobileDrawer from './MobileDrawer';

const navLinks = [
  { href: '/home', label: 'Home' },
  { href: '/browse/series', label: 'Series' },
  { href: '/browse/movies', label: 'Movies' },
  { href: '/browse/my-list', label: 'My List' },
];

export default function AuthNavbar() {
  const isScrolled = useScrollPosition(50);
  const [profileOpen, setProfileOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();
  const activeProfile = useProfileStore((s) => s.activeProfile);
  const clearProfile = useProfileStore((s) => s.clearProfile);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Proceed with local logout even if API fails
    }
    clearAuth();
    clearProfile();
    router.push('/');
  };

  return (
    <>
      <nav
        className={clsx(
          'fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 transition-colors duration-300 md:px-12',
          isScrolled ? 'bg-netflix-black' : 'bg-gradient-to-b from-black/80 to-transparent',
        )}
      >
        {/* Left: Logo + Nav links */}
        <div className="flex items-center gap-8">
          <Link href="/home" className="text-xl font-bold text-netflix-red md:text-2xl">
            WEBPHIM
          </Link>
          <ul className="hidden items-center gap-5 md:flex">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-netflix-white transition-colors hover:text-white"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Right: Search, Bell, Profile, Hamburger */}
        <div className="flex items-center gap-4">
          <SearchBar />
          <button className="hidden text-netflix-white transition-colors hover:text-white sm:block" aria-label="Notifications">
            <Bell size={20} />
          </button>

          {/* Profile dropdown */}
          <div className="relative hidden md:block" ref={dropdownRef}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-1 text-sm text-netflix-white transition-colors hover:text-white"
            >
              <div
                className="flex h-8 w-8 items-center justify-center rounded text-sm font-bold text-white"
                style={{ backgroundColor: activeProfile?.avatarUrl?.startsWith('#') ? activeProfile.avatarUrl : '#E50914' }}
                data-testid="navbar-profile-icon"
              >
                {(activeProfile?.name ?? user?.name ?? 'U').charAt(0).toUpperCase()}
              </div>
              <ChevronDown
                size={16}
                className={clsx('transition-transform', profileOpen && 'rotate-180')}
              />
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 rounded border border-netflix-border bg-netflix-black/95 py-2 shadow-lg">
                <div className="border-b border-netflix-border px-4 py-2">
                  <p className="text-sm font-medium text-white">{activeProfile?.name ?? user?.name ?? 'User'}</p>
                  <p className="text-xs text-netflix-mid-gray">{user?.email}</p>
                </div>
                <Link
                  href="/profiles"
                  className="block px-4 py-2 text-sm text-netflix-white hover:bg-netflix-gray hover:text-white"
                  onClick={() => setProfileOpen(false)}
                >
                  Switch Profiles
                </Link>
                <Link
                  href="/account"
                  className="block px-4 py-2 text-sm text-netflix-white hover:bg-netflix-gray hover:text-white"
                  onClick={() => setProfileOpen(false)}
                >
                  Account
                </Link>
                <button
                  onClick={handleSignOut}
                  className="w-full border-t border-netflix-border px-4 py-2 text-left text-sm text-netflix-white hover:bg-netflix-gray hover:text-white"
                >
                  Sign out of WebPhim
                </button>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex flex-col gap-1 md:hidden"
            aria-label="Open menu"
          >
            <span className="h-0.5 w-5 bg-netflix-white" />
            <span className="h-0.5 w-5 bg-netflix-white" />
            <span className="h-0.5 w-5 bg-netflix-white" />
          </button>
        </div>
      </nav>

      <MobileDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        navLinks={navLinks}
        user={user}
        activeProfile={activeProfile}
        onSignOut={handleSignOut}
      />
    </>
  );
}
