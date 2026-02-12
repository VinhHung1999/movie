'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { LayoutDashboard, Film, Upload, Users } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuthStore } from '@/store/auth.store';

const ADMIN_NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/content', label: 'Content', icon: Film },
  { href: '/admin/upload', label: 'Upload', icon: Upload },
  { href: '/admin/users', label: 'Users', icon: Users },
];

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      router.push('/home');
    }
  }, [user, router]);

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-netflix-mid-gray">Checking permissions...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <aside className="hidden w-56 flex-shrink-0 border-r border-netflix-border bg-netflix-black/50 md:block">
        <nav className="sticky top-20 space-y-1 px-3 py-6">
          {ADMIN_NAV.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors',
                  isActive
                    ? 'bg-netflix-red/10 font-medium text-netflix-red'
                    : 'text-netflix-light-gray hover:bg-netflix-gray hover:text-white',
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile nav */}
      <div className="flex gap-1 overflow-x-auto border-b border-netflix-border px-4 py-2 md:hidden">
        {ADMIN_NAV.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/admin' && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs transition-colors',
                isActive
                  ? 'bg-netflix-red text-white'
                  : 'bg-netflix-gray text-netflix-light-gray',
              )}
            >
              <item.icon size={14} />
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* Main content */}
      <main className="flex-1 px-4 py-6 md:px-8">{children}</main>
    </div>
  );
}
