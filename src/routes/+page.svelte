<script lang="ts">
	import { goto } from '$app/navigation';
	import {
		checkWebview2Apis,
		patchWebview2Apis,
		runCodeInInspectedWindow,
		sendMessageToWebview
	} from '$lib/webview.svelte';
	import { JSONEditor, type JSONContent } from 'svelte-jsoneditor';

	let jsonContent: JSONContent = $state<JSONContent>({
		json: {}
	});
	let patchSuccessful = $state(false);
	let patchError = $state<unknown | undefined>(undefined);
	let receivedMessages = $state<{ message: unknown; datetime: Date }[]>([]);
	const receivedMessagesOrdered = $derived.by(() => [...receivedMessages].reverse());

	$effect(() => {
		const handleExternalMessage = (
			message: unknown,
			sender: unknown,
			sendResponse: (msg: unknown) => void
		) => {
			receivedMessages = [...receivedMessages, { message, datetime: new Date() }];
			sendResponse({ status: 'ok' });
		};

		/**
		 * We need to check availability of webview2 APIs on the webpage continuously
		 * since the web content might be reloaded or navigated to a different page.
		 */
		const intervalId = setInterval(() => {
			checkWebview2Apis()
				.then(() => {
					patchSuccessful = true;
				})
				.catch(() => {
					patchWebview2Apis(chrome.runtime.id)
						.then(() => {
							patchSuccessful = true;
							chrome.runtime.onMessageExternal.addListener(handleExternalMessage);
						})
						.catch((exception) => {
							patchSuccessful = false;
							patchError = exception;
						});
				});
		}, 1000);
		return () => {
			clearInterval(intervalId);
			chrome.runtime.onMessageExternal.removeListener(handleExternalMessage);
		};
	});

	$effect(() => {
		if (!chrome?.devtools?.inspectedWindow) {
			goto('/nodevtools').catch(console.error);
			return;
		}
	});

	function handleSendMessageToWebview() {
		const data = jsonContent.json ?? JSON.parse((jsonContent as any).text);
		sendMessageToWebview(data)
			.then(() => {
				jsonContent = { json: {} };
			})
			.catch(() => {});
	}

	function handleClearMessages() {
		receivedMessages = [];
	}

	function handleReloadPage() {
		runCodeInInspectedWindow('location.reload()').then(() => {
			patchSuccessful = false;
			patchError = undefined;
		});
	}

	function handleReloadExtension() {
		location.reload();
	}
</script>

<nav>
	<h1>WebView2 Browser Development</h1>
	<button onclick={handleReloadExtension}>reload extension</button>
</nav>

<main>
	<section>
		<h2>Status</h2>
		<p>
			{#if patchSuccessful}
				✅ window.chrome.webview APIs have been successfully patched.
			{:else}
				❌ window.chrome.webview APIs have not been sucessfully patched (yet).
			{/if}
		</p>
		<p>
			ℹ️ In case the web content cannot send messages to the dev tools, please
			<button class="inline" onclick={handleReloadPage}>reload the page</button>.
		</p>
	</section>

	{#if patchSuccessful}
		<section>
			<h2>Send messages</h2>
			<div class="my-json-editor jse-theme-dark">
				<JSONEditor bind:content={jsonContent} />
			</div>
			<button onclick={handleSendMessageToWebview}>Send message to webview</button>
		</section>

		<section>
			<h2>Messages received:</h2>

			<button disabled={receivedMessages.length === 0} onclick={handleClearMessages}>
				Clear messages
			</button>

			<section class="scrollable">
				{#each receivedMessagesOrdered as message}
					<div class="message">
						<h3>{message.datetime.toLocaleString()}</h3>
						<pre><code>{JSON.stringify(message.message, undefined, 2)}</code></pre>
					</div>
				{/each}
			</section>
		</section>
	{:else if patchError}
		<section>
			<p>Failed to patch the webview runtime.</p>
			<pre><code>{JSON.stringify(patchError, undefined, 2)}</code></pre>
		</section>
	{/if}
</main>

<style>
	/* load one or multiple themes */
	@import 'svelte-jsoneditor/themes/jse-theme-dark.css';

	:root {
		:global(body) {
			padding: 0;
			max-height: 100vh;
			overflow: hidden;
			background-color: rgb(40, 40, 40);
			color: #efefef;
		}

		nav {
			display: flex;
			flex-direction: row;
			justify-content: space-between;
			align-items: center;
		}

		main {
			display: flex;
			flex-direction: column;
			gap: 2rem;
		}

		:global(h1, h2, h3) {
			margin: 0;
			margin-bottom: 0.65rem;
		}

		:global(section) {
			display: flex;
			gap: 0.65rem;
			flex-direction: column;

			&.scrollable {
				overflow-y: auto;
				height: 40vh;
			}
		}

		button {
			background-color: hsla(0, 0%, 20%, 0.9);
			border: 1px solid hsla(0, 0%, 25%, 0.9);
			cursor: pointer;
			color: #efefef;
			display: block;
			flex-grow: 0;
			padding: 0.65rem;

			&:hover,
			&:focus-visible {
				background-color: hsla(0, 0%, 25%, 0.9);
			}

			&:active {
				background-color: hsla(0, 0%, 30%, 0.9);
			}

			&:disabled {
				background-color: hsla(0, 0%, 10%, 0.9);
				color: hsla(0, 0%, 50%, 0.9);
				cursor: not-allowed;
			}
		}

		button.inline {
			display: inline;
			padding: 0;
			margin: 0;
			border: none;
			background: none;
			text-decoration: underline;
			color: aquamarine;
			cursor: pointer;
		}

		p {
			margin: 0;
		}
	}
</style>
