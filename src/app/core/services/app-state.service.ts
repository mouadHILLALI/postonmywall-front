import { Injectable, inject, signal } from '@angular/core';
import { AccountService, FileService } from './api.service';
import { SocialAccount, MediaFile } from '../models/models';

@Injectable({ providedIn: 'root' })
export class AppStateService {
  private accountService = inject(AccountService);
  private fileService = inject(FileService);

  readonly accounts = signal<SocialAccount[]>([]);
  readonly accountsLoading = signal(false);
  private accountsLoaded = false;

  readonly files = signal<MediaFile[]>([]);
  readonly filesLoading = signal(false);
  readonly filesTotalPages = signal(0);
  private filesLoadedPage = -1;

  loadAccounts(force = false) {
    if (this.accountsLoaded && !force) return;
    this.accountsLoading.set(true);
    this.accountService.getAccounts().subscribe({
      next: res => {
        if (res.success) {
          this.accounts.set(res.data);
          this.accountsLoaded = true;
        }
        this.accountsLoading.set(false);
      },
      error: () => this.accountsLoading.set(false),
    });
  }

  invalidateAccounts() {
    this.accountsLoaded = false;
  }

  loadFiles(page = 0, size = 20, force = false) {
    if (this.filesLoadedPage === page && !force) return;
    this.filesLoading.set(true);
    this.fileService.getFiles(page, size).subscribe({
      next: res => {
        if (res.success) {
          this.files.set(res.data.content);
          this.filesTotalPages.set(res.data.totalPages);
          this.filesLoadedPage = page;
        }
        this.filesLoading.set(false);
      },
      error: () => this.filesLoading.set(false),
    });
  }

  invalidateFiles() {
    this.filesLoadedPage = -1;
  }

  clearAll() {
    this.accounts.set([]);
    this.accountsLoaded = false;
    this.files.set([]);
    this.filesLoadedPage = -1;
    this.filesTotalPages.set(0);
  }
}
