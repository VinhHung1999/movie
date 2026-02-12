// UPLOAD LEARN 2: Trang upload chính.
// Flow: Chọn file (LEARN 1) → Nhập metadata (title, desc) → Nhấn Upload → Gọi POST /api/videos/upload gửi file lên BE (xem LEARN 4).
'use client';

import { useState, useCallback } from 'react';
import { Upload } from 'lucide-react';
import useSWR from 'swr';
import UploadDropzone from '@/components/admin/UploadDropzone';
import UploadProgress from '@/components/admin/UploadProgress';
import TranscodeStatus from '@/components/admin/TranscodeStatus';
import { uploadVideo, triggerTranscode } from '@/lib/api';
import { VideoUploadResponse, AdminContentItem, PaginationMeta } from '@/types';

type UploadStage = 'select' | 'metadata' | 'uploading' | 'done';

export default function AdminUploadPage() {
  const [stage, setStage] = useState<UploadStage>('select');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [contentId, setContentId] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedVideo, setUploadedVideo] = useState<VideoUploadResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: contentListData } = useSWR<{ success: true; data: AdminContentItem[]; meta: PaginationMeta }>(
    '/admin/content?limit=100',
  );
  const contentOptions = contentListData?.data ?? [];

  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file);
    setStage('metadata');
    setError(null);
    // Pre-fill title from filename
    const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
    setTitle(nameWithoutExt);
  }, []);

  const handleClearFile = useCallback(() => {
    setSelectedFile(null);
    setStage('select');
    setTitle('');
    setDescription('');
    setContentId('');
    setError(null);
  }, []);

  const handleUpload = useCallback(async () => {
    if (!selectedFile || !title.trim()) return;

    setStage('uploading');
    setUploadProgress(0);
    setError(null);

    const formData = new FormData();
    formData.append('video', selectedFile);
    formData.append('title', title.trim());
    if (description.trim()) {
      formData.append('description', description.trim());
    }
    if (contentId.trim()) {
      formData.append('contentId', contentId.trim());
    }

    try {
      const res = await uploadVideo(formData, setUploadProgress);
      const video: VideoUploadResponse = res.data.data;
      setUploadedVideo(video);
      setStage('done');

      // Auto-trigger transcode
      await triggerTranscode(video.id);
    } catch (err: unknown) {
      setStage('metadata');
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        setError(axiosErr.response?.data?.message || 'Upload failed');
      } else {
        setError('Upload failed. Please try again.');
      }
    }
  }, [selectedFile, title, description, contentId]);

  const handleReset = useCallback(() => {
    setStage('select');
    setSelectedFile(null);
    setTitle('');
    setDescription('');
    setContentId('');
    setUploadProgress(0);
    setUploadedVideo(null);
    setError(null);
  }, []);

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <div className="mb-8 flex items-center gap-3">
        <Upload className="h-6 w-6 text-netflix-red" />
        <h1 className="text-2xl font-bold text-netflix-white">Upload Video</h1>
      </div>

      {/* Step 1: File Selection */}
      {(stage === 'select' || stage === 'metadata') && (
        <UploadDropzone
          onFileSelect={handleFileSelect}
          selectedFile={selectedFile}
          onClear={handleClearFile}
          disabled={stage !== 'select' && stage !== 'metadata'}
        />
      )}

      {/* Step 2: Metadata Form */}
      {stage === 'metadata' && selectedFile && (
        <div data-testid="metadata-form" className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="title"
              className="mb-1 block text-sm font-medium text-netflix-white"
            >
              Title <span className="text-netflix-red">*</span>
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              placeholder="Enter video title"
              className="w-full rounded-md border border-netflix-border bg-netflix-gray px-4 py-2.5 text-sm text-netflix-white placeholder:text-netflix-mid-gray focus:border-netflix-light-gray focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="mb-1 block text-sm font-medium text-netflix-white"
            >
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={2000}
              rows={3}
              placeholder="Enter video description (optional)"
              className="w-full resize-none rounded-md border border-netflix-border bg-netflix-gray px-4 py-2.5 text-sm text-netflix-white placeholder:text-netflix-mid-gray focus:border-netflix-light-gray focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="contentId"
              className="mb-1 block text-sm font-medium text-netflix-white"
            >
              Link to Content (optional)
            </label>
            <select
              id="contentId"
              value={contentId}
              onChange={(e) => setContentId(e.target.value)}
              className="w-full rounded-md border border-netflix-border bg-netflix-gray px-4 py-2.5 text-sm text-netflix-white focus:border-netflix-light-gray focus:outline-none"
            >
              <option value="">None (standalone upload)</option>
              {contentOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title} ({c.type}, {c.releaseYear})
                </option>
              ))}
            </select>
          </div>

          {error && (
            <p data-testid="upload-error" className="text-sm text-red-500">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={handleUpload}
            disabled={!title.trim()}
            className="w-full rounded-md bg-netflix-red px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-netflix-red-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            Upload Video
          </button>
        </div>
      )}

      {/* Step 3: Upload Progress */}
      {stage === 'uploading' && selectedFile && (
        <div className="mt-6">
          <UploadProgress
            fileName={selectedFile.name}
            fileSize={selectedFile.size}
            progress={uploadProgress}
            isComplete={false}
          />
        </div>
      )}

      {/* Step 4: Upload Complete */}
      {stage === 'done' && selectedFile && uploadedVideo && (
        <div className="mt-6 space-y-4">
          <UploadProgress
            fileName={selectedFile.name}
            fileSize={selectedFile.size}
            progress={100}
            isComplete={true}
          />

          <TranscodeStatus videoId={uploadedVideo.id} />

          <button
            type="button"
            onClick={handleReset}
            className="rounded-md border border-netflix-border px-6 py-2.5 text-sm font-medium text-netflix-white transition-colors hover:bg-netflix-gray"
          >
            Upload Another
          </button>
        </div>
      )}
    </main>
  );
}
