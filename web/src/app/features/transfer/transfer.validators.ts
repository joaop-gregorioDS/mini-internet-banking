import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Valor não pode passar do saldo disponível. O saldo é lido no momento da validação,
 * porque ele carrega de forma assíncrona depois que o formulário é criado.
 */
export function insufficientBalanceValidator(getBalance: () => number | null): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const amount = control.value as number | null;
    const balance = getBalance();
    if (amount === null || amount === undefined || balance === null) {
      return null;
    }
    return amount > balance ? { insufficientBalance: true } : null;
  };
}

/** Valor precisa ser maior que zero (o campo começa vazio, então zero também é inválido). */
export function positiveAmountValidator(control: AbstractControl): ValidationErrors | null {
  const amount = control.value as number | null;
  if (amount === null || amount === undefined) {
    return null; // obrigatoriedade é tratada pelo Validators.required
  }
  return amount > 0 ? null : { positive: true };
}
