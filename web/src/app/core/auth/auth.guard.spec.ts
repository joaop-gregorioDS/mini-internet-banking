import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { authGuard, guestGuard } from './auth.guard';

const route = {} as ActivatedRouteSnapshot;
const state = (url: string) => ({ url }) as RouterStateSnapshot;

describe('authGuard', () => {
  let router: Router;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    router = TestBed.inject(Router);
  });

  it('bloqueia e redireciona para /login com returnUrl quando não há sessão', () => {
    const result = TestBed.runInInjectionContext(() => authGuard(route, state('/dashboard')));

    expect(result).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(result as UrlTree)).toBe('/login?returnUrl=%2Fdashboard');
  });

  it('libera a rota quando há sessão salva', () => {
    localStorage.setItem(
      'mb.session',
      JSON.stringify({
        accessToken: 't',
        accessTokenExpiresAt: '2030-01-01T00:00:00Z',
        refreshToken: 'r',
        user: { id: '1', name: 'Ana', email: 'a@b.dev', isDemo: false },
      }),
    );

    const result = TestBed.runInInjectionContext(() => authGuard(route, state('/dashboard')));

    expect(result).toBe(true);
  });
});

describe('guestGuard', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
  });

  it('deixa visitantes verem o login', () => {
    const result = TestBed.runInInjectionContext(() => guestGuard(route, state('/login')));
    expect(result).toBe(true);
  });
});
