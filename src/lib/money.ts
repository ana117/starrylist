import type { NumberFormat, Settings } from './domain';

const localeFor: Record<NumberFormat, string | undefined> = {
	system: undefined,
	english: 'en-US',
	indonesian: 'id-ID'
};

export function formatMoney(amount: number, settings: Settings): string {
	try {
		return new Intl.NumberFormat(localeFor[settings.numberFormat], {
			style: 'currency',
			currency: settings.currency
		}).format(amount);
	} catch {
		return `${settings.currency} ${amount.toFixed(2)}`;
	}
}

export function isValidCurrency(code: string): boolean {
	try {
		new Intl.NumberFormat(undefined, { style: 'currency', currency: code });
		return true;
	} catch {
		return false;
	}
}
