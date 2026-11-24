import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'mb-login',
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="auth-card">
      <h1>Entrar</h1>
      <p class="muted">Acesse sua conta ou explore com o usuário demonstração.</p>

      <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <label>
          E-mail
          <input type="email" formControlName="email" autocomplete="username" />
        </label>
        @if (form.controls.email.touched && form.controls.email.invalid) {
          <small class="error">Informe um e-mail válido.</small>
        }

        <label>
          Senha
          <input type="password" formControlName="password" autocomplete="current-password" />
        </label>
        @if (form.controls.password.touched && form.controls.password.invalid) {
          <small class="error">Informe sua senha.</small>
        }

        <button type="submit" [disabled]="busy()">{{ busy() ? 'Entrando…' : 'Entrar' }}</button>
      </form>

      <button type="button" class="secondary" [disabled]="busy()" (click)="demo()">
        Entrar como Visitante
      </button>

      <p class="muted">Não tem conta? <a routerLink="/register">Criar conta</a></p>
    </section>
  `,
  styles: `
    .auth-card {
      max-width: 380px;
      margin: 4rem auto;
      padding: 2rem;
      background: #fff;
      border-radius: 24px;
      box-shadow: 0 12px 32px rgb(41 37 42 / 10%);
      display: grid;
      gap: 1rem;
    }
    form {
      display: grid;
      gap: 0.75rem;
    }
    label {
      display: grid;
      gap: 0.35rem;
      font-size: 0.9rem;
    }
    input {
      padding: 0.6rem 0.75rem;
      border: 1px solid var(--input-border);
      border-radius: 8px;
      font: inherit;
    }
    button {
      padding: 0.7rem;
      border: 0;
      border-radius: 999px;
      background: var(--brand-gradient);
      color: #fff;
      font: inherit;
      cursor: pointer;
    }
    button:disabled {
      opacity: 0.6;
      cursor: default;
    }
    button.secondary {
      background: var(--border);
      color: var(--foreground);
    }
    .error {
      color: var(--error);
    }
    .muted {
      color: var(--muted-foreground);
      margin: 0;
    }
  `,
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly busy = signal(false);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.run(this.auth.login(this.form.getRawValue()));
  }

  demo(): void {
    this.run(this.auth.loginDemo());
  }

  private run(request: ReturnType<AuthService['login']>): void {
    this.busy.set(true);
    request.pipe(finalize(() => this.busy.set(false))).subscribe({
      next: () =>
        this.router.navigateByUrl(
          this.route.snapshot.queryParamMap.get('returnUrl') ?? '/dashboard',
        ),
      error: () => {
        // o erro já aparece como toast pelo errorInterceptor
      },
    });
  }
}
