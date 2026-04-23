import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpRequest, HttpEvent, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ApiResponse,
  SocialAccount,
  MediaFile,
  PublishLog,
  ScheduledPublish,
  Platform,
  Frequency,
  PageResponse,
} from '../models/models';
import { environment } from '../../../environments/environment';

const API = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class AccountService {
  constructor(private http: HttpClient) {}

  getAccounts(): Observable<ApiResponse<SocialAccount[]>> {
    return this.http.get<ApiResponse<SocialAccount[]>>(`${API}/accounts`);
  }

  linkAccount(
    platform: Platform,
    accountId: string,
    accessToken: string,
    tokenSecret?: string,
  ): Observable<ApiResponse<SocialAccount>> {
    return this.http.post<ApiResponse<SocialAccount>>(`${API}/accounts`, {
      platform,
      accountId,
      accessToken,
      tokenSecret,
    });
  }

  unlinkAccount(accountId: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${API}/accounts/${accountId}`);
  }

  getOAuthUrl(platform: Platform): Observable<ApiResponse<{ authorizationUrl: string }>> {
    const redirectUri = `${window.location.origin}/oauth/callback`;
    return this.http.get<ApiResponse<{ authorizationUrl: string }>>(
      `${API}/oauth/${platform}/authorize`,
      { params: { redirectUri } },
    );
  }
}

interface InitiateUploadResponse {
  uploadUrl: string;
  s3Key: string;
}

@Injectable({ providedIn: 'root' })
export class FileService {
  constructor(private http: HttpClient) {}

  initiateUpload(filename: string, contentType: string, sizeBytes: number): Observable<ApiResponse<InitiateUploadResponse>> {
    return this.http.post<ApiResponse<InitiateUploadResponse>>(`${API}/files/initiate`, { filename, contentType, sizeBytes });
  }

  uploadToS3(uploadUrl: string, file: File): Observable<HttpEvent<void>> {
    const req = new HttpRequest<File>('PUT', uploadUrl, file, {
      headers: new HttpHeaders({ 'Content-Type': file.type }),
      reportProgress: true,
    });
    return this.http.request<void>(req);
  }

  confirmUpload(s3Key: string, originalName: string, contentType: string, sizeBytes: number): Observable<ApiResponse<MediaFile>> {
    return this.http.post<ApiResponse<MediaFile>>(`${API}/files/confirm`, { s3Key, originalName, contentType, sizeBytes });
  }

  getFiles(page = 0, size = 10): Observable<ApiResponse<PageResponse<MediaFile>>> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('sort', 'createdAt,desc');
    return this.http.get<ApiResponse<PageResponse<MediaFile>>>(`${API}/files`, { params });
  }

  getFile(fileId: string): Observable<ApiResponse<MediaFile>> {
    return this.http.get<ApiResponse<MediaFile>>(`${API}/files/${fileId}`);
  }

  deleteFile(fileId: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${API}/files/${fileId}`);
  }
}

@Injectable({ providedIn: 'root' })
export class PublishService {
  constructor(private http: HttpClient) {}

  publish(
    mediaFileId: string,
    socialAccountId: string,
    title: string,
    description?: string,
  ): Observable<ApiResponse<PublishLog>> {
    return this.http.post<ApiResponse<PublishLog>>(`${API}/publish`, {
      mediaFileId,
      socialAccountId,
      title,
      description,
    });
  }

  getLogs(page = 0, size = 10): Observable<ApiResponse<PageResponse<PublishLog>>> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('sort', 'createdAt,desc');
    return this.http.get<ApiResponse<PageResponse<PublishLog>>>(`${API}/publish`, { params });
  }

  removePost(logId: string): Observable<ApiResponse<PublishLog>> {
    return this.http.delete<ApiResponse<PublishLog>>(`${API}/publish/${logId}`);
  }
}

@Injectable({ providedIn: 'root' })
export class SchedulerService {
  constructor(private http: HttpClient) {}

  getSchedules(): Observable<ApiResponse<ScheduledPublish[]>> {
    return this.http.get<ApiResponse<ScheduledPublish[]>>(`${API}/schedules`);
  }

  createSchedule(
    mediaFileId: string,
    socialAccountId: string,
    title: string,
    frequency: Frequency,
    description?: string,
  ): Observable<ApiResponse<ScheduledPublish>> {
    return this.http.post<ApiResponse<ScheduledPublish>>(`${API}/schedules`, {
      mediaFileId,
      socialAccountId,
      title,
      frequency,
      description,
    });
  }

  cancelSchedule(jobId: string): Observable<ApiResponse<ScheduledPublish>> {
    return this.http.delete<ApiResponse<ScheduledPublish>>(`${API}/schedules/${jobId}`);
  }
}
