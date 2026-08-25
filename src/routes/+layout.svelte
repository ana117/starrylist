<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/state';
	import { base, resolve } from '$app/paths';
	import StatSelector from '$lib/components/StatSelector.svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import { app } from '$lib/state.svelte';

	let { children } = $props();

	$effect(() => {
		const theme = app.doc.settings.theme;
		const mq = window.matchMedia('(prefers-color-scheme: dark)');
		const apply = (): void => {
			const dark = theme === 'dark' || (theme === 'system' && mq.matches);
			document.documentElement.classList.toggle('dark', dark);
		};
		apply();
		mq.addEventListener('change', apply);
		return () => mq.removeEventListener('change', apply);
	});

	type NavHref = '/' | '/categories' | '/settings';

	const nav: { href: NavHref; label: string }[] = [
		{ href: '/', label: 'Wishlists' },
		{ href: '/categories', label: 'Categories' },
		{ href: '/settings', label: 'Settings' }
	];

	const isActive = (href: NavHref): boolean => {
		const path = page.url.pathname;
		if (href === '/') return path === resolve('/') || path === base || path === `${base}/`;
		return path.startsWith(resolve(href));
	};
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Starrylist</title>
</svelte:head>

<div class="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
	<header
		class="sticky top-0 z-40 border-b border-zinc-200 bg-white backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/90"
	>
		<div class="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
			<a href={resolve('/')} class="flex items-center gap-2 text-base font-bold tracking-tight">
				<span aria-hidden="true">✦</span>
				Starrylist
			</a>
			<nav class="flex items-center gap-1" aria-label="Main">
				{#each nav as item (item.href)}
					<a
						href={resolve(item.href)}
						class="rounded-lg px-3 py-1.5 text-sm font-medium transition-colors {isActive(item.href)
							? 'bg-indigo-50 text-indigo-700'
							: 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800 dark:hover:text-zinc-100'}"
						aria-current={isActive(item.href) ? 'page' : undefined}
					>
						{item.label}
					</a>
				{/each}
			</nav>
			<div class="ml-auto flex items-center gap-3">
				<div class="flex items-center gap-2">
					<span class="text-xs font-medium tracking-wide text-zinc-400 uppercase dark:text-zinc-500"
						>Price</span
					>
					<StatSelector />
				</div>
				<ThemeToggle />
			</div>
		</div>
	</header>

	{#if app.quarantined}
		<div
			class="border-b border-amber-200 bg-amber-50 px-4 py-2 dark:border-amber-900 dark:bg-amber-950/30"
		>
			<p class="mx-auto max-w-5xl text-sm text-amber-800 dark:text-amber-300">
				Stored data could not be loaded (corrupt or from a newer version). It is kept untouched on
				this device; nothing will be saved until you import a valid snapshot from Settings.
			</p>
		</div>
	{/if}

	<main class="mx-auto max-w-5xl px-4 py-8">
		{@render children()}
	</main>
</div>
