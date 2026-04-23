import { Component, OnInit, signal, computed } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SlicePipe } from '@angular/common';
import { PublishService } from '../../core/services/api.service';
import { PublishLog, PublishStatus } from '../../core/models/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [FormsModule, DatePipe, SlicePipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  logs = signal<PublishLog[]>([]);
  loading = signal(false);
  removingId = signal('');
  filterStatus = signal('');
  currentPage = signal(0);
  totalPages = signal(0);

  filtered = computed(() => {
    const status = this.filterStatus();
    return status ? this.logs().filter(l => l.status === status) : this.logs();
  });

  constructor(private publishService: PublishService) {}

  ngOnInit() {
    this.loadLogs();
  }

  loadLogs() {
    this.loading.set(true);
    this.publishService.getLogs(this.currentPage(), 10).subscribe({
      next: res => {
        if (res.success) {
          this.logs.set(res.data.content);
          this.totalPages.set(res.data.totalPages);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  setFilter(status: string) {
    this.filterStatus.set(status);
  }

  countByStatus(s: string) {
    return this.logs().filter(l => l.status === s).length;
  }

  removePost(log: PublishLog) {
    if (!confirm('Remove this post from the platform?')) return;
    this.removingId.set(log.id);
    this.publishService.removePost(log.id).subscribe({
      next: () => {
        this.removingId.set('');
        this.loadLogs();
      },
      error: () => this.removingId.set(''),
    });
  }

  prevPage() {
    if (this.currentPage() > 0) {
      this.currentPage.update(p => p - 1);
      this.loadLogs();
    }
  }

  nextPage() {
    if (this.currentPage() < this.totalPages() - 1) {
      this.currentPage.update(p => p + 1);
      this.loadLogs();
    }
  }

  getStatusBadge(status: PublishStatus): string {
    const map: Record<PublishStatus, string> = {
      PUBLISHED: 'badge-success',
      FAILED: 'badge-danger',
      REMOVED: 'badge-gray',
      PENDING: 'badge-warning',
    };
    return map[status] ?? 'badge-gray';
  }

  getPlatformIconClass(platform: string): string {
    const map: Record<string, string> = {
      TWITTER: 'bi-twitter-x', YOUTUBE: 'bi-youtube',
      INSTAGRAM: 'bi-instagram', TIKTOK: 'bi-tiktok',
    };
    return map[platform] ?? 'bi-person-circle';
  }
}
