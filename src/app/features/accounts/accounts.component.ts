import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AccountService } from '../../core/services/api.service';
import { AppStateService } from '../../core/services/app-state.service';
import { SocialAccount, Platform } from '../../core/models/models';

interface PlatformDef {
  value: Platform;
  label: string;
  subtitle: string;
  iconClass: string;
  circleColor: string;
  hint: string;
}

@Component({
  selector: 'app-accounts',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './accounts.component.html',
  styleUrl: './accounts.component.scss',
})
export class AccountsComponent implements OnInit, OnDestroy {
  form: FormGroup;

  loading = signal(false);
  unlinkingId = signal('');
  oauthLoadingPlatform = signal<Platform | null>(null);
  error = signal('');
  success = signal(false);
  showTokenSecret = signal(false);
  showManualForm = signal(false);

  readonly platforms: PlatformDef[] = [
    {
      value: 'TWITTER',
      label: 'X (formerly Twitter)',
      subtitle: 'Profiles',
      iconClass: 'bi-twitter-x',
      circleColor: '#000000',
      hint: 'developer.twitter.com → Keys and Tokens → Generate Access Token & Secret',
    },
    {
      value: 'INSTAGRAM',
      label: 'Instagram',
      subtitle: 'Business Accounts',
      iconClass: 'bi-instagram',
      circleColor: 'linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)',
      hint: 'developers.facebook.com/tools/explorer → instagram_content_publish token',
    },
    {
      value: 'TIKTOK',
      label: 'TikTok',
      subtitle: 'Accounts',
      iconClass: 'bi-tiktok',
      circleColor: '#010101',
      hint: 'developers.tiktok.com → Your App → Sandbox → Generate token',
    },
    {
      value: 'YOUTUBE',
      label: 'YouTube',
      subtitle: 'Shorts & Videos',
      iconClass: 'bi-youtube',
      circleColor: '#FF0000',
      hint: 'developers.google.com/oauthplayground → YouTube Data API v3 → Exchange token',
    },
  ];

  get accounts() { return this.state.accounts; }
  get loadingAccounts() { return this.state.accountsLoading; }

  private popupMessageHandler = this.handlePopupMessage.bind(this);

  constructor(
    private fb: FormBuilder,
    private accountService: AccountService,
    private state: AppStateService,
  ) {
    this.form = this.fb.group({
      platform: ['', Validators.required],
      accountId: ['', Validators.required],
      accessToken: ['', Validators.required],
      tokenSecret: [''],
    });
  }

  ngOnInit() {
    this.state.loadAccounts();
    window.addEventListener('message', this.popupMessageHandler);
  }

  ngOnDestroy() {
    window.removeEventListener('message', this.popupMessageHandler);
  }

  private handlePopupMessage(event: MessageEvent) {
    if (event.origin !== window.location.origin) return;
    if (event.data?.type !== 'oauth_callback') return;

    this.oauthLoadingPlatform.set(null);

    if (event.data.status === 'success') {
      this.state.invalidateAccounts();
      this.state.loadAccounts(true);
    } else {
      this.error.set(event.data.message || 'Connection failed. Please try again.');
    }
  }

  refreshAccounts() {
    this.state.loadAccounts(true);
  }

  // ── OAuth popup flow ──────────────────────────────────────────
  connectOAuth(platform: Platform) {
    this.oauthLoadingPlatform.set(platform);
    this.error.set('');

    this.accountService.getOAuthUrl(platform).subscribe({
      next: res => {
        if (res.success && res.data.authorizationUrl) {
          this.openPopup(res.data.authorizationUrl, platform);
        } else {
          this.oauthLoadingPlatform.set(null);
          this.error.set('Could not get authorization URL. Try manual setup below.');
          this.showManualForm.set(true);
        }
      },
      error: () => {
        this.oauthLoadingPlatform.set(null);
        this.error.set('OAuth unavailable for this platform. Use manual setup below.');
        this.showManualForm.set(true);
      },
    });
  }

  private openPopup(url: string, platform: Platform) {
    const w = 600, h = 700;
    const left = Math.round((screen.width  - w) / 2);
    const top  = Math.round((screen.height - h) / 2);

    const popup = window.open(
      url,
      `oauth_${platform}`,
      `width=${w},height=${h},left=${left},top=${top},scrollbars=yes,resizable=yes`,
    );

    if (!popup) {
      // Browser blocked the popup — fall back to redirect
      this.oauthLoadingPlatform.set(null);
      this.error.set('Popup was blocked. Allow popups for this site and try again.');
      return;
    }

    // Reset loading state if the user closes the popup without completing auth
    const pollTimer = setInterval(() => {
      if (popup.closed) {
        clearInterval(pollTimer);
        this.oauthLoadingPlatform.set(null);
      }
    }, 500);
  }

  // ── Manual form ───────────────────────────────────────────────
  onPlatformChange(platform: string) {
    this.showTokenSecret.set(platform === 'TWITTER');
  }

  onSubmit() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set('');
    this.success.set(false);
    const { platform, accountId, accessToken, tokenSecret } = this.form.value;
    this.accountService.linkAccount(platform, accountId, accessToken, tokenSecret || undefined).subscribe({
      next: res => {
        if (res.success) {
          this.success.set(true);
          this.form.reset();
          this.showTokenSecret.set(false);
          this.state.invalidateAccounts();
          this.state.loadAccounts(true);
          setTimeout(() => this.success.set(false), 3000);
        }
        this.loading.set(false);
      },
      error: (err: any) => {
        this.error.set(err?.error?.message || 'Failed to link account');
        this.loading.set(false);
      },
    });
  }

  unlink(account: SocialAccount) {
    if (!confirm(`Disconnect "${account.accountId}" from ${account.platform}?`)) return;
    this.unlinkingId.set(account.id);
    this.accountService.unlinkAccount(account.id).subscribe({
      next: () => {
        this.unlinkingId.set('');
        this.state.invalidateAccounts();
        this.state.loadAccounts(true);
      },
      error: () => this.unlinkingId.set(''),
    });
  }

  // ── Helpers ───────────────────────────────────────────────────
  getAccountsForPlatform(platform: Platform): SocialAccount[] {
    return this.accounts().filter(a => a.platform === platform && a.active);
  }

  getPlatformDef(platform: Platform): PlatformDef {
    return this.platforms.find(p => p.value === platform)!;
  }
}
