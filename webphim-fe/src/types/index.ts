export interface UserResponse {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  createdAt: string;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Array<{ field: string; message: string }>;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface AuthData {
  user: UserResponse;
  accessToken: string;
}

// ============================================
// Content Types (matching Sprint 4 API responses)
// ============================================

export type ContentType = 'MOVIE' | 'SERIES';
export type MaturityRating = 'G' | 'PG' | 'PG13' | 'R' | 'NC17';

export interface Genre {
  id: string;
  name: string;
  slug: string;
}

export interface GenreWithCount extends Genre {
  contentCount: number;
}

export interface ContentSummary {
  id: string;
  type: ContentType;
  title: string;
  description: string;
  releaseYear: number;
  maturityRating: MaturityRating;
  duration: number | null;
  thumbnailUrl: string | null;
  bannerUrl: string | null;
  viewCount: number;
  genres: Genre[];
}

export interface CastMember {
  id: string;
  name: string;
  role: 'ACTOR' | 'DIRECTOR' | 'WRITER';
  character: string | null;
  photoUrl: string | null;
}

export interface EpisodeSummary {
  id: string;
  episodeNumber: number;
  title: string;
  description: string | null;
  duration: number;
  thumbnailUrl: string | null;
}

export interface SeasonDetail {
  id: string;
  seasonNumber: number;
  title: string | null;
  episodes: EpisodeSummary[];
}

export interface ContentDetail extends ContentSummary {
  trailerUrl: string | null;
  cast: CastMember[];
  seasons?: SeasonDetail[];
}

export interface FeaturedContent {
  id: string;
  type: ContentType;
  title: string;
  description: string;
  releaseYear: number;
  maturityRating: MaturityRating;
  duration: number | null;
  bannerUrl: string | null;
  trailerUrl: string | null;
  genres: Genre[];
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ContentListResponse {
  success: true;
  data: ContentSummary[];
  meta: PaginationMeta;
}

export interface FeaturedResponse {
  success: true;
  data: FeaturedContent;
}

export interface GenreListResponse {
  success: true;
  data: GenreWithCount[];
}

// ============================================
// Video Types (Sprint 6 - Upload & Transcode)
// ============================================

export type VideoStatus =
  | 'UPLOADING'
  | 'UPLOADED'
  | 'QUEUED'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED';

// ============================================
// Similar Content Types (Sprint 8)
// ============================================

export interface SimilarContentResponse {
  success: true;
  data: ContentSummary[];
}

// ============================================
// Search Types (Sprint 9)
// ============================================

export interface SearchSuggestion {
  id: string;
  title: string;
  type: ContentType;
  thumbnailUrl: string | null;
  releaseYear: number;
}

export interface SearchSuggestionsResponse {
  success: true;
  data: SearchSuggestion[];
}

export interface SearchResultsResponse {
  success: true;
  data: ContentSummary[];
  meta: PaginationMeta & { query: string };
}

export interface SearchFilterState {
  type?: 'MOVIE' | 'SERIES';
  genre?: string;
  yearFrom?: number;
  yearTo?: number;
  sort: 'relevance' | 'newest' | 'oldest' | 'views' | 'title';
}

// ============================================
// Watchlist Types (Sprint 10)
// ============================================

export interface WatchlistItem {
  contentId: string;
  addedAt: string;
  content: ContentSummary;
}

export interface WatchlistResponse {
  success: true;
  data: WatchlistItem[];
  meta: PaginationMeta;
}

// ============================================
// Rating Types (Sprint 10)
// ============================================

export interface RatingData {
  contentId: string;
  score: number; // 1 = thumbs up, 2 = thumbs down
  updatedAt: string;
}

// ============================================
// Profile Types (Sprint 10)
// ============================================

export interface Profile {
  id: string;
  name: string;
  avatarUrl: string | null;
  isKids: boolean;
  createdAt: string;
}

// ============================================
// Continue Watching Types (Sprint 10)
// ============================================

export interface ContinueWatchingItem {
  id: string;
  contentId: string;
  episodeId: string | null;
  progress: number;
  duration: number;
  progressPercent: number;
  updatedAt: string;
  content: {
    id: string;
    title: string;
    type: ContentType;
    thumbnailUrl: string | null;
    maturityRating: MaturityRating;
  };
}

export interface VideoUploadResponse {
  id: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  status: VideoStatus;
  contentId: string | null;
  createdAt: string;
}

export interface TranscodeQueueResponse {
  videoId: string;
  jobId: string;
  status: 'QUEUED';
}

export interface VideoStatusResponse {
  id: string;
  status: VideoStatus;
  originalName: string;
  fileSize: number;
  duration: number | null;
  hlsPath: string | null;
  thumbnailPaths: string[];
  errorMessage: string | null;
  progress: number | null;
  createdAt: string;
  updatedAt: string;
}
