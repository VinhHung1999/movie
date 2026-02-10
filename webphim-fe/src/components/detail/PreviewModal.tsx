'use client';

import { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useSWR from 'swr';
import { ContentDetail } from '@/types';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import ModalContent from './ModalContent';

interface PreviewModalProps {
  contentId: string;
  isOpen: boolean;
  onClose: () => void;
}

function ModalSkeleton() {
  return (
    <div data-testid="modal-skeleton" className="mx-auto mt-8 max-w-3xl overflow-hidden rounded-lg bg-neutral-900">
      <div className="aspect-video w-full animate-pulse bg-neutral-800" />
      <div className="space-y-3 p-4">
        <div className="h-8 w-2/3 animate-pulse rounded bg-neutral-800" />
        <div className="h-4 w-full animate-pulse rounded bg-neutral-800" />
        <div className="h-4 w-3/4 animate-pulse rounded bg-neutral-800" />
      </div>
    </div>
  );
}

export default function PreviewModal({ contentId, isOpen, onClose }: PreviewModalProps) {
  useBodyScrollLock(isOpen);

  const { data, error } = useSWR<{ success: true; data: ContentDetail }>(
    isOpen && contentId ? `/content/${contentId}` : null
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  const content = data?.data;

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            data-testid="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal container */}
          <motion.div
            key="modal"
            data-testid="preview-modal"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed inset-0 z-[101] flex items-start justify-center overflow-y-auto px-4 pb-8 pt-8"
            onClick={(e) => {
              if (e.target === e.currentTarget) onClose();
            }}
          >
            <div className="w-full max-w-3xl">
              {error ? (
                <div className="rounded-lg bg-neutral-900 p-8 text-center text-neutral-400">
                  Failed to load content
                </div>
              ) : !content ? (
                <ModalSkeleton />
              ) : (
                <ModalContent content={content} onClose={onClose} onPlay={onClose} />
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
