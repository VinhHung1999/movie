'use client';

import { useEffect, useRef } from 'react';

interface DeleteDialogProps {
  isOpen: boolean;
  title: string;
  onCancel: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

export default function DeleteDialog({ isOpen, title, onCancel, onConfirm, isDeleting }: DeleteDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) cancelRef.current?.focus();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" role="alertdialog" aria-modal="true">
      <div className="mx-4 w-full max-w-md rounded-lg border border-netflix-border bg-netflix-dark p-6 shadow-xl">
        <h2 className="mb-2 text-lg font-bold text-white">Delete &quot;{title}&quot;?</h2>
        <p className="mb-6 text-sm text-netflix-light-gray">
          This will permanently delete this content and all associated data (genres, cast, seasons, episodes, watch history, ratings).
        </p>
        <div className="flex justify-end gap-3">
          <button
            ref={cancelRef}
            onClick={onCancel}
            disabled={isDeleting}
            className="rounded-md border border-netflix-border px-4 py-2 text-sm text-netflix-white transition-colors hover:bg-netflix-gray"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
