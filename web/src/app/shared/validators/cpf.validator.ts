import { AbstractControl, ValidationErrors } from '@angular/forms';

/** Valida CPF pelos dígitos verificadores (mesma regra do back-end). */
export function isValidCpf(value: string): boolean {
  const digits = (value ?? '').replace(/\D/g, '');
  if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) {
    return false;
  }

  const check = (length: number): number => {
    let sum = 0;
    for (let i = 0; i < length; i++) {
      sum += Number(digits[i]) * (length + 1 - i);
    }
    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
  };

  return check(9) === Number(digits[9]) && check(10) === Number(digits[10]);
}

export function cpfValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value as string;
  if (!value) {
    return null; // a obrigatoriedade é tratada pelo Validators.required
  }
  return isValidCpf(value) ? null : { cpf: true };
}

/** Máscara 000.000.000-00 enquanto o usuário digita. */
export function maskCpf(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  return digits
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2');
}
