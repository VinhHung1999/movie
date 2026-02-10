/*
  Warnings:

  - You are about to drop the column `search_vector` on the `content` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "VideoStatus" AS ENUM ('UPLOADING', 'UPLOADED', 'QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED');

-- DropIndex
DROP INDEX "idx_content_search";

-- AlterTable
ALTER TABLE "content" DROP COLUMN "search_vector";

-- CreateTable
CREATE TABLE "videos" (
    "id" TEXT NOT NULL,
    "content_id" TEXT,
    "original_name" TEXT NOT NULL,
    "original_path" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "file_size" BIGINT NOT NULL,
    "duration" DOUBLE PRECISION,
    "status" "VideoStatus" NOT NULL DEFAULT 'UPLOADING',
    "hls_path" TEXT,
    "thumbnail_paths" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "error_message" TEXT,
    "transcode_job_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "videos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "videos_content_id_idx" ON "videos"("content_id");

-- CreateIndex
CREATE INDEX "videos_status_idx" ON "videos"("status");

-- AddForeignKey
ALTER TABLE "videos" ADD CONSTRAINT "videos_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "content"("id") ON DELETE SET NULL ON UPDATE CASCADE;
