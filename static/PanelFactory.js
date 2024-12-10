(() => {
    if (chrome?.devtools?.inspectedWindow) {
        chrome.devtools.panels.create('Webview2', 'favicon.png', 'index.html', (panel) => {});
    }
})();