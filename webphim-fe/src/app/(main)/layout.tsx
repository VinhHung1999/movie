'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { useProfileStore } from '@/store/profile.store';
import { UserResponse } from '@/types';
import MainLayout from '@/components/layout/MainLayout';
import { SWRProvider } from '@/lib/swr-config';

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, setAuth, clearAuth } = useAuthStore();
  const activeProfile = useProfileStore((s) => s.activeProfile);
  const [isRestoring, setIsRestoring] = useState(!isAuthenticated);

  useEffect(() => {
    // Read latest store state directly to avoid stale closure
    const { isAuthenticated: authed, accessToken: token } = useAuthStore.getState();
    if (authed && token) {
      setIsRestoring(false);
      return;
    }

    const restoreSession = async () => {
      try {
        const refreshRes = await api.post('/auth/refresh');
        const newAccessToken = refreshRes.data.data.accessToken;

        const meRes = await api.get<{ success: true; data: { user: UserResponse } }>('/auth/me', {
          headers: { Authorization: `Bearer ${newAccessToken}` },
        });

        setAuth(meRes.data.data.user, newAccessToken);
      } catch {
        clearAuth();
        router.push('/login');
      } finally {
        setIsRestoring(false);
      }
    };

    restoreSession();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Redirect to profile selector if authenticated but no active profile
  const isProfilePage = pathname?.startsWith('/profiles');
  useEffect(() => {
    if (!isRestoring && isAuthenticated && !activeProfile && !isProfilePage) {
      router.push('/profiles');
    }
  }, [isRestoring, isAuthenticated, activeProfile, isProfilePage, router]);

  if (isRestoring) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-netflix-black">
        <div className="text-netflix-light-gray">Loading...</div>
      </div>
    );
  }

  return (
    <SWRProvider>
      <MainLayout>{children}</MainLayout>
    </SWRProvider>
  );
}
