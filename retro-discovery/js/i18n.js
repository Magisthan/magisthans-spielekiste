/* Retro-Discovery-Kompatibilität für den gemeinsamen Sprachkern. */
if (!window.SiteI18n) {
    throw new Error("SiteI18n muss vor retro-discovery/js/i18n.js geladen werden.");
}

window.RDI18n = window.SiteI18n;
