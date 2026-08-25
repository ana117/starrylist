<script lang="ts">
	import { STATS } from '$lib/domain';
	import { app } from '$lib/state.svelte';

	const labels: Record<string, string> = {
		low: 'Lowest',
		average: 'Average',
		high: 'Highest'
	};
</script>

<div class="flex items-center rounded-lg bg-zinc-100 p-0.5" role="group" aria-label="Price stat">
	{#each STATS as stat (stat)}
		<button
			type="button"
			class="rounded-md px-2.5 py-1 text-xs font-semibold transition-colors {app.doc.settings
				.stat === stat
				? 'bg-white text-indigo-700 shadow-sm'
				: 'text-zinc-500 hover:text-zinc-800'}"
			onclick={() => app.setStat(stat)}
		>
			{labels[stat]}
		</button>
	{/each}
</div>
