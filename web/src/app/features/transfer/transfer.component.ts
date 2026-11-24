import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { CATEGORIES, CATEGORY_LABELS } from '../../core/api/finance.models';
import { FinanceApi } from '../../core/api/finance-api.service';
import { ToastService } from '../../core/notifications/toast.service';
import { cpfValidator, maskCpf } from '../../shared/validators/cpf.validator';
import { amountFromDigits } from '../../shared/utils/money';
import { insufficientBalanceValidator, positiveAmountValidator } from './transfer.validators';

@Component({
  selector: 'mb-transfer',
  imports: [ReactiveFormsModule, CurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="page">
      <h1>Nova transferência</h1>
      <p class="muted">
        Saldo disponível:
        <strong>{{ balance() === null ? '…' : (balance()! | currency: 'BRL') }}</strong>
      </p>

      <form [formGroup]="form" (ngSubmit)="submit()" novalidate class="card">
        <label>
          CPF do destinatário
          <input
            formControlName="recipientCpf"
            inputmode="numeric"
            placeholder="000.000.000-00"
            (input)="onCpf($event)"
          />
        </label>
        @if (form.controls.recipientCpf.touched && form.controls.recipientCpf.hasError('cpf')) {
          <small class="error">CPF inválido.</small>
        }

        <label>
          Valor
          <input inputmode="numeric" placeholder="0,00" (input)="onAmount($event)" />
        </label>
        @if (form.controls.amount.touched && form.controls.amount.hasError('required')) {
          <small class="error">Informe o valor.</small>
        }
        @if (form.controls.amount.hasError('insufficientBalance')) {
          <small class="error">Valor maior que o saldo disponível.</small>
        }

        <label>
          Descrição
          <input
            formControlName="description"
            maxlength="140"
            placeholder="Ex.: Almoço com a família"
          />
        </label>

        <label>
          Categoria
          <select formControlName="category">
            @for (c of categories; track c) {
              <option [value]="c">{{ labels[c] }}</option>
            }
          </select>
        </label>

        <button type="submit" [disabled]="busy()">{{ busy() ? 'Enviando…' : 'Transferir' }}</button>
      </form>
    </section>
  `,
  styles: `
    .page {
      max-width: 520px;
      margin: 2rem auto;
      display: grid;
      gap: 1rem;
    }
    h1 {
      margin: 0;
      font-size: 1.6rem;
    }
    .muted {
      color: #64748b;
      margin: 0;
    }
    .card {
      background: #fff;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 2px 12px rgb(0 0 0 / 6%);
      display: grid;
      gap: 0.9rem;
    }
    label {
      display: grid;
      gap: 0.35rem;
      font-size: 0.9rem;
    }
    input,
    select {
      padding: 0.6rem 0.75rem;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font: inherit;
      background: #fff;
    }
    button {
      padding: 0.75rem;
      border: 0;
      border-radius: 8px;
      background: #0f766e;
      color: #fff;
      font: inherit;
      font-weight: 600;
      cursor: pointer;
    }
    button:disabled {
      opacity: 0.6;
      cursor: default;
    }
    .error {
      color: #b91c1c;
    }
  `,
})
export class TransferComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(FinanceApi);
  private readonly toasts = inject(ToastService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly categories = CATEGORIES.filter((c) => c !== 'Income');
  readonly labels = CATEGORY_LABELS;

  readonly balance = signal<number | null>(null);
  readonly busy = signal(false);

  readonly form = this.fb.nonNullable.group({
    recipientCpf: ['', [Validators.required, cpfValidator]],
    amount: this.fb.control<number | null>(null, [
      Validators.required,
      positiveAmountValidator,
      insufficientBalanceValidator(() => this.balance()),
    ]),
    description: ['', [Validators.required, Validators.maxLength(140)]],
    category: ['Transfer' as (typeof CATEGORIES)[number], [Validators.required]],
  });

  constructor() {
    this.loadBalance();
  }

  onCpf(event: Event): void {
    const input = event.target as HTMLInputElement;
    const masked = maskCpf(input.value);
    input.value = masked;
    this.form.controls.recipientCpf.setValue(masked);
  }

  onAmount(event: Event): void {
    const input = event.target as HTMLInputElement;
    const { value, display } = amountFromDigits(input.value);
    input.value = display;
    this.form.controls.amount.setValue(display === '' ? null : value);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { recipientCpf, amount, description, category } = this.form.getRawValue();
    this.busy.set(true);

    this.api
      .transfer({
        recipientCpf: recipientCpf.replace(/\D/g, ''),
        amount: amount!,
        description: description.trim(),
        category,
      })
      .pipe(
        finalize(() => this.busy.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (result) => {
          this.toasts.success(`Transferência enviada para ${result.recipientName}.`);
          this.balance.set(result.newBalance);
          this.form.reset({
            recipientCpf: '',
            amount: null,
            description: '',
            category: 'Transfer',
          });
          this.router.navigateByUrl('/dashboard');
        },
        error: () => {
          // o erro já aparece como toast pelo errorInterceptor
        },
      });
  }

  private loadBalance(): void {
    this.api
      .summary()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((s) => {
        this.balance.set(s.balance);
        this.form.controls.amount.updateValueAndValidity();
      });
  }
}
