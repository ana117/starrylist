<script lang="ts">
	let {
		colors,
		value,
		onpick
	}: {
		colors: string[];
		value: string;
		onpick: (color: string) => void;
	} = $props();
</script>

<div class="flex gap-1.5">
	{#each colors as color (color)}
		<button
			type="button"
			class="h-6 w-6 rounded-full ring-offset-2 transition-all {value === color
				? 'ring-2 ring-zinc-800'
				: ''}"
			style="background-color: {color}"
			aria-label="Choose color {color}"
			onclick={() => onpick(color)}
		></button>
	{/each}
</div>
