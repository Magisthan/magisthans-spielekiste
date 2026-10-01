/* =========================================================
   Gemeinsame Lokalisierung für Header, Navigation und Footer
========================================================= */

(() => {
    const LINK_TRANSLATIONS = new Map([
        ["index.html", "site.navigation.home"],
        ["retro-news-flash.html", "site.navigation.news"],
        ["pixelkumpel.html", "site.navigation.pixelFriends"],
        ["sammlung.html", "site.navigation.collection"],
        ["ueber-mich.html", "site.navigation.about"],
        ["impressum.html", "site.footer.imprint"],
        ["datenschutz.html", "site.footer.privacy"]
    ]);

    function fileNameFromLink(link) {
        try {
            const pathname = new URL(link.href, document.baseURI).pathname;
            return pathname.split("/").filter(Boolean).pop()?.toLowerCase() || "index.html";
        } catch (error) {
            return "";
        }
    }

    function ensurePixelFriendsIcon(link, navigation) {
        link.classList.add("pixelkumpel-link");
        let image = link.querySelector("img");
        if (image) return image;

        const homeLink = [...navigation.querySelectorAll("a[href]")]
            .find(candidate => fileNameFromLink(candidate) === "index.html");
        const imageUrl = new URL(
            "assets/images/pixelkumpel-icon.webp",
            homeLink?.href || document.baseURI
        );

        image = document.createElement("img");
        image.src = imageUrl.href;
        image.width = 48;
        image.height = 36;
        image.decoding = "async";
        image.loading = "lazy";
        link.prepend(image);
        return image;
    }

    function attachTranslationToLink(link, key) {
        const image = link.querySelector("img");
        if (!image) {
            link.dataset.i18n = key;
            return;
        }

        let label = link.querySelector("[data-site-navigation-label]");
        if (!label) {
            label = document.createElement("span");
            label.dataset.siteNavigationLabel = "";
            [...link.childNodes].forEach(node => {
                if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) node.remove();
            });
            link.append(label);
        }
        label.dataset.i18n = key;
        image.dataset.i18nAlt = key;
    }

    function prepareNavigation() {
        document.querySelectorAll("body > nav, header + nav").forEach(navigation => {
            navigation.dataset.i18nAriaLabel = "site.navigation.label";
            navigation.querySelectorAll("a[href]").forEach(link => {
                const fileName = fileNameFromLink(link);
                if (fileName === "pixelkumpel.html") ensurePixelFriendsIcon(link, navigation);
                const key = LINK_TRANSLATIONS.get(fileName);
                if (key) attachTranslationToLink(link, key);
            });
        });
    }

    function prepareFooter() {
        document.querySelectorAll("footer a[href]").forEach(link => {
            const key = LINK_TRANSLATIONS.get(fileNameFromLink(link));
            if (key) link.dataset.i18n = key;
        });
    }

    function languageButton(language, labelKey, flagMarkup) {
        const button = document.createElement("button");
        button.type = "button";
        button.dataset.siteLanguage = language;
        button.dataset.i18nAriaLabel = labelKey;
        button.setAttribute("aria-pressed", "false");
        button.innerHTML = `${flagMarkup}<span>${language.toUpperCase()}</span>`;
        return button;
    }

    function createLanguageSelector() {
        const navigation = document.querySelector("body > nav, header + nav");
        if (!navigation || navigation.querySelector("[data-language-selector]")) return;

        const selector = document.createElement("div");
        selector.className = "site-language-selector";
        selector.dataset.languageSelector = "";
        selector.setAttribute("role", "group");

        const germanFlag = `
            <svg class="site-language-flag" viewBox="0 0 30 18" aria-hidden="true" focusable="false">
                <rect width="30" height="6" y="0" fill="#151515"></rect>
                <rect width="30" height="6" y="6" fill="#d71920"></rect>
                <rect width="30" height="6" y="12" fill="#f7ce38"></rect>
            </svg>`;
        const englishFlag = `
            <svg class="site-language-flag" viewBox="0 0 60 36" aria-hidden="true" focusable="false">
                <rect width="60" height="36" fill="#21468b"></rect>
                <path d="M0 0 60 36M60 0 0 36" stroke="#fff" stroke-width="8"></path>
                <path d="M0 0 60 36M60 0 0 36" stroke="#cf142b" stroke-width="4"></path>
                <path d="M30 0v36M0 18h60" stroke="#fff" stroke-width="12"></path>
                <path d="M30 0v36M0 18h60" stroke="#cf142b" stroke-width="7"></path>
            </svg>`;

        const divider = document.createElement("span");
        divider.className = "site-language-divider";
        divider.setAttribute("aria-hidden", "true");

        selector.append(
            languageButton("de", "language.german", germanFlag),
            divider,
            languageButton("en", "language.english", englishFlag)
        );

        navigation.prepend(selector);
    }

    function initializeSiteShell() {
        if (!window.SiteI18n) {
            console.error("[Site shell] SiteI18n wurde nicht geladen.");
            return;
        }

        createLanguageSelector();
        prepareNavigation();
        prepareFooter();
        window.SiteI18n.applyTranslations();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initializeSiteShell, { once:true });
    } else {
        initializeSiteShell();
    }
})();
