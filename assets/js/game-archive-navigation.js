(() => {
    "use strict";

    const MAX_VISIBLE_RESULTS = 20;

    function navigationText(key,params = {},fallback = ""){
        if(!window.SiteI18n?.hasTranslation?.(key)) return fallback;
        return window.SiteI18n.t(key,params);
    }

    function localizedGame(game){
        return window.GameLocalization?.localizeGame?.(game) || game;
    }

    function currentPageName() {
        return decodeURIComponent(window.location.pathname.split("/").pop() || "");
    }

    function searchableText(game) {
        game = localizedGame(game);
        const language = window.SiteI18n?.getLanguage?.() || "de";
        const genres = (Array.isArray(game.genre) ? game.genre : [game.genre])
            .map(genre=>navigationText(`genre.${genre}`,{},genre));
        const values = [
            game.title,
            game.system,
            game.year,
            game.developer,
            game.publisher,
            ...genres
        ];

        return values
            .filter(Boolean)
            .join(" ")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLocaleLowerCase(language);
    }

    function normalizedQuery(value) {
        const language = window.SiteI18n?.getLanguage?.() || "de";
        return value
            .trim()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLocaleLowerCase(language);
    }

    function createStepLink(game, direction, label) {
        const displayGame = localizedGame(game);
        const link = document.createElement("a");
        link.className = `game-archive-navigation__step game-archive-navigation__step--${direction}`;
        link.href = game.page;
        link.setAttribute("aria-label", `${label}: ${displayGame.title}, ${displayGame.system}`);

        const directionText = document.createElement("span");
        directionText.className = "game-archive-navigation__direction";
        directionText.textContent = direction === "previous" ? `← ${label}` : `${label} →`;

        const target = document.createElement("span");
        target.className = "game-archive-navigation__target";
        target.textContent = `${displayGame.title} · ${displayGame.system}`;

        link.append(directionText, target);
        return link;
    }

    function initializeArchiveNavigation() {
        const title = document.getElementById("game-title");
        const titleHost = title?.parentElement;

        if (!title || !titleHost || !Array.isArray(window.GAMES || (typeof GAMES !== "undefined" && GAMES))) {
            return;
        }

        const sourceGames = typeof GAMES !== "undefined" ? GAMES : window.GAMES;
        const games = sourceGames
            .filter(game => game && game.page && game.title)
            .slice()
            .sort((a, b) => {
                const titleOrder = a.title.localeCompare(b.title, "de", { sensitivity: "base" });
                return titleOrder || String(a.system || "").localeCompare(String(b.system || ""), "de");
            });

        const currentIndex = games.findIndex(game => game.page === currentPageName());
        if (currentIndex < 0 || games.length < 2) {
            return;
        }

        const currentGame = games[currentIndex];
        const previousGame = games[(currentIndex - 1 + games.length) % games.length];
        const nextGame = games[(currentIndex + 1) % games.length];
        const navigation = document.createElement("section");
        navigation.className = "game-archive-navigation";
        navigation.setAttribute("aria-label", navigationText(
            "gamePage.navigation.label",
            {},
            "Spiele im Retro Box Archive durchsuchen"
        ));

        const row = document.createElement("div");
        row.className = "game-archive-navigation__row";

        const current = document.createElement("div");
        current.className = "game-archive-navigation__current";
        const meta = document.createElement("span");
        meta.className = "game-archive-navigation__meta";
        meta.textContent = [currentGame.system, currentGame.year].filter(Boolean).join(" · ");
        current.append(title, meta);

        row.append(
            createStepLink(previousGame, "previous", navigationText("gamePage.navigation.previous", {}, "Vorheriges Spiel")),
            current,
            createStepLink(nextGame, "next", navigationText("gamePage.navigation.next", {}, "Nächstes Spiel"))
        );

        const toggle = document.createElement("button");
        toggle.className = "game-archive-navigation__search-toggle";
        toggle.type = "button";
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-controls", "game-archive-search-panel");
        toggle.innerHTML = `
            <span class="game-archive-navigation__search-led" aria-hidden="true"></span>
            <span class="game-archive-navigation__search-text">${navigationText("gamePage.navigation.search", {}, "Archiv durchsuchen")}</span>
            <span class="game-archive-navigation__search-chevron" aria-hidden="true">⌄</span>
        `;

        const panel = document.createElement("div");
        panel.id = "game-archive-search-panel";
        panel.className = "game-archive-navigation__panel";
        panel.hidden = true;
        panel.innerHTML = `
            <div class="game-archive-navigation__panel-header" aria-hidden="true">
                <span class="game-archive-navigation__panel-title">${navigationText("gamePage.navigation.database", {}, "Archivdatenbank")}</span>
                <span class="game-archive-navigation__online">${navigationText("gamePage.navigation.online", { count:games.length }, `${games.length} Boxen online`)}</span>
            </div>
            <label class="game-archive-navigation__label" for="game-archive-search">
                ${navigationText("gamePage.navigation.searchLabel", {}, "Titel, System, Jahr, Entwickler oder Genre")}
            </label>
            <input
                class="game-archive-navigation__input"
                id="game-archive-search"
                type="search"
                placeholder="${navigationText("gamePage.navigation.placeholder", {}, "Zum Beispiel: Pirates, C64 oder Strategie")}"
                autocomplete="off"
            >
            <div class="game-archive-navigation__status" role="status" aria-live="polite"></div>
            <ul class="game-archive-navigation__results" aria-label="${navigationText("gamePage.navigation.results", {}, "Suchergebnisse")}"></ul>
        `;

        navigation.append(row, toggle, panel);
        const overview = titleHost.closest(".game-detail-overview, .game-detail-intro");

        if (overview?.parentElement) {
            overview.parentElement.insertBefore(navigation, overview);
        } else {
            titleHost.prepend(navigation);
        }

        const input = panel.querySelector(".game-archive-navigation__input");
        const results = panel.querySelector(".game-archive-navigation__results");
        const status = panel.querySelector(".game-archive-navigation__status");

        function renderResults() {
            const query = normalizedQuery(input.value);
            const matches = games.filter(game => !query || searchableText(game).includes(query));
            const visibleMatches = matches.slice(0, MAX_VISIBLE_RESULTS);
            results.replaceChildren();

            visibleMatches.forEach((game, index) => {
                const displayGame = localizedGame(game);
                const item = document.createElement("li");
                const link = document.createElement("a");
                link.className = "game-archive-navigation__result-link";
                link.href = game.page;
                if (game.page === currentGame.page) {
                    link.setAttribute("aria-current", "page");
                }

                const resultTitle = document.createElement("span");
                resultTitle.className = "game-archive-navigation__result-title";
                const resultIndex = document.createElement("span");
                resultIndex.className = "game-archive-navigation__result-index";
                resultIndex.textContent = String(index + 1).padStart(2, "0");
                resultTitle.append(resultIndex, document.createTextNode(displayGame.title));

                const resultMeta = document.createElement("span");
                resultMeta.className = "game-archive-navigation__result-meta";
                resultMeta.textContent = [displayGame.system, displayGame.year].filter(Boolean).join(" · ");

                link.append(resultTitle, resultMeta);
                item.append(link);
                results.append(item);
            });

            if (!matches.length) {
                status.textContent = navigationText("gamePage.navigation.none", {}, "Kein passendes Spiel gefunden.");
            } else if (matches.length > MAX_VISIBLE_RESULTS) {
                status.textContent = navigationText(
                    "gamePage.navigation.limited",
                    { count:matches.length, limit:MAX_VISIBLE_RESULTS },
                    `${matches.length} Treffer – die ersten ${MAX_VISIBLE_RESULTS} werden angezeigt.`
                );
            } else {
                status.textContent = navigationText(
                    "gamePage.navigation.count",
                    { count:matches.length },
                    `${matches.length} Treffer`
                );
            }
        }

        function openSearch() {
            panel.hidden = false;
            toggle.setAttribute("aria-expanded", "true");
            renderResults();
            window.requestAnimationFrame(() => input.focus());
        }

        function closeSearch({ restoreFocus = true } = {}) {
            panel.hidden = true;
            toggle.setAttribute("aria-expanded", "false");
            if (restoreFocus) {
                toggle.focus();
            }
        }

        toggle.addEventListener("click", () => {
            if (panel.hidden) {
                openSearch();
            } else {
                closeSearch();
            }
        });

        input.addEventListener("input", renderResults);

        document.addEventListener("siteLanguageChanged",()=>{
            [
                ["previous", previousGame, "gamePage.navigation.previous", "Vorheriges Spiel"],
                ["next", nextGame, "gamePage.navigation.next", "Nächstes Spiel"]
            ].forEach(([direction,game,key,fallback])=>{
                const link = navigation.querySelector(`.game-archive-navigation__step--${direction}`);
                const displayGame = localizedGame(game);
                const label = navigationText(key,{},fallback);
                link?.setAttribute("aria-label",`${label}: ${displayGame.title}, ${displayGame.system}`);
                const directionText = link?.querySelector(".game-archive-navigation__direction");
                const target = link?.querySelector(".game-archive-navigation__target");
                if(directionText) directionText.textContent = direction === "previous" ? `← ${label}` : `${label} →`;
                if(target) target.textContent = `${displayGame.title} · ${displayGame.system}`;
            });
            navigation.setAttribute("aria-label",navigationText("gamePage.navigation.label",{},"Spiele im Retro Box Archive durchsuchen"));
            navigation.querySelector(".game-archive-navigation__search-text").textContent =
                navigationText("gamePage.navigation.search",{},"Archiv durchsuchen");
            panel.querySelector(".game-archive-navigation__panel-title").textContent =
                navigationText("gamePage.navigation.database",{},"Archivdatenbank");
            panel.querySelector(".game-archive-navigation__online").textContent =
                navigationText("gamePage.navigation.online",{ count:games.length },`${games.length} Boxen online`);
            panel.querySelector(".game-archive-navigation__label").textContent =
                navigationText("gamePage.navigation.searchLabel",{},"Titel, System, Jahr, Entwickler oder Genre");
            input.placeholder = navigationText("gamePage.navigation.placeholder",{},"Zum Beispiel: Pirates, C64 oder Strategie");
            results.setAttribute("aria-label",navigationText("gamePage.navigation.results",{},"Suchergebnisse"));
            renderResults();
        });
        input.addEventListener("keydown", event => {
            const links = [...results.querySelectorAll("a")];
            if (event.key === "ArrowDown" && links.length) {
                event.preventDefault();
                links[0].focus();
            } else if (event.key === "Enter" && links.length) {
                event.preventDefault();
                links[0].click();
            }
        });

        results.addEventListener("keydown", event => {
            const links = [...results.querySelectorAll("a")];
            const index = links.indexOf(document.activeElement);
            if (event.key === "ArrowDown" && index >= 0) {
                event.preventDefault();
                links[(index + 1) % links.length].focus();
            } else if (event.key === "ArrowUp" && index >= 0) {
                event.preventDefault();
                if (index === 0) {
                    input.focus();
                } else {
                    links[index - 1].focus();
                }
            }
        });

        document.addEventListener("pointerdown", event => {
            if (!panel.hidden && !navigation.contains(event.target)) {
                closeSearch({ restoreFocus: false });
            }
        });

        document.addEventListener("keydown", event => {
            const target = event.target;
            const isTyping = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target?.isContentEditable;

            if (event.key === "Escape" && !panel.hidden) {
                event.preventDefault();
                closeSearch();
            } else if (event.key === "/" && !isTyping && panel.hidden) {
                event.preventDefault();
                openSearch();
            }
        });
    }

    document.addEventListener("DOMContentLoaded", () => {
        Promise.resolve(window.__siteI18nReady).then(initializeArchiveNavigation);
    });
})();
