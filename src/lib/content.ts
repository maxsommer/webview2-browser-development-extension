export function contentScript(): void {
	const log = (...args: unknown[]) =>
		console.log('webview2-browser-development-extension ::', ...args);

	log('initiating content script');

	if (!window.chrome) {
		log('did not find window.chrome, patching now');
		window.chrome = {} as typeof chrome;
	}

	if (!('webview' in window.chrome)) {
		log('did not find window.chrome.webview, patching now');
		window.chrome.webview = {};
	}

	if (!window.chrome.webview.postMessage) {
		log('did not find window.chrome.postMessage, patching now');
		window.chrome.webview.postMessage = (message) => {};
	}

	if (!window.chrome.webview.addEventListener) {
		log('did not find window.chrome.addEventListener, patching now');
		window.chrome.webview.addEventListener = () => {};
	}

	console.log(window.chrome.webview);
	console.log(globalThis.window.chrome.webview);

	// Receive data from the extension
	window.chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
		console.log(message);
		return true;
	});

	/**
	 * Inline scripting won't work in the content script
	 */
	/* const scriptElement = document.createElement('script');
	scriptElement.innerHTML = `(() => { console.log('mounted some injected script here') })()`;
	document.querySelector('body')?.appendChild(scriptElement); */
}
