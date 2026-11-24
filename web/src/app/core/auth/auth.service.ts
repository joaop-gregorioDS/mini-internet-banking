import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, finalize, shareReplay, tap, throwError } from 'rxjs';
import { AuthResponse, AuthUser, LoginPayload, RegisterPayload, Session } from './auth.models';

const STORAGE_KEY = 'mb.session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly sessionSignal = signal<Session | null>(this.readStorage());

  readonly session = this.sessionSignal.asReadonly();
  readonly user = computed<AuthUser | null>(() => this.sessionSignal()?.user ?? null);
  readonly isAuthenticated = computed(() => this.sessionSignal() !== null);

  /** Uma única chamada de refresh em voo, mesmo com várias requisições recebendo 401 ao mesmo tempo. */
  private refreshInFlight: Observable<AuthResponse> | null = null;

  login(payload: LoginPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/api/auth/login', payload).pipe(tap((r) => this.store(r)));
  }

  register(payload: RegisterPayload): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>('/api/auth/register', payload)
      .pipe(tap((r) => this.store(r)));
  }

  loginDemo(): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/api/auth/demo', null).pipe(tap((r) => this.store(r)));
  }

  refreshOnce(): Observable<AuthResponse> {
    if (this.refreshInFlight) {
      return this.refreshInFlight;
    }

    const refreshToken = this.sessionSignal()?.refreshToken;
    if (!refreshToken) {
      return throwError(() => new Error('Sem sessão para renovar.'));
    }

    this.refreshInFlight = this.http.post<AuthResponse>('/api/auth/refresh', { refreshToken }).pipe(
      tap((r) => this.store(r)),
      finalize(() => (this.refreshInFlight = null)),
      shareReplay(1),
    );

    return this.refreshInFlight;
  }

  accessToken(): string | null {
    return this.sessionSignal()?.accessToken ?? null;
  }

  logout(redirectToLogin = true): void {
    this.sessionSignal.set(null);
    localStorage.removeItem(STORAGE_KEY);
    if (redirectToLogin) {
      this.router.navigateByUrl('/login');
    }
  }

  private store(response: AuthResponse): void {
    const session: Session = {
      accessToken: response.accessToken,
      accessTokenExpiresAt: response.accessTokenExpiresAt,
      refreshToken: response.refreshToken,
      user: response.user,
    };
    this.sessionSignal.set(session);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }

  private readStorage(): Session | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Session) : null;
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
  }
}
