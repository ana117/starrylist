<script lang="ts">
	import Modal from '$lib/components/Modal.svelte';
	import { NUMBER_FORMATS, type NumberFormat } from '$lib/domain';
	import { isValidCurrency, formatMoney } from '$lib/money';
	import { parseSnapshot } from '$lib/snapshot';
	import { app } from '$lib/state.svelte';

	const formatLabels: Record<NumberFormat, string> = {
		system: 'System',
		english: 'Comma',
		indonesian: 'Dot'
	};

	let currencyInput = $state(app.doc.settings.currency);
	let currencyError = $state('');

	let importTarget = $state<File | null>(null);
	let importPreview = $state<ReturnType<typeof parseSnapshot> | null>(null);
	let importing = $state(false);
	let importMessage = $state('');
	let importError = $state('');

	function saveCurrency(): void {
		const code = currencyInput.trim().toUpperCase();
		if (!isValidCurrency(code)) {
			currencyError = 'Not a recognized currency code (e.g. USD, EUR, JPY).';
			return;
		}
		currencyError = '';
		app.setCurrency(code);
		currencyInput = code;
	}

	async function pickImport(event: Event): Promise<void> {
		const files = (event.currentTarget as HTMLInputElement).files;
		const file = files?.[0] ?? null;
		if (!file) return;
		importTarget = file;
		importError = '';
		importMessage = '';
		try {
			importPreview = parseSnapshot(await file.text());
		} catch {
			importPreview = { ok: false, error: 'Could not read the file.' };
		}
		importing = true;
	}

	function confirmImport(): void {
		if (!importTarget) {
			importing = false;
			return;
		}
		importTarget
			.text()
			.then((text) => {
				const result = app.importSnapshot(text);
				if (result.ok) {
					importMessage = `Imported ${result.wishlists} wishlists, ${result.items} items, ${result.categories} categories.`;
					currencyInput = app.doc.settings.currency;
				} else {
					importError = result.error;
				}
			})
			.finally(() => {
				importing = false;
				importPreview = null;
				importTarget = null;
			});
	}

	function exportSnapshot(): void {
		const today = new Date();
		const stamp = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
			today.getDate()
		).padStart(2, '0')}`;
		const blob = new Blob([app.exportSnapshotText()], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const anchor = document.createElement('a');
		anchor.href = url;
		anchor.download = `starrylist-export-${stamp}.json`;
		anchor.click();
		URL.revokeObjectURL(url);
	}
</script>

<div class="mb-8">
	<h1 class="text-2xl font-bold tracking-tight">Settings</h1>
	<p class="mt-1 text-sm text-zinc-500">App-wide preferences and your data's Snapshot workflow.</p>
</div>

<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
	<section
		class="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900"
	>
		<h2 class="text-sm font-semibold">Currency</h2>
		<p class="mt-1 text-xs text-zinc-500">
			One app-level currency. Every Price, figure, and Total is displayed with it.
		</p>
		<div class="mt-3 flex items-end gap-2">
			<label class="block w-28">
				<span class="mb-1 block text-xs font-medium text-zinc-500">Code</span>
				<input
					type="text"
					class="w-full rounded-lg border-zinc-200 text-sm uppercase dark:border-zinc-700"
					maxlength="3"
					bind:value={currencyInput}
				/>
			</label>
			<button
				type="button"
				class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
				onclick={saveCurrency}
			>
				Save
			</button>
		</div>
		{#if currencyError}
			<p class="mt-2 text-xs text-red-600">{currencyError}</p>
		{:else}
			<p class="mt-2 text-xs text-zinc-400">
				Preview: {formatMoney(1234567.89, app.doc.settings)}
			</p>
		{/if}

		<div class="mt-5 border-t border-zinc-100 pt-4 dark:border-zinc-800">
			<h2 class="text-sm font-semibold">Number format</h2>
			<p class="mt-1 text-xs text-zinc-500">
				How amounts are punctuated. Dot: 1.234,56 · Comma: 1,234.56.
			</p>
			<div class="mt-3 flex items-end gap-2">
				<label class="block w-44">
					<span class="mb-1 block text-xs font-medium text-zinc-500">Style</span>
					<select
						class="w-full rounded-lg border-zinc-200 text-sm dark:border-zinc-700"
						value={app.doc.settings.numberFormat}
						onchange={(e) => app.setNumberFormat(e.currentTarget.value as NumberFormat)}
					>
						{#each NUMBER_FORMATS as format (format)}
							<option value={format}>{formatLabels[format]}</option>
						{/each}
					</select>
				</label>
			</div>
		</div>
	</section>

	<section
		class="rounded-xl border border-zinc-200 bg-white p-5 lg:col-span-2 dark:border-zinc-700 dark:bg-zinc-900"
	>
		<h2 class="text-sm font-semibold">Snapshots</h2>
		<p class="mt-1 text-xs text-zinc-500">
			A Snapshot is a full JSON export of everything. Importing one replaces all current data —
			export regularly, because what you export is all there is.
		</p>

		<div class="mt-4 flex flex-wrap items-center gap-3">
			<button
				type="button"
				class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
				onclick={exportSnapshot}
			>
				Export snapshot
			</button>

			<label
				class="cursor-pointer rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-transparent dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
			>
				Choose file to import…
				<input type="file" accept="application/json,.json" class="sr-only" onchange={pickImport} />
			</label>
		</div>

		{#if importMessage}
			<p
				class="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
			>
				{importMessage}
			</p>
		{/if}
		{#if importError}
			<p
				class="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-300"
			>
				{importError}
			</p>
		{/if}
	</section>
</div>

<Modal
	open={importing && importPreview !== null}
	title="Import snapshot"
	onclose={() => (importing = false)}
>
	{#if importPreview?.ok}
		<p class="text-sm leading-relaxed text-zinc-600">
			This snapshot contains
			<span class="font-semibold text-zinc-900 dark:text-zinc-100"
				>{importPreview.counts.wishlists} wishlists</span
			>,
			<span class="font-semibold text-zinc-900 dark:text-zinc-100"
				>{importPreview.counts.items} items</span
			>, and
			<span class="font-semibold text-zinc-900 dark:text-zinc-100"
				>{importPreview.counts.categories} categories</span
			>.
		</p>
		<p class="mt-2 text-sm font-medium text-red-600">
			Importing replaces everything currently stored — this cannot be undone.
		</p>
		<div class="mt-5 flex justify-end gap-2">
			<button
				type="button"
				class="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-transparent dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
				onclick={() => (importing = false)}
			>
				Cancel
			</button>
			<button
				type="button"
				class="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-700"
				onclick={confirmImport}
			>
				Replace everything
			</button>
		</div>
	{:else if importPreview && !importPreview.ok}
		<p class="text-sm text-red-600">{importPreview.error}</p>
		<div class="mt-5 flex justify-end">
			<button
				type="button"
				class="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-transparent dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
				onclick={() => (importing = false)}
			>
				Close
			</button>
		</div>
	{/if}
</Modal>

<svelte:head><title>Settings · Starrylist</title></svelte:head>
