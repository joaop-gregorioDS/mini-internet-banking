import { describe, expect, it } from 'vitest';
import { isValidCpf, maskCpf } from './cpf.validator';

describe('isValidCpf', () => {
  it.each(['111.444.777-35', '52998224725', '11144477735'])('aceita CPF válido %s', (cpf) => {
    expect(isValidCpf(cpf)).toBe(true);
  });

  it.each(['123.456.789-00', '111.111.111-11', '1234', '', '999.999.999-9'])('rejeita %s', (cpf) => {
    expect(isValidCpf(cpf)).toBe(false);
  });
});

describe('maskCpf', () => {
  it('formata enquanto o usuário digita', () => {
    expect(maskCpf('1')).toBe('1');
    expect(maskCpf('11144')).toBe('111.44');
    expect(maskCpf('11144477735')).toBe('111.444.777-35');
    expect(maskCpf('111.444.777-35999')).toBe('111.444.777-35');
  });
});
