import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-logo">
          <span class="logo-icon">📡</span>
          <h1>PostOnMyWall</h1>
          <p>Sign in to your account</p>
        </div>
        <div class="alert alert-error" *ngIf="error">{{ error }}</div>
        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label>Username</label>
            <input class="form-control" formControlName="username" placeholder="Enter your username" />
          </div>
          <div class="form-group">
            <label>Password</label>
            <input class="form-control" type="password" formControlName="password" placeholder="Enter your password" />
          </div>
          <button class="btn btn-primary btn-full btn-lg" type="submit" [disabled]="loading || form.invalid">
            <span class="spinner" *ngIf="loading"></span>
            {{ loading ? 'Signing in...' : 'Sign In' }}
          </button>
        </form>
        <div class="auth-footer">
          Don't have an account? <a routerLink="/auth/register">Create one</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page { min-height:100vh; background:linear-gradient(135deg,#EFF6FF 0%,#F9FAFB 100%); display:flex; align-items:center; justify-content:center; padding:24px; }
    .auth-card { background:white; border-radius:var(--radius-lg); border:1px solid var(--gray-200); box-shadow:var(--shadow-lg); padding:40px; width:100%; max-width:400px; }
    .auth-logo { text-align:center; margin-bottom:32px; }
    .auth-logo .logo-icon { font-size:2.5rem; display:block; margin-bottom:12px; }
    .auth-logo h1 { font-size:1.5rem; margin-bottom:6px; }
    .auth-logo p { color:var(--gray-500); font-size:0.875rem; }
    .auth-footer { text-align:center; margin-top:24px; font-size:0.875rem; color:var(--gray-500); }
  `]
})
export class LoginComponent {
  form: FormGroup;
  loading = false;
  error = '';

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {
    this.form = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit() {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';
    const { username, password } = this.form.value;
    this.auth.login(username, password).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err: any) => { this.error = err?.error?.message || 'Invalid username or password'; this.loading = false; }
    });
  }
}
