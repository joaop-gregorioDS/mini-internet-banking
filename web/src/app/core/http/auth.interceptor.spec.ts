import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from '../auth/auth.service';
import { authInterceptor } from './auth.interceptor';
import { errorInterceptor } from './error.interceptor';

const session = {
  accessToken: 'token-antigo',
  accessTokenExpiresAt: '2030-01-01T00:00:00Z',
  refreshToken: 'refresh-1',
  user: { id: '1', name: 'Ana', email: 'ana@teste.dev', isDemo: false },
};

const refreshed = {
  accessToken: 'token-novo',
  accessTokenExpiresAt: '2030-01-01T01:00:00Z',
  refreshToken: 'refresh-2',
  refreshTokenExpiresAt: '2030-01-08T00:00:00Z',
  user: session.user,
};

describe('authInterceptor', () => {
  let http: HttpClient;
  let mock: HttpTestingController;
  let auth: AuthService;
  let router: Router;

  beforeEach(() => {
    localStorage.setItem('mb.session', JSON.stringify(session));

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([errorInterceptor, authInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    http = TestBed.inject(HttpClient);
    mock = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
  });

  afterEach(() => {
    mock.verify();
    localStorage.clear();
  });

  it('anexa o Bearer token nas chamadas da API', () => {
    http.get('/api/accounts/me').subscribe();

    const req = mock.expectOne('/api/accounts/me');
    expect(req.request.headers.get('Authorization')).toBe('Bearer token-antigo');
    req.flush({});
  });

  it('não anexa token em /api/auth/*', () => {
    http.post('/api/auth/login', {}).subscribe();

    const req = mock.expectOne('/api/auth/login');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('em 401, renova a sessão uma vez e repete a requisição original', () => {
    let result: unknown;
    http.get('/api/accounts/me').subscribe((r) => (result = r));

    mock.expectOne('/api/accounts/me').flush(
      { title: 'Não autorizado' },
      { status: 401, statusText: 'Unauthorized' },
    );

    const refresh = mock.expectOne('/api/auth/refresh');
    expect(refresh.request.body).toEqual({ refreshToken: 'refresh-1' });
    refresh.flush(refreshed);

    const retry = mock.expectOne('/api/accounts/me');
    expect(retry.request.headers.get('Authorization')).toBe('Bearer token-novo');
    retry.flush({ balance: 10 });

    expect(result).toEqual({ balance: 10 });
    expect(auth.accessToken()).toBe('token-novo');
  });

  it('com várias requisições em 401 ao mesmo tempo, dispara um único refresh', () => {
    http.get('/api/accounts/me').subscribe();
    http.get('/api/transactions').subscribe();
    http.get('/api/dashboard/summary').subscribe();

    mock.expectOne('/api/accounts/me').flush({}, { status: 401, statusText: 'Unauthorized' });
    mock.expectOne('/api/transactions').flush({}, { status: 401, statusText: 'Unauthorized' });
    mock.expectOne('/api/dashboard/summary').flush({}, { status: 401, statusText: 'Unauthorized' });

    const refreshes = mock.match('/api/auth/refresh');
    expect(refreshes.length).toBe(1);
    refreshes[0].flush(refreshed);

    expect(mock.match('/api/accounts/me').length).toBe(1);
    expect(mock.match('/api/transactions').length).toBe(1);
    expect(mock.match('/api/dashboard/summary').length).toBe(1);
  });

  it('se o refresh falhar, encerra a sessão e redireciona para o login', () => {
    let errorStatus: number | undefined;
    http.get('/api/accounts/me').subscribe({ error: (e) => (errorStatus = e.status) });

    mock.expectOne('/api/accounts/me').flush({}, { status: 401, statusText: 'Unauthorized' });
    mock.expectOne('/api/auth/refresh').flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(errorStatus).toBe(401);
    expect(auth.isAuthenticated()).toBe(false);
    expect(localStorage.getItem('mb.session')).toBeNull();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/login');
  });

  it('erros que não são 401 chegam ao chamador sem tentar refresh', () => {
    let errorStatus: number | undefined;
    http.get('/api/accounts/me').subscribe({ error: (e) => (errorStatus = e.status) });

    mock.expectOne('/api/accounts/me').flush({}, { status: 500, statusText: 'Server Error' });

    expect(errorStatus).toBe(500);
    expect(auth.isAuthenticated()).toBe(true);
  });
});
