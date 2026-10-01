/* Lädt die gemeinsame Sprachsteuerung in garantierter Reihenfolge. */
(() => {
    if (window.__siteI18nReady) return;

    const bootstrapUrl = document.currentScript?.src;
    const baseUrl = new URL("./", bootstrapUrl || document.baseURI);

    function loadScript(file) {
        return new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = new URL(file, baseUrl).href;
            script.onload = resolve;
            script.onerror = () => reject(new Error(`Sprachdatei konnte nicht geladen werden: ${file}`));
            document.head.append(script);
        });
    }

    function loadPageCatalogs() {
        const catalogs = (document.body?.dataset.i18nCatalogs || "")
            .split(",")
            .map(name => name.trim())
            .filter(name => /^[a-z0-9-]+$/i.test(name));

        return catalogs.reduce(
            (chain, catalog) => chain
                .then(() => loadScript(`${catalog}.de.js`))
                .then(() => loadScript(`${catalog}.en.js`)),
            Promise.resolve()
        );
    }

    window.__siteI18nReady = Promise.resolve()
        .then(() => window.SiteI18n || loadScript("i18n-core.js"))
        .then(() => loadScript("common.de.js"))
        .then(() => loadScript("common.en.js"))
        .then(() => loadScript("ui.de.js"))
        .then(() => loadScript("ui.en.js"))
        .then(loadPageCatalogs)
        .then(() => loadScript("site-shell.js"))
        .then(() => window.SiteI18n)
        .catch(error => {
            console.error("[Site i18n]", error);
            throw error;
        });
})();
