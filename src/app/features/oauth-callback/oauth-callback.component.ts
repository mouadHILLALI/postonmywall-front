import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AppStateService } from '../../core/services/app-state.service';

@Component({
  selector: 'app-oauth-callback',
  standalone: true,
  template: `
    <div class="callback-page">
      <div class="callback-card">
        @if (status === 'loading') {
          <div class="cb-icon loading"><i class="bi bi-arrow-clockwise spin"></i></div>
          <h3>Connecting…</h3>
          <p>Finishing up your account connection.</p>
        } @else if (status === 'success') {
          <div class="cb-icon success"><i class="bi bi-check-circle-fill"></i></div>
          <h3>Connected!</h3>
          <p>Your <strong>{{ platform }}</strong> account was linked successfully.</p>
          <p class="redirect-hint">This window will close automatically.</p>
        } @else {
          <div class="cb-icon error"><i class="bi bi-x-circle-fill"></i></div>
          <h3>Connection failed</h3>
          <p>{{ errorMessage || 'Something went wrong. Please try again.' }}</p>
          <button class="btn btn-primary" (click)="goBack()">
            <i class="bi bi-arrow-left"></i> Go back
          </button>
        }
      </div>
    </div>
  `,
  styles: [`
    .callback-page {
      min-height: 100vh;
      background: var(--gray-50);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .callback-card {
      background: white;
      border-radius: var(--radius-lg);
      border: 1px solid var(--gray-200);
      box-shadow: var(--shadow-lg);
      padding: 48px 40px;
      text-align: center;
      max-width: 380px;
      width: 100%;
    }
    .cb-icon { font-size: 3rem; margin-bottom: 20px; line-height: 1; }
    .cb-icon.loading { color: var(--primary); }
    .cb-icon.success { color: var(--success); }
    .cb-icon.error   { color: var(--danger); }
    h3 { margin-bottom: 10px; }
    p  { color: var(--gray-500); font-size: 0.875rem; margin-bottom: 4px; }
    .redirect-hint { font-size: 0.78rem; color: var(--gray-400); margin-top: 12px; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .spin { display: inline-block; animation: spin 0.8s linear infinite; }
    .btn { margin-top: 16px; }
  `],
})
export class OAuthCallbackComponent implements OnInit {
  status: 'loading' | 'success' | 'error' = 'loading';
  platform = '';
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private state: AppStateService,
  ) {}

  ngOnInit() {
    const params = this.route.snapshot.queryParamMap;
    this.platform = (params.get('platform') ?? '').toUpperCase();
    const cbStatus = params.get('status');
    const message = params.get('message') ?? '';

    const isPopup = window.opener && !window.opener.closed;

    if (cbStatus === 'success') {
      this.status = 'success';

      if (isPopup) {
        // Send result to parent window, then close
        window.opener.postMessage(
          { type: 'oauth_callback', status: 'success', platform: this.platform },
          window.location.origin,
        );
        setTimeout(() => window.close(), 1200);
      } else {
        // Full-page fallback: refresh cache and navigate
        this.state.invalidateAccounts();
        this.state.loadAccounts(true);
        setTimeout(() => this.router.navigate(['/accounts']), 2000);
      }
    } else {
      this.status = 'error';
      this.errorMessage = message;

      if (isPopup) {
        window.opener.postMessage(
          { type: 'oauth_callback', status: 'error', platform: this.platform, message },
          window.location.origin,
        );
        setTimeout(() => window.close(), 3000);
      }
    }
  }

  goBack() {
    if (window.opener && !window.opener.closed) {
      window.close();
    } else {
      this.router.navigate(['/accounts']);
    }
  }
}
