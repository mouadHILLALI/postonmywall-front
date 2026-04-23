import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { ApiResponse, AuthResponse, User } from '../models/models';
import { environment } from '../../../environments/environment';
import { AppStateService } from './app-state.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly API = environment.apiUrl;
  private userSubject: BehaviorSubject<User | null>;
  user$: Observable<User | null>;

  private state = inject(AppStateService);

  constructor(private http: HttpClient, private router: Router) {
    this.userSubject = new BehaviorSubject<User | null>(this.getStoredUser());
    this.user$ = this.userSubject.asObservable();
  }

  register(username: string, email: string, password: string): Observable<ApiResponse<User>> {
    return this.http.post<ApiResponse<User>>(`${this.API}/auth/register`, { username, email, password });
  }

  login(username: string, password: string): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.API}/auth/login`, { username, password }).pipe(
      tap(res => {
        if (res.success && res.data) {
          localStorage.setItem('token', res.data.token);
          const user: User = { id: res.data.userId, username: res.data.username, email: '' };
          localStorage.setItem('user', JSON.stringify(user));
          this.userSubject.next(user);
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.userSubject.next(null);
    this.state.clearAll();
    this.router.navigate(['/auth/login']);
  }

  getToken(): string | null { return localStorage.getItem('token'); }
  isLoggedIn(): boolean { return !!this.getToken(); }
  getCurrentUser(): User | null { return this.userSubject.value; }
  private getStoredUser(): User | null { const u = localStorage.getItem('user'); return u ? JSON.parse(u) : null; }
}
