export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  timestamp: string;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface User {
  id: string;
  username: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  userId: string;
  username: string;
}

export type Platform = 'TWITTER' | 'YOUTUBE' | 'INSTAGRAM' | 'TIKTOK';
export type MediaType = 'IMAGE' | 'VIDEO' | 'AUDIO';
export type FileStatus = 'ACTIVE' | 'INACTIVE';
export type PublishStatus = 'PENDING' | 'PUBLISHED' | 'FAILED' | 'REMOVED';
export type Frequency = 'DAILY' | 'WEEKLY';

export interface SocialAccount {
  id: string;
  platform: Platform;
  accountId: string;
  active: boolean;
  createdAt: string;
}

export interface MediaFile {
  id: string;
  originalName: string;
  mediaType: MediaType;
  sizeBytes: number;
  status: FileStatus;
  presignedUrl?: string;
  createdAt: string;
}

export interface PublishLog {
  id: string;
  platform: Platform;
  mediaFileId: string;
  socialAccountId: string;
  externalPostId?: string;
  title: string;
  status: PublishStatus;
  errorMessage?: string;
  publishedAt?: string;
  removedAt?: string;
  createdAt: string;
}

export interface ScheduledPublish {
  id: string;
  mediaFileId: string;
  socialAccountId: string;
  title: string;
  frequency: Frequency;
  active: boolean;
  createdAt: string;
}
