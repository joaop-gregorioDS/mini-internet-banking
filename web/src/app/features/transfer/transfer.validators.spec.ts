import { FormControl } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import { insufficientBalanceValidator, positiveAmountValidator } from './transfer.validators';

describe('insufficientBalanceValidator', () => {
  it('aceita valor igual ou menor que o saldo', () => {
    const control = new FormControl<number | null>(100, [insufficientBalanceValidator(() => 100)]);
    expect(control.valid).toBe(true);
  });

  it('rejeita valor maior que o saldo', () => {
    const control = new FormControl<number | null>(100.01, [insufficientBalanceValidator(() => 100)]);
    expect(control.hasError('insufficientBalance')).toBe(true);
  });

  it('não valida enquanto o saldo ainda não carregou', () => {
    const control = new FormControl<number | null>(999, [insufficientBalanceValidator(() => null)]);
    expect(control.valid).toBe(true);
  });

  it('lê o saldo no momento da validação (carregamento assíncrono)', () => {
    let balance: number | null = null;
    const control = new FormControl<number | null>(50, [insufficientBalanceValidator(() => balance)]);
    expect(control.valid).toBe(true);

    balance = 20;
    control.updateValueAndValidity();
    expect(control.hasError('insufficientBalance')).toBe(true);
  });
});

describe('positiveAmountValidator', () => {
  it('rejeita zero e negativos', () => {
    expect(new FormControl(0, [positiveAmountValidator]).hasError('positive')).toBe(true);
    expect(new FormControl(-3, [positiveAmountValidator]).hasError('positive')).toBe(true);
  });

  it('aceita valores positivos', () => {
    expect(new FormControl(0.01, [positiveAmountValidator]).valid).toBe(true);
  });
});
