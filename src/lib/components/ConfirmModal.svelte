<script lang="ts">
	import Modal from './Modal.svelte';

	let {
		open,
		title,
		message,
		confirmLabel = 'Delete',
		danger = true,
		onconfirm,
		oncancel
	}: {
		open: boolean;
		title: string;
		message: string;
		confirmLabel?: string;
		danger?: boolean;
		onconfirm: () => void;
		oncancel: () => void;
	} = $props();
</script>

<Modal {open} {title} onclose={oncancel}>
	<p class="text-sm leading-relaxed text-zinc-600">{message}</p>
	<div class="mt-5 flex justify-end gap-2">
		<button
			type="button"
			class="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-transparent dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
			onclick={oncancel}
		>
			Cancel
		</button>
		<button
			type="button"
			class="rounded-lg px-3 py-1.5 text-sm font-semibold text-white {danger
				? 'bg-red-600 hover:bg-red-700'
				: 'bg-indigo-600 hover:bg-indigo-700'}"
			onclick={onconfirm}
		>
			{confirmLabel}
		</button>
	</div>
</Modal>
