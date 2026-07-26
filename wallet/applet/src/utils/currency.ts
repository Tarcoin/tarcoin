export interface FiatCurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  rateVsUsd: number;
  flag: string;
}

export const FIAT_CURRENCIES: FiatCurrencyConfig[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar', rateVsUsd: 1.0, flag: '🇺🇸' },
  { code: 'EUR', symbol: '€', name: 'Euro', rateVsUsd: 0.92, flag: '🇪🇺' },
  { code: 'GBP', symbol: '£', name: 'British Pound', rateVsUsd: 0.78, flag: '🇬🇧' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', rateVsUsd: 155.0, flag: '🇯🇵' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', rateVsUsd: 1.38, flag: '🇨🇦' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', rateVsUsd: 1.52, flag: '🇦🇺' },
  { code: 'CHF', symbol: 'CHF ', name: 'Swiss Franc', rateVsUsd: 0.89, flag: '🇨🇭' },
];

export function getFiatConfig(code: string): FiatCurrencyConfig {
  return FIAT_CURRENCIES.find((c) => c.code === code) || FIAT_CURRENCIES[0];
}

export function formatFiatAmount(
  amountUsd: number,
  currencyCode: string
): string {
  const config = getFiatConfig(currencyCode);
  const converted = amountUsd * config.rateVsUsd;

  if (currencyCode === 'JPY') {
    return `${config.symbol}${Math.round(converted).toLocaleString('en-US')} ${config.code}`;
  }

  return `${config.symbol}${converted.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${config.code}`;
}

export function formatTarToFiat(
  amountTar: number,
  tarPriceUsd: number,
  currencyCode: string
): string {
  const amountUsd = amountTar * tarPriceUsd;
  return formatFiatAmount(amountUsd, currencyCode);
}
