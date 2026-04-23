import { Component, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SchedulerService } from '../../core/services/api.service';
import { AppStateService } from '../../core/services/app-state.service';
import { ScheduledPublish } from '../../core/models/models';

@Component({
  selector: 'app-scheduler',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, DatePipe],
  templateUrl: './scheduler.component.html',
  styleUrl: './scheduler.component.scss',
})
export class SchedulerComponent implements OnInit {
  form: FormGroup;

  schedules = signal<ScheduledPublish[]>([]);
  loading = signal(false);
  loadingSchedules = signal(false);
  cancellingId = signal('');
  error = signal('');
  success = signal(false);

  get files() { return this.state.files; }
  get accounts() { return this.state.accounts; }

  constructor(
    private fb: FormBuilder,
    private schedulerService: SchedulerService,
    private state: AppStateService,
  ) {
    this.form = this.fb.group({
      mediaFileId: ['', Validators.required],
      socialAccountId: ['', Validators.required],
      title: ['', Validators.required],
      description: [''],
      frequency: ['DAILY', Validators.required],
    });
  }

  ngOnInit() {
    this.loadSchedules();
    this.state.loadFiles(0, 50);
    this.state.loadAccounts();
  }

  loadSchedules() {
    this.loadingSchedules.set(true);
    this.schedulerService.getSchedules().subscribe({
      next: res => {
        if (res.success) this.schedules.set(res.data);
        this.loadingSchedules.set(false);
      },
      error: () => this.loadingSchedules.set(false),
    });
  }

  onSubmit() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set('');
    this.success.set(false);
    const { mediaFileId, socialAccountId, title, frequency, description } = this.form.value;
    this.schedulerService.createSchedule(mediaFileId, socialAccountId, title, frequency, description).subscribe({
      next: res => {
        if (res.success) {
          this.success.set(true);
          this.form.patchValue({ title: '', description: '', mediaFileId: '', socialAccountId: '' });
          this.loadSchedules();
          setTimeout(() => this.success.set(false), 4000);
        }
        this.loading.set(false);
      },
      error: (err: any) => {
        this.error.set(err?.error?.message || 'Failed to create schedule');
        this.loading.set(false);
      },
    });
  }

  cancelSchedule(s: ScheduledPublish) {
    if (!confirm('Cancel this schedule? Future posts will stop.')) return;
    this.cancellingId.set(s.id);
    this.schedulerService.cancelSchedule(s.id).subscribe({
      next: () => { this.cancellingId.set(''); this.loadSchedules(); },
      error: () => this.cancellingId.set(''),
    });
  }

  formatSize(b: number): string {
    if (b < 1024 * 1024) return (b / 1024).toFixed(1) + ' KB';
    return (b / (1024 * 1024)).toFixed(1) + ' MB';
  }
}
