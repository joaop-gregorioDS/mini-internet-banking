/**
 * A API grava datas em UTC, mas serializa sem o sufixo de fuso (ex.: "2026-11-23T22:37:28.7").
 * Sem o "Z", o navegador lê como hora local. Esta função força a leitura como UTC.
 */
export function parseApiDate(value: string): Date {
  const hasOffset = /(Z|[+-]\d{2}:?\d{2})$/i.test(value);
  return new Date(hasOffset ? value : `${value}Z`);
}
