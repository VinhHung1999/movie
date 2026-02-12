'use client';

import useSWR from 'swr';
import { BarChart3, Users, Film, Upload } from 'lucide-react';
import StatCard from '@/components/admin/StatCard';
import { AdminStats } from '@/types';

export default function AdminDashboardPage() {
  const { data, isLoading, error } = useSWR<{ success: true; data: AdminStats }>('/admin/stats');

  const stats = data?.data;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-white">Dashboard</h1>

      {error && (
        <p className="mb-4 text-sm text-red-500">Failed to load stats. Please try again.</p>
      )}

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-lg border border-netflix-border bg-netflix-dark" />
          ))}
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Users"
            value={stats.totalUsers}
            icon={Users}
            color="#3B82F6"
          />
          <StatCard
            label="Total Content"
            value={stats.totalContent}
            subtitle={`${stats.totalMovies} Movies, ${stats.totalSeries} Series`}
            icon={Film}
            color="#22C55E"
          />
          <StatCard
            label="Total Views"
            value={stats.totalViews.toLocaleString()}
            icon={BarChart3}
            color="#A855F7"
          />
          <StatCard
            label="Videos"
            value={stats.totalVideos}
            subtitle={`${stats.videosCompleted} Done, ${stats.videosProcessing} Processing, ${stats.videosFailed} Failed`}
            icon={Upload}
            color="#F97316"
          />
        </div>
      )}
    </div>
  );
}
