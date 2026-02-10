'use client';

import { SWRConfig } from 'swr';
import api from '@/lib/api';

const swrFetcher = (url: string) => api.get(url).then((res) => res.data);

export function SWRProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        fetcher: swrFetcher,
        revalidateOnFocus: false,
        dedupingInterval: 5000,
        errorRetryCount: 2,
      }}
    >
      {children}
    </SWRConfig>
  );
}
