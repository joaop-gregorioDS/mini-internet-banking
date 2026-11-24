import { HttpErrorResponse } from '@angular/common/http';
import { describe, expect, it } from 'vitest';
import { describeHttpError } from './error.interceptor';

const httpError = (status: number, error: unknown) =>
  new HttpErrorResponse({ status, statusText: '', error, url: '/api/x' });

describe('describeHttpError', () => {
  it('explica quando não há conexão com o servidor', () => {
    expect(describeHttpError(httpError(0, null))).toContain('Não foi possível conectar');
  });

  it('mostra a primeira mensagem de validação quando existe', () => {
    const error = {
      title: 'Dados inválidos',
      errors: { Email: ['E-mail inválido.'], Password: ['Senha curta.'] },
    };
    expect(describeHttpError(httpError(400, error))).toBe('E-mail inválido.');
  });

  it('usa o detail do ProblemDetails quando não há validação', () => {
    expect(
      describeHttpError(httpError(409, { title: 'Conflito', detail: 'E-mail já cadastrado.' })),
    ).toBe('E-mail já cadastrado.');
  });

  it('cai para o title e, por fim, para uma mensagem genérica', () => {
    expect(describeHttpError(httpError(500, { title: 'Erro interno' }))).toBe('Erro interno');
    expect(describeHttpError(httpError(500, 'texto qualquer'))).toBe('Ocorreu um erro inesperado.');
  });
});
