const debugLogInAppLogs = false;

export function sendMessageToWebview(messageToWebviewValue: unknown): Promise<void> {
	const script = `
    if (window.chromeWebviewEventListeners) {
      window.chromeWebviewEventListeners.forEach((fn) => {
        fn({ data: ${JSON.stringify(messageToWebviewValue)} });
      });
    }
  `;

	return new Promise((resolve, reject) => {
		chrome.devtools.inspectedWindow.eval(script, function (result, isException) {
			if (isException) {
				console.error('An exception occurred while checking webview APIs.');
				console.log(isException);
				return reject();
			} else {
				console.log('Webview2 APIs are available on webpage.');
				return resolve();
			}
		});
	});
}

export function checkWebview2Apis(): Promise<void> {
	const script = `
    if (!
      (typeof window.chrome?.webview?.postMessage === 'function' && 
      typeof window.chrome?.webview?.addEventListener === 'function')
    ) {
      throw new Error('Not available.');
    }
  `;

	return new Promise((resolve, reject) => {
		chrome.devtools.inspectedWindow.eval(script, function (result, isException) {
			if (isException) {
				console.error('Webview2 APIs are unavailable on webpage.');
				return reject();
			} else {
				console.log('Webview2 APIs are available on webpage.');
				return resolve();
			}
		});
	});
}

export function runCodeInInspectedWindow(code: string): Promise<void> {
	return new Promise((resolve, reject) => {
		chrome.devtools.inspectedWindow.eval(code, function (result, isException) {
			if (isException) {
				console.error('An exception occurred while running code in inspected window.');
				console.error(isException);
				return reject(isException);
			} else {
				console.log('' + result);
				return resolve();
			}
		});
	});
}

export function patchWebview2Apis(runtimeId: string): Promise<void> {
	let script = `
    if (!window.chrome) {
      console.log('webview2-browser-development-extension :: did not find window.chrome, patching now');
      window.chrome = {};
    }

    if (!('webview' in window.chrome)) {
      console.log('webview2-browser-development-extension :: did not find window.chrome.webview, patching now');
      window.chrome.webview = {};
    }

    if (!window.chrome.webview.postMessage) {
      console.log('webview2-browser-development-extension :: did not find window.chrome.postMessage, patching now');
      window.chrome.webview.postMessage = (message) => {
        chrome.runtime.sendMessage(
          '${runtimeId}', 
          message,
          (response) => {
            console.log('window.chrome.webview.postMessage - receiving end responded with:');
            console.log(response);
          }
        );
      };
    }
		if (!window.chromeWebviewEventListeners) {
			window.chromeWebviewEventListeners = [];
		}
    if (!window.chrome.webview.addEventListener) {
      console.log('webview2-browser-development-extension :: did not find window.chrome.webview.addEventListener, patching now');
      window.chrome.webview.addEventListener = (name, fn) => {
        window.chromeWebviewEventListeners.push(fn);
        return () => {
          const index = window.chromeWebviewEventListeners.indexOf(fn);
          if (index > -1) {
            window.chromeWebviewEventListeners.splice(index, 1);
          }
        };
      };
    }
  `;

	if (!debugLogInAppLogs) {
		script = script.replace(/console\.log\(.+?\);/g, '');
	}

	return new Promise((resolve, reject) => {
		chrome.devtools.inspectedWindow.eval(script, function (result, isException) {
			if (isException) {
				console.error('An exception occurred while patching webview APIs.');
				console.error(isException);
				return reject(isException);
			} else {
				console.log('' + result);
				return resolve();
			}
		});
	});
}
