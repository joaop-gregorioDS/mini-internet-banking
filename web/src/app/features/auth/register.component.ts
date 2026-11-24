import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { cpfValidator, maskCpf } from '../../shared/validators/cpf.validator';

function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return password && confirm && password !== confirm ? { mismatch: true } : null;
}

@Component({
  selector: 'mb-register',
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="auth-card">
      <h1>Criar conta</h1>
      <p class="muted">Dados fictícios: não use informações reais.</p>

      <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <label>
          Nome completo
          <input formControlName="name" autocomplete="name" />
        </label>

        <label>
          CPF
          <input formControlName="cpf" inputmode="numeric" placeholder="000.000.000-00" (input)="onCpfInput($event)" />
        </label>
        @if (form.controls.cpf.touched && form.controls.cpf.hasError('cpf')) {
          <small class="error">CPF inválido.</small>
        }

        <label>
          E-mail
          <input type="email" formControlName="email" autocomplete="email" />
        </label>
        @if (form.controls.email.touched && form.controls.email.invalid) {
          <small class="error">Informe um e-mail válido.</small>
        }

        <label>
          Senha
          <input type="password" formControlName="password" autocomplete="new-password" />
        </label>
        @if (form.controls.password.touched && form.controls.password.hasError('minlength')) {
          <small class="error">A senha deve ter pelo menos 8 caracteres.</small>
        }

        <label>
          Confirmar senha
          <input type="password" formControlName="confirmPassword" autocomplete="new-password" />
        </label>
        @if (form.touched && form.hasError('mismatch')) {
          <small class="error">As senhas não coincidem.</small>
        }

        <button type="submit" [disabled]="busy()">{{ busy() ? 'Criando…' : 'Criar conta' }}</button>
      </form>

      <p class="muted">Já tem conta? <a routerLink="/login">Entrar</a></p>
    </section>
  `,
  styles: `
    .auth-card { max-width: 380px; margin: 3rem auto; padding: 2rem; background: #fff; border-radius: 12px; box-shadow: 0 2px 12px rgb(0 0 0 / 8%); display: grid; gap: 1rem; }
    form { display: grid; gap: .75rem; }
    label { display: grid; gap: .35rem; font-size: .9rem; }
    input { padding: .6rem .75rem; border: 1px solid #cbd5e1; border-radius: 8px; font: inherit; }
    button { padding: .7rem; border: 0; border-radius: 8px; background: #0f766e; color: #fff; font: inherit; cursor: pointer; }
    button:disabled { opacity: .6; cursor: default; }
    .error { color: #b91c1c; }
    .muted { color: #64748b; margin: 0; }
  `,
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly busy = signal(false);

  readonly form = this.fb.nonNullable.group(
    {
      name: ['', [Validators.required, Validators.maxLength(120)]],
      cpf: ['', [Validators.required, cpfValidator]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordsMatch },
  );

  onCpfInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const masked = maskCpf(input.value);
    input.value = masked;
    this.form.controls.cpf.setValue(masked);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { name, cpf, email, password } = this.form.getRawValue();
    this.busy.set(true);
    this.auth
      .register({ name, cpf: cpf.replace(/\D/g, ''), email, password })
      .pipe(finalize(() => this.busy.set(false)))
      .subscribe({
        next: () => this.router.navigateByUrl('/dashboard'),
        error: () => {
          // o erro já aparece como toast pelo errorInterceptor
        },
      });
  }
}
