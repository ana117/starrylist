<script lang="ts">
	import { resolve } from '$app/paths';
	import ConfirmModal from '$lib/components/ConfirmModal.svelte';
	import ColorPicker from '$lib/components/ColorPicker.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import type { Wishlist } from '$lib/domain';
	import { formatMoney } from '$lib/money';
	import { app } from '$lib/state.svelte';
	import { wishlistTotal } from '$lib/stats';

	const colors = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

	let newName = $state('');
	let newEmoji = $state('');
	let newColor = $state(colors[0]);

	let editing = $state<Wishlist | null>(null);
	let editName = $state('');
	let editEmoji = $state('');
	let editColor = $state('');

	let deleting = $state<Wishlist | null>(null);

	function create(): void {
		const name = newName.trim();
		if (!name) return;
		app.createWishlist(name, newEmoji.trim() || undefined, newColor || undefined);
		newName = '';
		newEmoji = '';
		newColor = colors[0];
	}

	function openEdit(wishlist: Wishlist): void {
		editing = wishlist;
		editName = wishlist.name;
		editEmoji = wishlist.emoji ?? '';
		editColor = wishlist.color ?? '';
	}

	function saveEdit(): void {
		if (!editing) return;
		app.updateWishlist(editing.id, {
			name: editName.trim() || editing.name,
			emoji: editEmoji.trim(),
			color: editColor
		});
		editing = null;
	}
</script>

<div class="mb-8 flex items-end justify-between">
	<div>
		<h1 class="text-2xl font-bold tracking-tight">Wishlists</h1>
		<p class="mt-1 text-sm text-zinc-500">
			Everything you intend to acquire, one Wishlist at a time.
		</p>
	</div>
</div>

{#if app.doc.wishlists.length === 0}
	<div
		class="rounded-xl border border-dashed border-zinc-300 bg-white p-10 text-center dark:border-zinc-700 dark:bg-zinc-900"
	>
		<p class="text-sm font-medium text-zinc-700">No wishlists yet.</p>
		<p class="mt-1 text-sm text-zinc-400">Create your first one below.</p>
	</div>
{:else}
	<ul class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
		{#each app.doc.wishlists as wishlist (wishlist.id)}
			{@const total = wishlistTotal(wishlist, app.doc.settings.stat)}
			{@const count = wishlist.items.length}
			<li>
				<a
					href={resolve('/wishlists/[id]', { id: wishlist.id })}
					class="group block h-full rounded-xl border border-zinc-200 bg-white p-5 transition-shadow hover:border-indigo-300 hover:shadow-md dark:border-zinc-700 dark:bg-zinc-900"
				>
					<div class="flex items-start justify-between gap-2">
						<span
							class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-xl"
							style="background-color: {wishlist.color ?? '#e4e4e7'}33"
						>
							{wishlist.emoji ?? '☆'}
						</span>
						<div class="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
							<button
								type="button"
								class="rounded-md p-1.5 text-xs text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
								aria-label="Edit {wishlist.name}"
								onclick={(e) => {
									e.preventDefault();
									openEdit(wishlist);
								}}
							>
								✎
							</button>
							<button
								type="button"
								class="rounded-md p-1.5 text-xs text-zinc-400 hover:bg-red-50 hover:text-red-600"
								aria-label="Delete {wishlist.name}"
								onclick={(e) => {
									e.preventDefault();
									deleting = wishlist;
								}}
							>
								🗑
							</button>
						</div>
					</div>
					<h2 class="mt-3 truncate text-base font-semibold">{wishlist.name}</h2>
					<p class="mt-0.5 text-xs text-zinc-500">
						{count}
						{count === 1 ? 'item' : 'items'}
					</p>
					<p class="mt-3 text-lg font-bold text-indigo-700 tabular-nums">
						{formatMoney(total, app.doc.settings)}
					</p>
				</a>
			</li>
		{/each}
	</ul>
{/if}

<form
	class="mt-8 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900"
	onsubmit={(e) => {
		e.preventDefault();
		create();
	}}
>
	<h2 class="text-sm font-semibold">New wishlist</h2>
	<div class="mt-3 flex flex-wrap items-end gap-3">
		<label class="block grow basis-48">
			<span class="mb-1 block text-xs font-medium text-zinc-500">Name</span>
			<input
				type="text"
				class="w-full rounded-lg border-zinc-200 text-sm dark:border-zinc-700"
				placeholder="Gaming PC, Birthday…"
				bind:value={newName}
			/>
		</label>
		<label class="block w-20">
			<span class="mb-1 block text-xs font-medium text-zinc-500">Icon</span>
			<input
				type="text"
				maxlength="4"
				class="w-full rounded-lg border-zinc-200 text-center text-sm dark:border-zinc-700"
				placeholder="☆"
				bind:value={newEmoji}
			/>
		</label>
		<div>
			<span class="mb-1 block text-xs font-medium text-zinc-500">Color</span>
			<div class="pb-1.5">
				<ColorPicker {colors} value={newColor} onpick={(c) => (newColor = c)} />
			</div>
		</div>
		<button
			type="submit"
			class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-40"
			disabled={!newName.trim()}
		>
			Create
		</button>
	</div>
</form>

<Modal open={editing !== null} title="Edit wishlist" onclose={() => (editing = null)}>
	<form
		id="edit-wishlist"
		class="space-y-4"
		onsubmit={(e) => {
			e.preventDefault();
			saveEdit();
		}}
	>
		<label class="block">
			<span class="mb-1 block text-xs font-medium text-zinc-500">Name</span>
			<input
				type="text"
				class="w-full rounded-lg border-zinc-200 text-sm dark:border-zinc-700"
				bind:value={editName}
			/>
		</label>
		<label class="block">
			<span class="mb-1 block text-xs font-medium text-zinc-500">Icon</span>
			<input
				type="text"
				maxlength="4"
				class="w-20 rounded-lg border-zinc-200 text-center text-sm dark:border-zinc-700"
				placeholder="☆"
				bind:value={editEmoji}
			/>
		</label>
		<div>
			<span class="mb-1 block text-xs font-medium text-zinc-500">Color</span>
			<ColorPicker {colors} value={editColor} onpick={(c) => (editColor = c)} />
		</div>
		<div class="flex justify-end gap-2 pt-2">
			<button
				type="button"
				class="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
				onclick={() => (editing = null)}
			>
				Cancel
			</button>
			<button
				type="submit"
				form="edit-wishlist"
				class="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700"
			>
				Save
			</button>
		</div>
	</form>
</Modal>

<ConfirmModal
	open={deleting !== null}
	title="Delete wishlist"
	message="{deleting?.name ??
		'This wishlist'} and its items will be permanently removed. This cannot be undone."
	confirmLabel="Delete wishlist"
	onconfirm={() => {
		if (deleting) app.deleteWishlist(deleting.id);
		deleting = null;
	}}
	oncancel={() => (deleting = null)}
/>
