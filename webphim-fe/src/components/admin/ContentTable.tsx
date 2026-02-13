'use client';

import { useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { Pencil, Trash2, Plus, Search } from 'lucide-react';
import { AdminContentItem, PaginationMeta } from '@/types';
import DeleteDialog from './DeleteDialog';
import api from '@/lib/api';

export default function ContentTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [deleteTarget, setDeleteTarget] = useState<AdminContentItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const params = new URLSearchParams({ page: String(page), limit: '20' });
  if (search) params.set('search', search);
  if (typeFilter) params.set('type', typeFilter);

  const { data, isLoading, mutate } = useSWR<{ success: true; data: AdminContentItem[]; meta: PaginationMeta }>(
    `/admin/content?${params.toString()}`,
  );

  const items = data?.data ?? [];
  const meta = data?.meta;

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/content/${deleteTarget.id}`);
      mutate();
    } catch {
      // Error handled silently, table will refresh
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-white">Content</h1>
        <Link
          href="/admin/content/new"
          className="inline-flex items-center gap-2 rounded-md bg-netflix-red px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-netflix-red-hover"
        >
          <Plus size={16} /> Add Content
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-netflix-mid-gray" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by title..."
            className="w-full rounded-md border border-netflix-border bg-netflix-gray pl-9 pr-4 py-2 text-sm text-netflix-white placeholder:text-netflix-mid-gray focus:border-netflix-light-gray focus:outline-none"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          className="rounded-md border border-netflix-border bg-netflix-gray px-3 py-2 text-sm text-netflix-white focus:border-netflix-light-gray focus:outline-none"
        >
          <option value="">All Types</option>
          <option value="MOVIE">Movies</option>
          <option value="SERIES">Series</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-netflix-border">
        <table className="min-w-[700px] w-full text-left text-sm">
          <thead>
            <tr className="border-b border-netflix-border bg-netflix-dark">
              <th scope="col" className="px-4 py-3 font-medium text-netflix-light-gray">Title</th>
              <th scope="col" className="px-4 py-3 font-medium text-netflix-light-gray">Type</th>
              <th scope="col" className="hidden px-4 py-3 font-medium text-netflix-light-gray sm:table-cell">Year</th>
              <th scope="col" className="hidden px-4 py-3 font-medium text-netflix-light-gray md:table-cell">Rating</th>
              <th scope="col" className="hidden px-4 py-3 font-medium text-netflix-light-gray lg:table-cell">Views</th>
              <th scope="col" className="hidden px-4 py-3 font-medium text-netflix-light-gray md:table-cell">Video</th>
              <th scope="col" className="px-4 py-3 font-medium text-netflix-light-gray">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-netflix-mid-gray">Loading...</td></tr>
            )}
            {!isLoading && items.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-netflix-mid-gray">No content found.</td></tr>
            )}
            {items.map((item) => (
              <tr key={item.id} className="border-b border-netflix-border last:border-0 hover:bg-netflix-dark/50">
                <td className="max-w-[200px] truncate px-4 py-3 font-medium text-white">{item.title}</td>
                <td className="px-4 py-3">
                  <span className={`rounded px-2 py-0.5 text-xs font-medium ${item.type === 'MOVIE' ? 'bg-blue-900/40 text-blue-400' : 'bg-purple-900/40 text-purple-400'}`}>
                    {item.type}
                  </span>
                </td>
                <td className="hidden px-4 py-3 text-netflix-light-gray sm:table-cell">{item.releaseYear}</td>
                <td className="hidden px-4 py-3 text-netflix-light-gray md:table-cell">{item.maturityRating}</td>
                <td className="hidden px-4 py-3 text-netflix-light-gray lg:table-cell">{item.viewCount.toLocaleString()}</td>
                <td className="hidden px-4 py-3 md:table-cell">
                  {item.hasVideo ? (
                    <span className={`rounded px-2 py-0.5 text-xs ${item.videoStatus === 'COMPLETED' ? 'bg-green-900/40 text-green-400' : item.videoStatus === 'FAILED' ? 'bg-red-900/40 text-red-400' : 'bg-yellow-900/40 text-yellow-400'}`}>
                      {item.videoStatus}
                    </span>
                  ) : (
                    <span className="text-xs text-netflix-mid-gray">No video</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/content/${item.id}/edit`}
                      className="rounded p-1.5 text-netflix-light-gray transition-colors hover:bg-netflix-gray hover:text-white"
                      aria-label={`Edit ${item.title}`}
                    >
                      <Pencil size={15} />
                    </Link>
                    <button
                      onClick={() => setDeleteTarget(item)}
                      className="rounded p-1.5 text-netflix-light-gray transition-colors hover:bg-red-900/30 hover:text-red-400"
                      aria-label={`Delete ${item.title}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-netflix-light-gray">
          <span>Page {meta.page} of {meta.totalPages} ({meta.total} items)</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded border border-netflix-border px-3 py-1 transition-colors hover:bg-netflix-gray disabled:opacity-40"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= meta.totalPages}
              className="rounded border border-netflix-border px-3 py-1 transition-colors hover:bg-netflix-gray disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      <DeleteDialog
        isOpen={!!deleteTarget}
        title={deleteTarget?.title ?? ''}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        isDeleting={deleting}
      />
    </div>
  );
}
