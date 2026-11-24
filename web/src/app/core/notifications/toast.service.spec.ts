import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let toasts: ToastService;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({});
    toasts = TestBed.inject(ToastService);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('adiciona mensagens com o tipo informado', () => {
    toasts.error('Falhou');
    toasts.success('Ok');

    expect(toasts.toasts().map((t) => [t.kind, t.message])).toEqual([
      ['error', 'Falhou'],
      ['success', 'Ok'],
    ]);
  });

  it('remove o toast automaticamente depois do tempo', () => {
    toasts.show('Rápido', 'info', 1000);
    expect(toasts.toasts().length).toBe(1);

    vi.advanceTimersByTime(1000);
    expect(toasts.toasts().length).toBe(0);
  });

  it('permite fechar um toast manualmente sem afetar os outros', () => {
    toasts.error('A');
    toasts.error('B');
    const [first] = toasts.toasts();

    toasts.dismiss(first.id);

    expect(toasts.toasts().map((t) => t.message)).toEqual(['B']);
  });
});
