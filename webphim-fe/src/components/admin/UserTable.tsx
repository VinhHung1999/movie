'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Search } from 'lucide-react';
import { AdminUserItem, PaginationMeta } from '@/types';

export default function UserTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const params = new URLSearchParams({ page: String(page), limit: '20' });
  if (search) params.set('search', search);

  const { data, isLoading } = useSWR<{ success: true; data: AdminUserItem[]; meta: PaginationMeta }>(
    `/admin/users?${params.toString()}`,
  );

  const items = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-white">Users</h1>

      {/* Search */}
      <div className="mb-4">
        <div className="relative max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-netflix-mid-gray" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name or email..."
            className="w-full rounded-md border border-netflix-border bg-netflix-gray pl-9 pr-4 py-2 text-sm text-netflix-white placeholder:text-netflix-mid-gray focus:border-netflix-light-gray focus:outline-none"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-netflix-border">
        <table className="min-w-[700px] w-full text-left text-sm">
          <thead>
            <tr className="border-b border-netflix-border bg-netflix-dark">
              <th scope="col" className="px-4 py-3 font-medium text-netflix-light-gray">Name</th>
              <th scope="col" className="px-4 py-3 font-medium text-netflix-light-gray">Email</th>
              <th scope="col" className="hidden px-4 py-3 font-medium text-netflix-light-gray sm:table-cell">Role</th>
              <th scope="col" className="hidden px-4 py-3 font-medium text-netflix-light-gray md:table-cell">Profiles</th>
              <th scope="col" className="hidden px-4 py-3 font-medium text-netflix-light-gray md:table-cell">Joined</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-netflix-mid-gray">Loading...</td></tr>
            )}
            {!isLoading && items.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-netflix-mid-gray">No users found.</td></tr>
            )}
            {items.map((user) => (
              <tr key={user.id} className="border-b border-netflix-border last:border-0 hover:bg-netflix-dark/50">
                <td className="px-4 py-3 font-medium text-white">{user.name}</td>
                <td className="px-4 py-3 text-netflix-light-gray">{user.email}</td>
                <td className="hidden px-4 py-3 sm:table-cell">
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-medium ${user.role === 'ADMIN' ? 'bg-red-900/40 text-red-400' : 'bg-gray-700/40 text-gray-400'}`}
                    aria-label={`Role: ${user.role}`}
                  >
                    {user.role}
                  </span>
                </td>
                <td className="hidden px-4 py-3 text-netflix-light-gray md:table-cell">{user.profileCount}</td>
                <td className="hidden px-4 py-3 text-netflix-light-gray md:table-cell">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-netflix-light-gray">
          <span>Page {meta.page} of {meta.totalPages} ({meta.total} users)</span>
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
    </div>
  );
}
