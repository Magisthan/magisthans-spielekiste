/* =========================================================
   Magisthans Spielekiste - gemeinsame Sprachsteuerung
========================================================= */

(() => {
    if (window.SiteI18n) return;

    const STORAGE_KEY = "magisthans-language";
    const LEGACY_STORAGE_KEY = "rd-language";
    const DEFAULT_LANGUAGE = "de";
    const SUPPORTED_LANGUAGES = ["de", "en"];
    const catalogs = Object.fromEntries(
        SUPPORTED_LANGUAGES.map(language => [language, Object.create(null)])
    );

    const ATTRIBUTE_BINDINGS = {
        "data-i18n-aria-label": "aria-label",
        "data-i18n-title": "title",
        "data-i18n-placeholder": "placeholder",
        "data-i18n-alt": "alt",
        "data-i18n-value": "value",
        "data-i18n-content": "content"
    };

    function readStoredLanguage() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY)
                || localStorage.getItem(LEGACY_STORAGE_KEY);
            return SUPPORTED_LANGUAGES.includes(stored) ? stored : DEFAULT_LANGUAGE;
        } catch (error) {
            return DEFAULT_LANGUAGE;
        }
    }

    let currentLanguage = readStoredLanguage();

    function registerTranslations(language, messages) {
        if (!SUPPORTED_LANGUAGES.includes(language) || !messages) return;
        Object.assign(catalogs[language], messages);

        if (document.readyState !== "loading" && language === currentLanguage) {
            applyTranslations();
        }
    }

    function translateFor(language, key, params = {}) {
        const selectedLanguage = SUPPORTED_LANGUAGES.includes(language)
            ? language
            : DEFAULT_LANGUAGE;
        const value = catalogs[selectedLanguage]?.[key]
            ?? catalogs[DEFAULT_LANGUAGE]?.[key]
            ?? key;
        return typeof value === "function" ? value(params) : value;
    }

    function t(key, params = {}) {
        return translateFor(currentLanguage, key, params);
    }

    function parseParams(element) {
        const raw = element.dataset.i18nParams;
        if (!raw) return {};

        try {
            return JSON.parse(raw);
        } catch (error) {
            console.warn("[SiteI18n] Ungültige data-i18n-params:", raw, element);
            return {};
        }
    }

    function matchingElements(root, selector) {
        const matches = [];
        if (root instanceof Element && root.matches(selector)) matches.push(root);
        if (typeof root.querySelectorAll === "function") {
            matches.push(...root.querySelectorAll(selector));
        }
        return matches;
    }

    function applyTranslations(root = document) {
        matchingElements(root, "[data-i18n]").forEach(element => {
            element.textContent = t(element.dataset.i18n, parseParams(element));
        });

        matchingElements(root, "[data-i18n-html]").forEach(element => {
            // Only trusted strings from the local translation catalogs belong here.
            element.innerHTML = t(element.dataset.i18nHtml, parseParams(element));
        });

        Object.entries(ATTRIBUTE_BINDINGS).forEach(([dataAttribute, attribute]) => {
            matchingElements(root, `[${dataAttribute}]`).forEach(element => {
                const key = element.getAttribute(dataAttribute);
                element.setAttribute(attribute, t(key, parseParams(element)));
            });
        });

        document.documentElement.lang = currentLanguage;
        document.documentElement.dir = "ltr";

        document.querySelectorAll("[data-rd-language],[data-site-language]").forEach(button => {
            const language = button.dataset.rdLanguage || button.dataset.siteLanguage;
            const active = language === currentLanguage;
            button.classList.toggle("is-active", active);
            button.setAttribute("aria-pressed", String(active));
        });

        document.querySelectorAll(".rd-language-selector,[data-language-selector]")
            .forEach(selector => {
                selector.setAttribute("aria-label", t("language.selector"));
            });
    }

    function setLanguage(language) {
        if (!SUPPORTED_LANGUAGES.includes(language)) return false;

        const previousLanguage = currentLanguage;
        currentLanguage = language;

        try {
            localStorage.setItem(STORAGE_KEY, language);
            // Während der Übergangsphase mit älteren Retro-Discovery-Seiten synchron halten.
            localStorage.setItem(LEGACY_STORAGE_KEY, language);
        } catch (error) {
            // Die Website funktioniert auch ohne verfügbaren Webspeicher.
        }

        applyTranslations();

        const detail = { language, previousLanguage };
        document.dispatchEvent(new CustomEvent("siteLanguageChanged", { detail }));
        document.dispatchEvent(new CustomEvent("rdlanguagechange", { detail }));
        return true;
    }

    window.SiteI18n = {
        t,
        translateFor,
        setLanguage,
        applyTranslations,
        registerTranslations,
        getLanguage: () => currentLanguage,
        getDefaultLanguage: () => DEFAULT_LANGUAGE,
        getSupportedLanguages: () => [...SUPPORTED_LANGUAGES],
        hasTranslation: (key, language = currentLanguage) =>
            Object.prototype.hasOwnProperty.call(catalogs[language] || {}, key)
    };

    document.addEventListener("click", event => {
        const button = event.target.closest?.("[data-rd-language],[data-site-language]");
        if (!button) return;
        setLanguage(button.dataset.rdLanguage || button.dataset.siteLanguage);
    });

    document.addEventListener("DOMContentLoaded", () => applyTranslations());
})();
