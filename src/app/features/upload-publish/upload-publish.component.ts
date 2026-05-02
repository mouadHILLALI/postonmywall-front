import { Component, OnInit, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpEventType } from '@angular/common/http';
import { switchMap } from 'rxjs';
import { FileService, PublishService } from '../../core/services/api.service';
import { AppStateService } from '../../core/services/app-state.service';
import { MediaFile, SocialAccount } from '../../core/models/models';

interface AccountResult {
  account: SocialAccount;
  status: 'publishing' | 'success' | 'failed';
  error?: string;
}

@Component({
  selector: 'app-upload-publish',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './upload-publish.component.html',
  styleUrl: './upload-publish.component.scss',
})
export class UploadPublishComponent implements OnInit {
  publishForm: FormGroup;

  selectedFile = signal<File | null>(null);
  selectedMediaFile = signal<MediaFile | null>(null);
  localPreviewUrl = signal<string | null>(null);

  uploading = signal(false);
  uploadProgress = signal<number | null>(null);
  publishing = signal(false);
  uploadError = signal('');
  uploadSuccess = signal(false);

  selectedAccountIds = signal<Set<string>>(new Set());
  publishResults = signal<AccountResult[]>([]);

  get files() { return this.state.files; }
  get loadingFiles() { return this.state.filesLoading; }
  get accounts() { return this.state.accounts; }

  constructor(
    private fb: FormBuilder,
    private fileService: FileService,
    private publishService: PublishService,
    private state: AppStateService,
  ) {
    this.publishForm = this.fb.group({
      title:       ['', Validators.required],
      description: [''],
    });
  }

  ngOnInit() {
    this.state.loadFiles(0, 20);
    this.state.loadAccounts();
  }

  refreshFiles() { this.state.loadFiles(0, 20, true); }

  toggleAccount(id: string) {
    const s = new Set(this.selectedAccountIds());
    s.has(id) ? s.delete(id) : s.add(id);
    this.selectedAccountIds.set(s);
  }

  isAccountSelected(id: string): boolean { return this.selectedAccountIds().has(id); }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) this.setLocalFile(input.files[0]);
  }

  onDragOver(event: DragEvent) { event.preventDefault(); }

  onDrop(event: DragEvent) {
    event.preventDefault();
    const file = event.dataTransfer?.files[0];
    if (file) this.setLocalFile(file);
  }

  private setLocalFile(file: File) {
    this.selectedFile.set(file);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = e => this.localPreviewUrl.set(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      this.localPreviewUrl.set(null);
    }
  }

  removeLocalFile(event: Event) {
    event.stopPropagation();
    this.selectedFile.set(null);
    this.localPreviewUrl.set(null);
  }

  uploadFile() {
    const file = this.selectedFile();
    if (!file) return;
    this.uploading.set(true);
    this.uploadProgress.set(0);
    this.uploadError.set('');
    this.uploadSuccess.set(false);

    let s3Key = '';

    this.fileService.initiateUpload(file.name, file.type, file.size).pipe(
      switchMap(res => {
        s3Key = res.data.s3Key;
        return this.fileService.uploadToS3(res.data.uploadUrl, file);
      }),
    ).subscribe({
      next: event => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          this.uploadProgress.set(Math.round(100 * event.loaded / event.total));
        } else if (event.type === HttpEventType.Response) {
          this.fileService.confirmUpload(s3Key, file.name, file.type, file.size).subscribe({
            next: confirmRes => {
              if (confirmRes.success) {
                this.uploadProgress.set(100);
                this.uploadSuccess.set(true);
                this.selectedFile.set(null);
                this.localPreviewUrl.set(null);
                this.state.invalidateFiles();
                this.state.loadFiles(0, 20, true);
                setTimeout(() => { this.uploadSuccess.set(false); this.uploadProgress.set(null); }, 3000);
              }
              this.uploading.set(false);
            },
            error: (err: any) => {
              this.uploadError.set(err?.error?.message || 'Failed to confirm upload');
              this.uploading.set(false);
              this.uploadProgress.set(null);
            },
          });
        }
      },
      error: (err: any) => {
        this.uploadError.set(err?.error?.message || 'Upload failed');
        this.uploading.set(false);
        this.uploadProgress.set(null);
      },
    });
  }

  selectMediaFile(file: MediaFile) {
    if (this.selectedMediaFile()?.id === file.id) { this.selectedMediaFile.set(null); return; }
    this.fileService.getFile(file.id).subscribe({
      next: res => this.selectedMediaFile.set(res.success ? res.data : file),
      error: () => this.selectedMediaFile.set(file),
    });
  }

  deleteFile(event: Event, file: MediaFile) {
    event.stopPropagation();
    if (!confirm('Delete this file?')) return;
    this.fileService.deleteFile(file.id).subscribe({
      next: () => {
        if (this.selectedMediaFile()?.id === file.id) this.selectedMediaFile.set(null);
        this.state.invalidateFiles();
        this.state.loadFiles(0, 20, true);
      },
    });
  }

  onPublish() {
    const mediaFile = this.selectedMediaFile();
    const accountIds = [...this.selectedAccountIds()];
    if (!mediaFile || this.publishForm.invalid || accountIds.length === 0) return;

    const { title, description } = this.publishForm.value;
    const selectedAccounts = this.accounts().filter(a => accountIds.includes(a.id));

    this.publishing.set(true);
    this.publishResults.set(selectedAccounts.map(a => ({ account: a, status: 'publishing' })));

    let completed = 0;

    selectedAccounts.forEach(account => {
      this.publishService.publish(mediaFile.id, account.id, title, description).subscribe({
        next: res => {
          completed++;
          this.publishResults.update(results => results.map(r =>
            r.account.id === account.id
              ? { ...r, status: res.success ? 'success' : 'failed', error: res.message }
              : r
          ));
          if (completed === selectedAccounts.length) this.publishing.set(false);
        },
        error: (err: any) => {
          completed++;
          this.publishResults.update(results => results.map(r =>
            r.account.id === account.id
              ? { ...r, status: 'failed', error: err?.error?.message || 'Publish failed' }
              : r
          ));
          if (completed === selectedAccounts.length) this.publishing.set(false);
        },
      });
    });
  }

  get canPublish(): boolean {
    return !this.publishing() && !!this.selectedMediaFile() && this.publishForm.valid && this.selectedAccountIds().size > 0;
  }

  platformIcon(platform: string): string {
    switch (platform) {
      case 'TWITTER':   return 'bi-twitter-x';
      case 'YOUTUBE':   return 'bi-youtube';
      case 'INSTAGRAM': return 'bi-instagram';
      case 'TIKTOK':    return 'bi-tiktok';
      default:          return 'bi-globe';
    }
  }

  getFileIconClass(type: string): string {
    if (type.startsWith('video')) return 'bi-play-circle-fill';
    if (type.startsWith('audio')) return 'bi-music-note-beamed';
    return 'bi-image';
  }

  getMediaIconClass(type: string): string {
    if (type === 'VIDEO') return 'bi-play-circle-fill';
    if (type === 'AUDIO') return 'bi-music-note-beamed';
    return 'bi-image';
  }

  formatSize(bytes: number): string {
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
}
