<script lang="ts">
	import { THEMES, type Theme } from '$lib/domain';
	import { app } from '$lib/state.svelte';

	const icons: Record<Theme, string> = {
		light:
			'M12 4v2m0 12v2m8-8h-2M6 12H4m12.07-5.07l-1.41 1.41M9.34 14.66l-1.41 1.41m0-8.14l1.41 1.41m5.32 5.32l1.41 1.41M12 9a3 3 0 100 6 3 3 0 000-6z',
		dark: 'M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z',
		system:
			'M4 5h16a1 1 0 011 1v10a1 1 0 01-1 1h-5l1 2h-1l-1-2h-4l-1 2H8l1-2H4a1 1 0 01-1-1V6a1 1 0 011-1z'
	};

	const labels: Record<Theme, string> = {
		light: 'Light theme',
		dark: 'Dark theme',
		system: 'Follow system theme'
	};
</script>

<div
	class="flex items-center rounded-lg bg-zinc-100 p-0.5 dark:bg-zinc-800"
	role="group"
	aria-label="Theme"
>
	{#each THEMES as theme (theme)}
		<button
			type="button"
			class="rounded-md p-1.5 transition-colors {app.doc.settings.theme === theme
				? 'bg-white text-indigo-700 shadow-sm dark:bg-zinc-950 dark:text-indigo-300'
				: 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'}"
			aria-label={labels[theme]}
			aria-pressed={app.doc.settings.theme === theme}
			title={labels[theme]}
			onclick={() => app.setTheme(theme)}
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="h-3.5 w-3.5"
			>
				<path d={icons[theme]} />
			</svg>
		</button>
	{/each}
</div>
