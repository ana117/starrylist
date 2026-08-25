<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		open,
		title,
		onclose,
		children,
		wide = false
	}: {
		open: boolean;
		title: string;
		onclose: () => void;
		children: Snippet;
		wide?: boolean;
	} = $props();

	function onkeydown(event: KeyboardEvent): void {
		if (event.key === 'Escape' && open) onclose();
	}
</script>

<svelte:window {onkeydown} />

{#if open}
	<div class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-8">
		<button
			type="button"
			class="fixed inset-0 cursor-default bg-zinc-950/40"
			aria-label="Close dialog"
			onclick={onclose}
		></button>
		<div
			class="relative my-auto w-full rounded-xl bg-white shadow-xl ring-1 ring-zinc-950/5 dark:bg-zinc-900 {wide
				? 'max-w-2xl'
				: 'max-w-md'}"
		>
			<header
				class="flex items-center justify-between border-b border-zinc-200 px-5 py-3 dark:border-zinc-700"
			>
				<h2 class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</h2>
				<button
					type="button"
					class="rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
					aria-label="Close"
					onclick={onclose}
				>
					✕
				</button>
			</header>
			<div class="px-5 py-4">
				{@render children()}
			</div>
		</div>
	</div>
{/if}
