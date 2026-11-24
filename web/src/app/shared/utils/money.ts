const pt = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * Máscara de valor em reais: cada dígito digitado entra pela direita, como em caixas eletrônicos.
 * "1234" -> R$ 12,34 e valor 12.34.
 */
export function amountFromDigits(input: string): { value: number; display: string } {
  const digits = input.replace(/\D/g, '').slice(0, 12);
  const cents = digits === '' ? 0 : Number(digits);
  const value = cents / 100;
  return { value, display: cents === 0 && digits === '' ? '' : pt.format(value) };
}

export function formatAmount(value: number): string {
  return pt.format(value);
}

/** Converte o valor em reais para texto com sinal: "+ R$ 10,00" ou "- R$ 10,00". */
export function signedAmount(type: 'Credit' | 'Debit', amount: number): string {
  const sign = type === 'Credit' ? '+' : '-';
  return `${sign} R$ ${pt.format(amount)}`;
}
