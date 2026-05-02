import { Routes } from '@angular/router';
import { AuthGuard, GuestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'auth',
    canActivate: [GuestGuard],
    children: [
      { path: 'login',    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent) },
      { path: 'register', loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent) },
      { path: '', redirectTo: 'login', pathMatch: 'full' }
    ]
  },
  {
    path: 'oauth/callback',
    loadComponent: () => import('./features/oauth-callback/oauth-callback.component').then(m => m.OAuthCallbackComponent),
  },
  {
    path: '',
    loadComponent: () => import('./shared/components/layout.component').then(m => m.LayoutComponent),
    canActivate: [AuthGuard],
    children: [
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'accounts',  loadComponent: () => import('./features/accounts/accounts.component').then(m => m.AccountsComponent) },
      { path: 'publish',   loadComponent: () => import('./features/upload-publish/upload-publish.component').then(m => m.UploadPublishComponent) },
      { path: 'scheduler', loadComponent: () => import('./features/scheduler/scheduler.component').then(m => m.SchedulerComponent) },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  { path: 'privacy', loadComponent: () => import('./features/privacy/privacy.component').then(m => m.PrivacyComponent) },
  { path: 'terms',   loadComponent: () => import('./features/terms/terms.component').then(m => m.TermsComponent) },
  { path: '**', redirectTo: 'dashboard' }
];
