import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-logo">
          <span class="logo-icon">📡</span>
          <h1>Create Account</h1>
          <p>Get started with PostOnMyWall</p>
        </div>
        <div class="alert alert-error"   *ngIf="error">{{ error }}</div>
        <div class="alert alert-success" *ngIf="success">Account created! Redirecting to login...</div>
        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label>Username</label>
            <input class="form-control" formControlName="username" placeholder="Choose a username" />
            <span class="field-error" *ngIf="form.get('username')?.touched && form.get('username')?.errors?.['minlength']">Minimum 3 characters</span>
          </div>
          <div class="form-group">
            <label>Email</label>
            <input class="form-control" type="email" formControlName="email" placeholder="Enter your email" />
            <span class="field-error" *ngIf="form.get('email')?.touched && form.get('email')?.errors?.['email']">Invalid email address</span>
          </div>
          <div class="form-group">
            <label>Password</label>
            <input class="form-control" type="password" formControlName="password" placeholder="Minimum 8 characters" />
            <span class="field-error" *ngIf="form.get('password')?.touched && form.get('password')?.errors?.['minlength']">Minimum 8 characters</span>
          </div>
          <button class="btn btn-primary btn-full btn-lg" type="submit" [disabled]="loading || form.invalid">
            <span class="spinner" *ngIf="loading"></span>
            {{ loading ? 'Creating account...' : 'Create Account' }}
          </button>
        </form>
        <div class="auth-footer">Already have an account? <a routerLink="/auth/login">Sign in</a></div>
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
    .field-error { font-size:0.75rem; color:var(--danger); margin-top:4px; display:block; }
    .auth-footer { text-align:center; margin-top:24px; font-size:0.875rem; color:var(--gray-500); }
  `]
})
export class RegisterComponent {
  form: FormGroup;
  loading = false;
  error = '';
  success = false;

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {
    this.form = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email:    ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]]
    });
  }

  onSubmit() {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';
    const { username, email, password } = this.form.value;
    this.auth.register(username, email, password).subscribe({
      next: () => { this.success = true; setTimeout(() => this.router.navigate(['/auth/login']), 1500); },
      error: (err: any) => { this.error = err?.error?.message || 'Registration failed. Please try again.'; this.loading = false; }
    });
  }
}
