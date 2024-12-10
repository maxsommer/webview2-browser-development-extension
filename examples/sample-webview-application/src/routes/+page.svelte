<script lang="ts">
	import { JSONEditor, type JSONContent } from 'svelte-jsoneditor';

	let jsonContent: JSONContent = $state<JSONContent>({
		json: {}
	});
	let events: { message: unknown; datetime: Date }[] = $state([]);
	let eventsOrdered = $derived.by(() => [...events].reverse());
	let status = $state<'ok' | 'error'>('error');
	$effect(() => {
		const intervalId = setInterval(() => {
			try {
				window.chrome.webview.addEventListener('message', (event) => {
					events = [...events, { message: event.data, datetime: new Date() }];
				});
				clearInterval(intervalId);
				status = 'ok';
			} catch (error) {
				console.error(error);
				console.log('Retrying in 1000ms...');
				status = 'error';
			}
		}, 1000);

		return () => {
			clearInterval(intervalId);
		};
	});

	function handleSendMessage() {
		window.chrome.webview.postMessage(jsonContent.json ?? JSON.parse((jsonContent as any).text));
	}
</script>

<h1>Sample Webview2 application</h1>

<p>This is a sample webview2 application.</p>

{#if status === 'ok'}
	<p>✅ Ready to receive events from webview2 host.</p>
{:else}
	<p>❌ Not ready to receive events from webview2 host, missing APIs.</p>
{/if}

<br />

<div class="my-json-editor jse-theme-dark">
	<JSONEditor bind:content={jsonContent} />
</div>
<button onclick={handleSendMessage}>Send message to webview2 host</button>

<h2>Received messages</h2>

<div class="events">
	{#each eventsOrdered as event}
		<small>{event.datetime.toLocaleString()}</small>
		<pre><code>{JSON.stringify(event.message, null, 2)}</code></pre>
	{/each}

	{#if eventsOrdered.length === 0}
		<p>No events received yet.</p>
	{/if}
</div>

<style>
	/* load one or multiple themes */
	@import 'svelte-jsoneditor/themes/jse-theme-dark.css';

	.events {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
</style>
