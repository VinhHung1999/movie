// UPLOAD LEARN 17: Watch Page - cinema mode, KHÔNG có navbar/footer.
// Nằm NGOÀI (main) group để tránh MainLayout. Tự handle auth.
// Fetch content + video data, render VideoPlayer với PlayerControls + KeyboardShortcuts.
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { SWRProvider } from '@/lib/swr-config';
import VideoPlayer from '@/components/player/VideoPlayer';
import PlayerControls from '@/components/player/PlayerControls';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useWatchProgress } from '@/hooks/useWatchProgress';
import { Loader2 } from 'lucide-react';
import type { ContentDetail, VideoStatusResponse, UserResponse } from '@/types';

function WatchPageContent() {
  const params = useParams();
  const router = useRouter();
  const contentId = params.id as string;

  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
  const serverBase = apiBase.replace(/\/api$/, '');

  // Fetch content details
  const { data: contentData, error: contentError } = useSWR<{
    success: true;
    data: ContentDetail;
  }>(`/content/${contentId}`);

  // Fetch videos list for this content → find COMPLETED video ID
  const { data: videoListData, error: videoListError } = useSWR<{
    success: true;
    data: { videos: { id: string; status: string }[] };
  }>(`/videos?contentId=${contentId}`);

  const completedVideoId = videoListData?.data?.videos?.find(
    (v) => v.status === 'COMPLETED'
  )?.id;

  // Fetch full video status (has hlsPath, thumbnailPaths) only when we have a completed video
  const { data: videoStatus, error: videoError } = useSWR<{
    success: true;
    data: VideoStatusResponse;
  }>(completedVideoId ? `/videos/${completedVideoId}/status` : null);

  // Fetch saved watch progress to resume playback
  const { data: progressData } = useSWR<{
    success: true;
    data: { progress: number; duration: number } | null;
  }>(`/watch-history/${contentId}`);

  const content = contentData?.data;
  const video = videoStatus?.data;
  const streamUrl = video?.hlsPath ? `${serverBase}/uploads/${video.hlsPath}` : null;
  const thumbnailUrl = video?.thumbnailPaths?.[0]
    ? `${serverBase}/uploads/${video.thumbnailPaths[0]}`
    : content?.thumbnailUrl || undefined;
  const initialProgress = progressData?.data?.progress;

  const handleBack = () => {
    router.back();
  };

  if (contentError || videoListError || videoError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="text-center">
          <p className="text-lg text-white">Failed to load video</p>
          <button
            type="button"
            onClick={() => router.push('/home')}
            className="mt-4 rounded bg-netflix-red px-6 py-2 text-white"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (!content || !streamUrl) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <Loader2 className="h-10 w-10 animate-spin text-netflix-red" />
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-black">
      <VideoPlayer
        key={contentId}
        streamUrl={streamUrl}
        title={content.title}
        contentId={contentId}
        initialProgress={initialProgress}
        thumbnailUrl={thumbnailUrl}
        onBack={handleBack}
      >
        {(player) => (
          <WatchControls player={player} title={content.title} contentId={contentId} onBack={handleBack} />
        )}
      </VideoPlayer>
    </div>
  );
}

function WatchControls({
  player,
  title,
  contentId,
  onBack,
}: {
  player: Parameters<NonNullable<React.ComponentProps<typeof VideoPlayer>['children']>>[0];
  title: string;
  contentId: string;
  onBack: () => void;
}) {
  // Keyboard shortcuts
  useKeyboardShortcuts({
    togglePlay: player.togglePlay,
    toggleFullscreen: player.toggleFullscreen,
    toggleMute: player.toggleMute,
    seek: player.seek,
    setVolume: player.setVolume,
    currentTime: player.currentTime,
    volume: player.volume,
    isFullscreen: player.isFullscreen,
  });

  // Save watch progress periodically
  useWatchProgress({
    contentId,
    currentTime: player.currentTime,
    duration: player.duration,
    isPlaying: player.isPlaying,
  });

  return <PlayerControls player={player} title={title} onBack={onBack} />;
}

export default function WatchPage() {
  const router = useRouter();
  const { isAuthenticated, setAuth, clearAuth } = useAuthStore();
  const [isRestoring, setIsRestoring] = useState(!isAuthenticated);

  useEffect(() => {
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

  if (isRestoring) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <Loader2 className="h-10 w-10 animate-spin text-netflix-red" />
      </div>
    );
  }

  return (
    <SWRProvider>
      <WatchPageContent />
    </SWRProvider>
  );
}
