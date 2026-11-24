import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let http: HttpTestingController;
  let router: Router;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    fixture = TestBed.createComponent(LoginComponent);
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    fixture.detectChanges();
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('não envia nada quando o formulário é inválido e mostra os erros', () => {
    const button = fixture.nativeElement.querySelector(
      'button[type="submit"]',
    ) as HTMLButtonElement;
    button.click();
    fixture.detectChanges();

    http.expectNone('/api/auth/login');
    expect(fixture.nativeElement.textContent).toContain('Informe um e-mail válido.');
    expect(fixture.nativeElement.textContent).toContain('Informe sua senha.');
  });

  it('entra como visitante e vai para o painel', () => {
    const demoButton = [...fixture.nativeElement.querySelectorAll('button')].find((b) =>
      (b as HTMLButtonElement).textContent?.includes('Visitante'),
    ) as HTMLButtonElement;
    demoButton.click();

    const req = http.expectOne('/api/auth/demo');
    expect(req.request.method).toBe('POST');
    req.flush({
      accessToken: 't',
      accessTokenExpiresAt: '2030-01-01T00:00:00Z',
      refreshToken: 'r',
      refreshTokenExpiresAt: '2030-01-08T00:00:00Z',
      user: { id: '1', name: 'Visitante Demo', email: 'v@d.dev', isDemo: true },
    });

    expect(router.navigateByUrl).toHaveBeenCalledWith('/dashboard');
    expect(localStorage.getItem('mb.session')).not.toBeNull();
  });

  it('envia e-mail e senha digitados no login', () => {
    const component = fixture.componentInstance;
    component.form.setValue({ email: 'ana@teste.dev', password: 'Senha!Forte123' });

    component.submit();

    const req = http.expectOne('/api/auth/login');
    expect(req.request.body).toEqual({ email: 'ana@teste.dev', password: 'Senha!Forte123' });
    req.flush({ error: 'x' }, { status: 401, statusText: 'Unauthorized' });
    expect(component.busy()).toBe(false);
  });
});
