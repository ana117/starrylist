<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import ConfirmModal from '$lib/components/ConfirmModal.svelte';
	import FieldInput from '$lib/components/FieldInput.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import { activeFields } from '$lib/domain';
	import { categoryPath, flattenCategories } from '$lib/categories';
	import { formatMoney } from '$lib/money';
	import { app } from '$lib/state.svelte';
	import { itemContribution, itemTotal, wishlistTotal } from '$lib/stats';

	type SortMode = 'manual' | 'name' | 'total' | 'category';

	const sortLabels: Record<SortMode, string> = {
		manual: 'Manual order',
		name: 'Name',
		total: 'Total contribution',
		category: 'Category'
	};

	let sortMode = $state<SortMode>('manual');
	let draggingId = $state<string | null>(null);
	let newItemName = $state('');

	let editingItemId = $state<string | null>(null);
	let copyTarget = $state('');
	let deletingItemId = $state<string | null>(null);

	const wishlist = $derived(app.doc.wishlists.find((w) => w.id === page.params.id));

	const visibleItems = $derived.by(() => {
		if (!wishlist) return [];
		const stat = app.doc.settings.stat;
		const items = [...wishlist.items];
		switch (sortMode) {
			case 'name':
				return items.sort((a, b) => a.name.localeCompare(b.name));
			case 'total':
				return items.sort((a, b) => itemContribution(b, stat) - itemContribution(a, stat));
			case 'category':
				return items.sort((a, b) =>
					categoryPath(app.doc.categories, a.categoryId).localeCompare(
						categoryPath(app.doc.categories, b.categoryId)
					)
				);
			default:
				return items;
		}
	});

	const editingItem = $derived(wishlist?.items.find((i) => i.id === editingItemId) ?? null);

	const flatCategories = $derived(flattenCategories(app.doc.categories));
	const editingCategory = $derived(
		editingItem?.categoryId
			? (app.doc.categories.find((c) => c.id === editingItem.categoryId) ?? null)
			: null
	);
	const editingFields = $derived(editingCategory ? activeFields(editingCategory) : []);

	function addItem(): void {
		if (!wishlist || !newItemName.trim()) return;
		app.createItem(wishlist.id, newItemName.trim());
		newItemName = '';
	}

	function dropOn(targetId: string): void {
		if (!draggingId || draggingId === targetId || !wishlist || sortMode !== 'manual') return;
		const ids = wishlist.items.map((i) => i.id);
		const from = ids.indexOf(draggingId);
		const to = ids.indexOf(targetId);
		if (from === -1 || to === -1) return;
		ids.splice(to, 0, ...ids.splice(from, 1));
		app.reorderItems(wishlist.id, ids);
		draggingId = null;
	}

	function closeEditor(): void {
		editingItemId = null;
		copyTarget = '';
	}
</script>

