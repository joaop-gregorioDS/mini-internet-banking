import { describe, expect, it } from 'vitest';
import { amountFromDigits, signedAmount } from './money';
import { parseApiDate } from './date';
import { buildStatementParams } from '../../core/api/finance-api.service';
import { computeBars } from '../components/category-bars.component';

describe('amountFromDigits', () => {
  it('entra pela direita como em caixa eletrônico', () => {
    expect(amountFromDigits('5')).toEqual({ value: 0.05, display: '0,05' });
    expect(amountFromDigits('1234')).toEqual({ value: 12.34, display: '12,34' });
    expect(amountFromDigits('123456789')).toEqual({ value: 1234567.89, display: '1.234.567,89' });
  });

  it('ignora caracteres que não são dígitos', () => {
    expect(amountFromDigits('R$ 1.000,50').value).toBe(1000.5);
  });

  it('campo vazio vira valor nulo na exibição', () => {
    expect(amountFromDigits('')).toEqual({ value: 0, display: '' });
  });
});

describe('signedAmount', () => {
  it('usa sinal de + para crédito e - para débito', () => {
    expect(signedAmount('Credit', 10)).toBe('+ R$ 10,00');
    expect(signedAmount('Debit', 1234.5)).toBe('- R$ 1.234,50');
  });
});

describe('parseApiDate', () => {
  it('trata datas sem fuso como UTC', () => {
    expect(parseApiDate('2026-11-23T22:37:28.7').toISOString()).toBe('2026-11-23T22:37:28.700Z');
  });

  it('respeita datas que já têm fuso', () => {
    expect(parseApiDate('2026-11-23T22:37:28Z').toISOString()).toBe('2026-11-23T22:37:28.000Z');
  });
});

describe('buildStatementParams', () => {
  it('monta paginação padrão e ignora filtros vazios', () => {
    const params = buildStatementParams({ from: null, to: '', category: null });
    expect(params.get('page')).toBe('1');
    expect(params.get('pageSize')).toBe('10');
    expect(params.has('from')).toBe(false);
    expect(params.has('to')).toBe(false);
    expect(params.has('category')).toBe(false);
  });

  it('inclui período e categoria quando informados', () => {
    const params = buildStatementParams({
      from: '2026-11-01',
      to: '2026-11-30',
      category: 'Food',
      page: 3,
      pageSize: 5,
    });
    expect(params.get('from')).toBe('2026-11-01');
    expect(params.get('to')).toBe('2026-11-30');
    expect(params.get('category')).toBe('Food');
    expect(params.get('page')).toBe('3');
    expect(params.get('pageSize')).toBe('5');
  });
});

describe('computeBars', () => {
  it('largura proporcional ao maior gasto', () => {
    const bars = computeBars(
      [
        { category: 'Food', total: 200 },
        { category: 'Health', total: 100 },
      ],
      520,
    );
    expect(bars[0].percent).toBe(1);
    expect(bars[1].percent).toBe(0.5);
    expect(bars[1].width * 2).toBeCloseTo(bars[0].width, 0);
    expect(bars[0].label).toBe('Alimentação');
  });

  it('lista vazia não gera barras', () => {
    expect(computeBars([], 520)).toEqual([]);
  });
});
