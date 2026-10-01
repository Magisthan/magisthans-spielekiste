(() => {
    "use strict";

    const catalog = Array.isArray(window.COLLECTION_CATALOG) ? window.COLLECTION_CATALOG : [];
    const collections = ["c64","amiga","pc"];
    const list = document.getElementById("collection-games-list");
    const queryInput = document.getElementById("collection-archive-query");
    const emptyState = document.getElementById("collection-games-empty");
    const feedback = document.getElementById("collection-archive-feedback");
    const visibleCount = document.getElementById("collection-games-visible-count");
    const currentCount = document.getElementById("collection-archive-current-count");
    const systemLabel = document.getElementById("collection-games-system");
    const totalLabel = document.getElementById("collection-archive-total");
    const tabs = [...document.querySelectorAll(".collection-system-tab")];
    let activeCollection = "c64";
    let renderSequence = 0;
    let searchTimer = 0;

    function archiveText(key,params = {},fallback = ""){
        if(!window.SiteI18n?.hasTranslation?.(key)) return fallback;
        return window.SiteI18n.t(key,params);
    }

    function normalize(value){
        const language = window.SiteI18n?.getLanguage?.() || "de";
        return String(value || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g,"")
            .replace(/&/g," and ")
            .replace(/[^a-zA-Z0-9]+/g," ")
            .trim()
            .toLocaleLowerCase(language);
    }

    function systemFamily(system){
        const value = normalize(system);
        if(/commodore 64|\bc64\b|commodore 16/.test(value)) return "c64";
        if(/amiga|cd32|cdtv/.test(value)) return "amiga";
        if(/\bpc\b|dos|windows/.test(value)) return "pc";
        return "";
    }

    function sourceGames(){
        if(typeof GAMES !== "undefined" && Array.isArray(GAMES)) return GAMES;
        return Array.isArray(window.GAMES) ? window.GAMES : [];
    }

    function buildPageIndex(){
        const index = new Map();
        sourceGames().forEach(game=>{
            if(!game?.page || !game?.title) return;
            const family = systemFamily(game.system);
            if(!family) return;
            const titles = new Set([game.title]);
            if(game.translations?.de?.title) titles.add(game.translations.de.title);
            if(game.translations?.en?.title) titles.add(game.translations.en.title);
            titles.forEach(title=>{
                const key = `${family}:${normalize(title)}`;
                if(!index.has(key)) index.set(key,game.page);
            });
        });
        return index;
    }

    const pageIndex = buildPageIndex();

    function pageFor(entry){
        return pageIndex.get(`${entry.collection}:${normalize(entry.title)}`) || "";
    }

    function localizedGenre(genre){
        return archiveText(`genre.${genre}`,{},genre || "–");
    }

    function localizedValue(group,value){
        if(!value) return "–";
        return archiveText(`collectionArchive.${group}.${value}`,{},value);
    }

    function mediumText(entry){
        const medium = localizedValue("medium",entry.medium);
        if(!entry.disks) return medium;
        return `${medium} · ${archiveText(
            "collectionArchive.disks",
            { count:entry.disks },
            `${entry.disks} Disk${entry.disks === 1 ? "" : "s"}`
        )}`;
    }

    function searchableText(entry){
        return normalize([
            entry.title,
            entry.platform,
            entry.genre,
            localizedGenre(entry.genre),
            entry.publisher,
            entry.year,
            entry.medium,
            localizedValue("medium",entry.medium),
            entry.language,
            localizedValue("language",entry.language)
        ].filter(Boolean).join(" "));
    }

    function createValue(value,className,labelKey){
        const span = document.createElement("span");
        span.className = `collection-game__value ${className}`;
        span.dataset.label = archiveText(labelKey,{},"");
        span.textContent = value || "–";
        return span;
    }

    function createGameRow(entry){
        const item = document.createElement("li");
        item.className = "collection-game";

        const titleCell = document.createElement("span");
        titleCell.className = "collection-game__title-cell";
        const title = document.createElement("span");
        title.className = "collection-game__title";
        title.textContent = entry.title;
        const platform = document.createElement("span");
        platform.className = "collection-game__platform";
        platform.textContent = entry.platform || activeCollection.toUpperCase();
        titleCell.append(title,platform);

        const page = pageFor(entry);
        if(page){
            const link = document.createElement("a");
            link.className = "collection-game__link";
            link.href = page.startsWith("spiele/") ? page : `spiele/${page}`;
            link.textContent = archiveText("collectionArchive.gamePageLink",{},"3D-Box ansehen");
            titleCell.append(link);
        }

        item.append(
            titleCell,
            createValue(localizedGenre(entry.genre),"collection-game__genre","collectionArchive.column.genre"),
            createValue(entry.publisher || "–","collection-game__publisher","collectionArchive.column.publisher"),
            createValue(entry.year || "–","collection-game__year","collectionArchive.column.year"),
            createValue(mediumText(entry),"collection-game__medium","collectionArchive.column.medium"),
            createValue(localizedValue("language",entry.language),"collection-game__language","collectionArchive.column.language")
        );
        return item;
    }

    function filteredGames(){
        const query = normalize(queryInput?.value);
        return catalog.filter(entry=>
            entry.collection === activeCollection && (!query || searchableText(entry).includes(query))
        );
    }

    function updateCounts(matches){
        const totalForSystem = catalog.filter(entry=>entry.collection === activeCollection).length;
        const queryActive = Boolean(queryInput.value.trim());
        currentCount.textContent = archiveText(
            "collectionArchive.systemCount",
            { count:totalForSystem },
            `${totalForSystem} Spiele`
        );
        visibleCount.textContent = archiveText(
            "collectionArchive.visibleCount",
            { count:matches.length },
            `${matches.length} Einträge`
        );
        feedback.textContent = queryActive
            ? archiveText("collectionArchive.searchCount",{ count:matches.length },`${matches.length} Treffer`)
            : archiveText("collectionArchive.searchHint",{},"Die Suche berücksichtigt alle angezeigten Spieldaten.");
    }

    function render(){
        const sequence = ++renderSequence;
        const matches = filteredGames();
        list.replaceChildren();
        emptyState.hidden = matches.length > 0;
        systemLabel.textContent = activeCollection.toUpperCase();
        updateCounts(matches);

        let offset = 0;
        const batchSize = 180;
        function appendBatch(){
            if(sequence !== renderSequence) return;
            const fragment = document.createDocumentFragment();
            matches.slice(offset,offset + batchSize).forEach(entry=>fragment.append(createGameRow(entry)));
            list.append(fragment);
            offset += batchSize;
            if(offset < matches.length) window.requestAnimationFrame(appendBatch);
        }
        appendBatch();
    }

    function selectCollection(collection,{ updateUrl = true } = {}){
        if(!collections.includes(collection)) return;
        activeCollection = collection;
        tabs.forEach(tab=>{
            const active = tab.dataset.collection === collection;
            tab.classList.toggle("is-active",active);
            tab.setAttribute("aria-selected",String(active));
        });
        if(updateUrl){
            const url = new URL(window.location.href);
            url.searchParams.set("system",collection);
            history.replaceState(null,"",url);
        }
        render();
    }

    function initialize(){
        totalLabel.textContent = catalog.length.toLocaleString(window.SiteI18n?.getLanguage?.() || "de");
        collections.forEach(collection=>{
            const count = catalog.filter(entry=>entry.collection === collection).length;
            const target = document.querySelector(`[data-count-for="${collection}"]`);
            if(target) target.textContent = count.toLocaleString(window.SiteI18n?.getLanguage?.() || "de");
        });
        const requested = new URL(window.location.href).searchParams.get("system");
        selectCollection(collections.includes(requested) ? requested : "c64",{ updateUrl:false });
    }

    tabs.forEach(tab=>tab.addEventListener("click",()=>selectCollection(tab.dataset.collection)));
    queryInput?.addEventListener("input",()=>{
        window.clearTimeout(searchTimer);
        searchTimer = window.setTimeout(render,90);
    });
    document.addEventListener("siteLanguageChanged",initialize);
    Promise.resolve(window.__siteI18nReady).then(initialize);
})();