{#if !wishlist}
	<div class="rounded-xl border border-dashed border-zinc-300 bg-white p-10 text-center">
		<p class="text-sm text-zinc-500">This wishlist doesn't exist anymore.</p>
		<a
			href={resolve('/')}
			class="mt-2 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-700"
			>← Back to wishlists</a
		>
	</div>
{:else}
	{@const stat = app.doc.settings.stat}
	{@const currency = app.doc.settings.currency}

	<div class="mb-6 flex flex-wrap items-start justify-between gap-4">
		<div class="flex items-center gap-3">
			<span
				class="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-2xl"
				style="background-color: {wishlist.color ?? '#e4e4e7'}33"
			>
				{wishlist.emoji ?? '☆'}
			</span>
			<div>
				<h1 class="text-2xl font-bold tracking-tight">{wishlist.name}</h1>
				<p class="text-xs text-zinc-500">
					{wishlist.items.length} items · sorted by {sortLabels[sortMode].toLowerCase()}
				</p>
			</div>
		</div>
		<div class="text-right">
			<p class="text-xs font-medium tracking-wide text-zinc-400 uppercase">Total ({stat})</p>
			<p class="text-3xl font-bold tracking-tight text-indigo-700 tabular-nums">
				{formatMoney(wishlistTotal(wishlist, stat), currency)}
			</p>
		</div>
	</div>

	<form
		class="mb-6 flex gap-2"
		onsubmit={(e) => {
			e.preventDefault();
			addItem();
		}}
	>
		<input
			type="text"
			class="grow rounded-lg border-zinc-200 text-sm"
			placeholder="Add an item — just a name is enough…"
			bind:value={newItemName}
		/>
		<button
			type="submit"
			class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-40"
			disabled={!newItemName.trim()}
		>
			Add item
		</button>
	</form>

	<div class="mb-3 flex justify-end">
		<label class="flex items-center gap-2 text-xs font-medium text-zinc-500">
			Sort
			<select class="rounded-lg border-zinc-200 py-1 text-xs" bind:value={sortMode}>
				{#each Object.entries(sortLabels) as [mode, label] (mode)}
					<option value={mode}>{label}</option>
				{/each}
			</select>
		</label>
	</div>

	{#if wishlist.items.length === 0}
		<div class="rounded-xl border border-dashed border-zinc-300 bg-white p-10 text-center">
			<p class="text-sm font-medium text-zinc-700">Nothing here yet.</p>
			<p class="mt-1 text-sm text-zinc-400">Add your first item above.</p>
		</div>
	{:else}
		<ul class="space-y-2">
			{#each visibleItems as item (item.id)}
				{@const figure = itemTotal(item, stat)}
				<li
					class="group flex items-center gap-3 rounded-xl border bg-white px-4 py-3 transition-colors {item.included
						? 'border-zinc-200'
						: 'border-dashed border-zinc-300 opacity-60'} {draggingId === item.id
						? 'ring-2 ring-indigo-400'
						: ''}"
					ondragstart={(e) => {
						draggingId = item.id;
						e.dataTransfer?.setData('text/plain', item.id);
					}}
					ondragover={(e) => e.preventDefault()}
					ondrop={(e) => {
						e.preventDefault();
						dropOn(item.id);
					}}
					draggable={sortMode === 'manual'}
				>
					{#if sortMode === 'manual'}
						<span
							class="cursor-grab text-sm leading-none text-zinc-300 select-none group-hover:text-zinc-500"
							title="Drag to reorder"
						>
							⠿
						</span>
					{/if}

					<input
						type="checkbox"
						class="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
						checked={item.included}
						aria-label="Include {item.name} in total"
						onchange={(e) =>
							app.updateItem(wishlist.id, item.id, {
								included: e.currentTarget.checked
							})}
					/>

					<button
						type="button"
						class="min-w-0 grow text-left"
						onclick={() => (editingItemId = item.id)}
					>
						<span
							class="block truncate text-sm font-medium {item.included
								? ''
								: 'line-through decoration-zinc-400'}"
						>
							{item.name}
						</span>
						<span class="mt-0.5 block truncate text-xs text-zinc-400">
							{#if item.quantity !== 1}×{item.quantity} ·
							{/if}{categoryPath(app.doc.categories, item.categoryId) || 'Uncategorized'}
						</span>
					</button>

					<span class="shrink-0 text-right">
						{#if figure > 0}
							<span class="block text-sm font-semibold tabular-nums">
								{formatMoney(figure, currency)}
							</span>
						{:else}
							<span class="block text-sm font-semibold text-zinc-300 tabular-nums">—</span>
						{/if}
					</span>

					<span class="hidden w-28 shrink-0 text-right text-xs text-zinc-400 tabular-nums sm:block">
						{item.included ? formatMoney(itemContribution(item, stat), currency) : 'excluded'}
					</span>

					<button
						type="button"
						class="shrink-0 rounded-md p-1.5 text-xs text-zinc-300 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-600"
						aria-label="Delete {item.name}"
						onclick={() => (deletingItemId = item.id)}
					>
						🗑
					</button>
				</li>
			{/each}
		</ul>
	{/if}

	<p class="mt-6">
		<a href={resolve('/')} class="text-sm font-medium text-indigo-600 hover:text-indigo-700"
			>← All wishlists</a
		>
	</p>

	<Modal open={editingItem !== null} title="Edit item" onclose={closeEditor} wide>
		{#if editingItem}
			<div class="space-y-5">
				<div class="flex gap-3">
					<label class="grow">
						<span class="mb-1 block text-xs font-medium text-zinc-500">Name</span>
						<input
							type="text"
							class="w-full rounded-lg border-zinc-200 text-sm"
							value={editingItem.name}
							onchange={(e) =>
								app.updateItem(wishlist.id, editingItem.id, { name: e.currentTarget.value })}
						/>
					</label>
					<label class="w-24">
						<span class="mb-1 block text-xs font-medium text-zinc-500">Quantity</span>
						<input
							type="number"
							min="1"
							step="1"
							class="w-full rounded-lg border-zinc-200 text-sm"
							value={editingItem.quantity}
							onchange={(e) =>
								app.updateItem(wishlist.id, editingItem.id, {
									quantity: Number(e.currentTarget.value)
								})}
						/>
					</label>
				</div>

				<label class="block">
					<span class="mb-1 block text-xs font-medium text-zinc-500">Category</span>
					<select
						class="w-full rounded-lg border-zinc-200 text-sm"
						value={editingItem.categoryId ?? ''}
						onchange={(e) =>
							app.updateItem(wishlist.id, editingItem.id, { categoryId: e.currentTarget.value })}
					>
						<option value="">Uncategorized</option>
						{#each flatCategories as flat (flat.category.id)}
							<option value={flat.category.id}>{flat.path}</option>
						{/each}
					</select>
				</label>

				<section>
					<h3 class="mb-2 text-xs font-semibold tracking-wide text-zinc-400 uppercase">Prices</h3>
					{#if editingItem.prices.length === 0}
						<p class="mb-2 text-xs text-zinc-400">No prices yet — bare amounts, no link needed.</p>
					{/if}
					<ul class="space-y-2">
						{#each editingItem.prices as price (price.id)}
							<li class="flex items-center gap-2">
								<input
									type="number"
									min="0"
									step="0.01"
									class="w-32 rounded-lg border-zinc-200 text-sm tabular-nums"
									value={price.amount}
									aria-label="Price amount"
									onchange={(e) =>
										app.updatePrice(wishlist.id, editingItem.id, price.id, {
											amount: Number(e.currentTarget.value)
										})}
								/>
								<button
									type="button"
									class="rounded-md p-1 text-xs text-zinc-300 hover:bg-red-50 hover:text-red-600"
									aria-label="Remove price"
									onclick={() => app.removePrice(wishlist.id, editingItem.id, price.id)}
								>
									✕
								</button>
							</li>
						{/each}
					</ul>
					<button
						type="button"
						class="mt-2 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
						onclick={() => app.addPrice(wishlist.id, editingItem.id, 0)}
					>
						+ Add price
					</button>
				</section>

				<section>
					<h3 class="mb-2 text-xs font-semibold tracking-wide text-zinc-400 uppercase">Links</h3>
					{#if editingItem.links.length === 0}
						<p class="mb-2 text-xs text-zinc-400">
							Bare links are fine — labels and price references are optional.
						</p>
					{/if}
					<ul class="space-y-2">
						{#each editingItem.links as link (link.id)}
							<li class="flex flex-wrap items-center gap-2 rounded-lg bg-zinc-50 p-2">
								{#if link.label}
									<span
										class="max-w-24 truncate rounded bg-white px-1.5 py-0.5 text-[11px] font-semibold text-zinc-600 ring-1 ring-zinc-200"
										title={link.label}
									>
										{link.label}
									</span>
								{/if}
								<input
									type="url"
									class="min-w-40 grow basis-52 rounded-lg border-zinc-200 text-xs"
									value={link.url}
									placeholder="https://…"
									aria-label="Link URL"
									onchange={(e) =>
										app.updateLink(wishlist.id, editingItem.id, link.id, {
											url: e.currentTarget.value
										})}
								/>
								<input
									type="text"
									class="w-32 rounded-lg border-zinc-200 text-xs"
									value={link.label ?? ''}
									placeholder="Label (shop)"
									aria-label="Link label"
									onchange={(e) =>
										app.updateLink(wishlist.id, editingItem.id, link.id, {
											label: e.currentTarget.value
										})}
								/>
								<select
									class="rounded-lg border-zinc-200 py-1 text-xs"
									value={link.priceId ?? ''}
									aria-label="Linked price"
									onchange={(e) =>
										app.updateLink(wishlist.id, editingItem.id, link.id, {
											priceId: e.currentTarget.value || undefined
										})}
								>
									<option value="">No price ref</option>
									{#each editingItem.prices as price (price.id)}
										<option value={price.id}>{formatMoney(price.amount, currency)}</option>
									{/each}
								</select>
								<a
									href={link.url}
									target="_blank"
									rel="noopener noreferrer"
									class="rounded-md p-1 text-xs text-zinc-400 hover:text-indigo-600"
									aria-label="Open link"
								>
									↗
								</a>
								<button
									type="button"
									class="rounded-md p-1 text-xs text-zinc-300 hover:bg-red-50 hover:text-red-600"
									aria-label="Remove link"
									onclick={() => app.removeLink(wishlist.id, editingItem.id, link.id)}
								>
									✕
								</button>
							</li>
						{/each}
					</ul>
					<button
						type="button"
						class="mt-2 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
						onclick={() => app.addLink(wishlist.id, editingItem.id, '')}
					>
						+ Add link
					</button>
				</section>

				<section>
					<h3 class="mb-2 text-xs font-semibold tracking-wide text-zinc-400 uppercase">
						Custom values {editingCategory ? `— ${editingCategory.name}` : ''}
					</h3>
					{#if editingFields.length === 0}
						<p class="text-xs text-zinc-400">
							{editingCategory
								? 'This category defines no custom fields.'
								: 'Pick a category to see its custom fields.'}
						</p>
					{:else}
						<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
							{#each editingFields as field (field.id)}
								<FieldInput
									{field}
									value={editingItem.values[field.id]}
									onchange={(value) =>
										app.setCustomValue(wishlist.id, editingItem.id, field.id, value)}
								/>
							{/each}
						</div>
					{/if}
				</section>

				<footer class="flex flex-wrap items-center gap-2 border-t border-zinc-200 pt-4">
					<button
						type="button"
						class="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
						onclick={() => app.duplicateItem(wishlist.id, editingItem.id)}
					>
						Duplicate
					</button>
					<div class="flex items-center gap-1.5">
						<select class="rounded-lg border-zinc-200 py-1.5 text-xs" bind:value={copyTarget}>
							<option value="">Copy to wishlist…</option>
							{#each app.doc.wishlists.filter((w) => w.id !== wishlist.id) as w (w.id)}
								<option value={w.id}>{w.name}</option>
							{/each}
						</select>
						<button
							type="button"
							class="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-40"
							disabled={!copyTarget}
							onclick={() => {
								app.copyItemToWishlist(wishlist.id, editingItem.id, copyTarget);
								closeEditor();
							}}
						>
							Copy
						</button>
					</div>
					<button
						type="button"
						class="ml-auto rounded-lg px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
						onclick={() => {
							deletingItemId = editingItem.id;
							closeEditor();
						}}
					>
						Delete item
					</button>
					<button
						type="button"
						class="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
						onclick={closeEditor}
					>
						Done
					</button>
				</footer>
			</div>
		{/if}
	</Modal>

	<ConfirmModal
		open={deletingItemId !== null}
		title="Delete item"
		message="'{wishlist.items.find((i) => i.id === deletingItemId)
			?.name}' will be permanently removed."
		confirmLabel="Delete item"
		onconfirm={() => {
			if (deletingItemId) app.deleteItem(wishlist.id, deletingItemId);
			deletingItemId = null;
		}}
		oncancel={() => (deletingItemId = null)}
	/>
{/if}
