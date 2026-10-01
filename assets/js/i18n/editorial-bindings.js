/* Übersetzt redaktionelle Freitexte, ohne deren bestehende HTML-Struktur zu verändern. */
(() => {
    const originals = new WeakMap();
    const tracked = new Set();
    const ignoredParents = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEMPLATE"]);

    function normalized(value) {
        return String(value || "").replace(/\s+/g, " ").trim();
    }

    function bindTextNode(node) {
        if (!node?.parentElement || ignoredParents.has(node.parentElement.tagName)) return;

        if (!originals.has(node)) {
            const source = normalized(node.nodeValue);
            if (!source || !SiteI18n.hasTranslation(source, "en")) return;
            originals.set(node, source);
            tracked.add(node);
        }

        const source = originals.get(node);
        const raw = node.nodeValue || "";
        const leading = raw.match(/^\s*/)?.[0] || "";
        const trailing = raw.match(/\s*$/)?.[0] || "";
        node.nodeValue = `${leading}${SiteI18n.t(source)}${trailing}`;
    }

    function scan(root = document.documentElement) {
        if (root.nodeType === Node.TEXT_NODE) {
            bindTextNode(root);
            return;
        }

        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        let node;
        while ((node = walker.nextNode())) bindTextNode(node);
    }

    function apply() {
        tracked.forEach(node => {
            if (node.isConnected) bindTextNode(node);
            else tracked.delete(node);
        });
        scan();
    }

    window.__siteI18nReady?.then(() => {
        apply();
        document.addEventListener("siteLanguageChanged", apply);

        const observer = new MutationObserver(records => {
            records.forEach(record => record.addedNodes.forEach(scan));
        });
        observer.observe(document.documentElement, { childList: true, subtree: true });
    });
})();
