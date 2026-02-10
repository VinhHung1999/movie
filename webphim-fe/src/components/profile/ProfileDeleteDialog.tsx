'use client';

import { useEffect, useRef } from 'react';

interface ProfileDeleteDialogProps {
  profileName: string;
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting?: boolean;
}

export default function ProfileDeleteDialog({
  profileName,
  isOpen,
  onConfirm,
  onCancel,
  isDeleting,
}: ProfileDeleteDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Focus trap: focus cancel button when dialog opens
  useEffect(() => {
    if (isOpen) {
      cancelRef.current?.focus();
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" data-testid="delete-dialog-backdrop">
      <div
        role="alertdialog"
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
        className="mx-4 w-full max-w-sm rounded-lg bg-netflix-dark p-6"
        data-testid="delete-dialog"
      >
        <h2 id="delete-dialog-title" className="mb-2 text-lg font-semibold text-white">
          Delete Profile
        </h2>
        <p id="delete-dialog-description" className="mb-6 text-sm text-netflix-mid-gray">
          Are you sure you want to delete the profile &quot;{profileName}&quot;? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button
            ref={cancelRef}
            onClick={onCancel}
            className="rounded border border-netflix-mid-gray px-4 py-2 text-sm text-netflix-mid-gray transition-colors hover:border-white hover:text-white"
            data-testid="delete-cancel-button"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="rounded bg-netflix-red px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
            data-testid="delete-confirm-button"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
