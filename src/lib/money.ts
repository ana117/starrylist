export function formatMoney(amount: number, currency: string): string {
	try {
		return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount);
	} catch {
		return `${currency} ${amount.toFixed(2)}`;
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
