/* ==================================================
   Retro Discovery – Top Discoveries
   Lokale Testdaten. Später kann ein Datenadapter die
   Werte aus dem Community-Backend bereitstellen.
   ================================================== */

(() => {

    const TOP_LIMIT = 20;
    const COMMUNITY_SCALE_MAX = 10;
    const TOP_SCALE_MAX = 5;
    const PRIOR_MEAN = 4.0;
    const PRIOR_WEIGHT = 18;
    const ROW_HEIGHT = 79;
    const SCROLL_SPEED = 11;
    const UPDATE_PAUSE = 2000;
    const MOBILE_ROTATION_INTERVAL = 5000;

    const TEST_DISCOVERIES = [
        { id:1, folder:"pirates", title:"Sid Meier's Pirates!", system:"Amiga", averageRating:4.94, votes:128 },
        { id:5, folder:"vermeer-c64", title:"Vermeer", system:"C64", averageRating:4.91, votes:91 },
        { id:2, folder:"ports-of-call-eu", title:"Ports of Call", system:"Amiga", averageRating:4.82, votes:86 },
        { id:7, folder:"dotc-c64-us", title:"Defender of the Crown", system:"C64", averageRating:4.89, votes:65 },
        { id:11, folder:"patrizier-cd-v1", title:"Der Patrizier", system:"MS-DOS", averageRating:4.88, votes:60 },
        { id:15, folder:"1869", title:"1869 – Hart am Wind", system:"Amiga", averageRating:4.77, votes:73 },
        { id:16, folder:"burntime", title:"Burntime", system:"Amiga", averageRating:4.75, votes:69 },
        { id:19, folder:"fugger-c64", title:"Die Fugger", system:"C64", averageRating:4.84, votes:44 },
        { id:20, folder:"fugger-2-v2", title:"Die Fugger II", system:"PC", averageRating:4.76, votes:52 },
        { id:18, folder:"champions-of-krynn-amiga-eu", title:"Champions of Krynn", system:"Amiga", averageRating:4.85, votes:35 },
        { id:17, folder:"rings-of-medusa", title:"Rings of Medusa", system:"Amiga", averageRating:4.68, votes:55 },
        { id:6, folder:"hanse-c64", title:"Hanse", system:"C64", averageRating:4.66, votes:51 },
        { id:4, folder:"kaiser", title:"Kaiser", system:"C64", averageRating:4.73, votes:31 },
        { id:10, folder:"pirates-cd32", title:"Pirates! Gold", system:"CD32", averageRating:4.71, votes:34 },
        { id:14, folder:"phantasie-ldw-c64", title:"Phantasie", system:"C64", averageRating:4.79, votes:24 },
        { id:8, folder:"neverwinter-nights-ssi-v1", title:"Neverwinter Nights", system:"IBM-PC", averageRating:4.75, votes:27 },
        { id:13, folder:"galactic-adventures", title:"Galactic Adventures", system:"Amiga", averageRating:4.55, votes:39 },
        { id:9, folder:"regent-ce", title:"Regent", system:"IBM-PC-DOS", averageRating:4.58, votes:32 },
        { id:22, folder:"7thguest", title:"The 7th Guest", system:"PC", averageRating:4.63, votes:21 },
        { id:23, folder:"7cities_of_gold_c64", title:"The Seven Cities of Gold", system:"C64", averageRating:4.69, votes:18 }
    ];

    let discoveries = TEST_DISCOVERIES.map(entry => ({ ...entry }));
    let desktopTrack;
    let mobileCurrent;
    let offset = 0;
    let loopHeight = 0;
    let lastFrame = 0;
    let pauseUntil = 0;
    let highlightedId = null;
    let mobileIndex = 0;
    let mobileTimer;

    function weightedScore(entry) {

        return (
            (entry.averageRating * entry.votes + PRIOR_MEAN * PRIOR_WEIGHT) /
            (entry.votes + PRIOR_WEIGHT)
        );

    }

    function rankedDiscoveries() {

        return discoveries
            .map(entry => ({ ...entry, score:weightedScore(entry) }))
            .sort((a, b) => b.score - a.score || b.votes - a.votes)
            .slice(0, TOP_LIMIT);

    }

    function rowMarkup(entry, rank, duplicate) {

        const isHighlighted = entry.id === highlightedId && !duplicate;
        const delta = entry.rankDelta
            ? `<span class="top-discovery-delta">▲${entry.rankDelta}</span>`
            : entry.isNew
                ? `<span class="top-discovery-delta is-new">NEW</span>`
                : "";

        return `
            <article class="top-discovery-row${isHighlighted ? " is-highlighted" : ""}">
                <span class="top-discovery-rank">${String(rank).padStart(2, "0")}</span>
                <div class="top-discovery-main">
                    <div class="top-discovery-title">${entry.title}</div>
                    <div class="top-discovery-meta">
                        <span class="top-discovery-score">${Math.round(entry.score * 20)}%</span>
                        <span class="top-discovery-votes">${entry.votes} VOTES</span>
                        ${delta}
                    </div>
                </div>
            </article>`;

    }

    function renderDesktop({ resetPosition = false } = {}) {

        if (!desktopTrack) return;

        const ranked = rankedDiscoveries();
        const firstLoop = ranked.map((entry, index) => rowMarkup(entry, index + 1, false)).join("");
        const secondLoop = ranked.map((entry, index) => rowMarkup(entry, index + 1, true)).join("");

        desktopTrack.innerHTML = firstLoop + secondLoop;
        refreshLoopHeight();

        if (resetPosition) offset = 0;

        desktopTrack.style.transform = `translateY(${-offset}px)`;

    }

    function refreshLoopHeight() {

        if (!desktopTrack) return;

        // Die Desktop-Lupe verwendet eine kompaktere Reihenhöhe.
        // Deshalb wird nicht mit einer festen CSS-Höhe gerechnet.
        loopHeight = desktopTrack.scrollHeight / 2 || TOP_LIMIT * ROW_HEIGHT;

        if (loopHeight) offset %= loopHeight;

    }

    function renderMobile(entry) {

        if (!mobileCurrent || !entry) return;

        const rank = rankedDiscoveries().findIndex(item => item.id === entry.id) + 1;

        mobileCurrent.innerHTML = `
            <article class="top-discoveries-mobile-entry">
                <span class="top-discoveries-mobile-rank">#${String(rank).padStart(2, "0")}</span>
                <div>
                    <div class="top-discoveries-mobile-title">${entry.title}</div>
                    <div class="top-discoveries-mobile-meta">
                        <span class="top-discoveries-mobile-score">${Math.round(entry.score * 20)}%</span>
                        <span>${entry.votes} VOTES</span>
                        <span>${entry.system}</span>
                    </div>
                </div>
            </article>`;

    }

    function render(options = {}) {

        renderDesktop(options);

        const ranked = rankedDiscoveries();
        renderMobile(ranked[mobileIndex % ranked.length]);

    }

    function rotateMobileEntry() {

        const ranked = rankedDiscoveries();

        if (!ranked.length) return;

        mobileIndex = (mobileIndex + 1) % ranked.length;
        renderMobile(ranked[mobileIndex]);

    }

    function animate(timestamp) {

        if (!lastFrame) lastFrame = timestamp;

        const delta = Math.min((timestamp - lastFrame) / 1000, .1);
        lastFrame = timestamp;

        if (timestamp >= pauseUntil && loopHeight) {

            offset += SCROLL_SPEED * delta;

            if (offset >= loopHeight) offset -= loopHeight;

            desktopTrack.style.transform = `translateY(${-offset}px)`;

        }

        requestAnimationFrame(animate);

    }

    function initialize() {

        desktopTrack = document.getElementById("top-discoveries-track");
        mobileCurrent = document.getElementById("top-discoveries-mobile-current");

        if (!desktopTrack && !mobileCurrent) return;

        render({ resetPosition:true });
        requestAnimationFrame(animate);
        mobileTimer = window.setInterval(
            rotateMobileEntry,
            MOBILE_ROTATION_INTERVAL
        );

        // Nach der verzögerten Hover-Animation die reale Höhe der
        // kompakten Zeilen übernehmen, damit der Loop lückenlos bleibt.
        ["mouseenter", "mouseleave", "focusin", "focusout"].forEach(eventName => {

            desktopTrack?.parentElement?.parentElement.addEventListener(
                eventName,
                () => window.setTimeout(refreshLoopHeight, 360)
            );

        });

    }

    function recordRatingByFolder(folder, rating) {

        const entry = discoveries.find(item => item.folder === folder);

        if (!entry || !Number.isFinite(rating)) return;

        const normalizedRating = Math.min(
            TOP_SCALE_MAX,
            Math.max(0, rating) * TOP_SCALE_MAX / COMMUNITY_SCALE_MAX
        );

        const previousRanks = new Map(
            rankedDiscoveries().map((item, index) => [item.id, index + 1])
        );

        entry.averageRating = (
            entry.averageRating * entry.votes + normalizedRating
        ) / (entry.votes + 1);
        entry.votes += 1;

        const newRank = rankedDiscoveries().findIndex(item => item.id === entry.id) + 1;
        const oldRank = previousRanks.get(entry.id);

        entry.rankDelta = oldRank && newRank < oldRank ? oldRank - newRank : 0;
        entry.isNew = !oldRank && newRank > 0;
        highlightedId = entry.id;
        pauseUntil = performance.now() + UPDATE_PAUSE;
        mobileIndex = Math.max(0, newRank - 1);

        render();

        window.setTimeout(() => {

            if (highlightedId !== entry.id) return;

            highlightedId = null;
            entry.rankDelta = 0;
            entry.isNew = false;
            render();

        }, UPDATE_PAUSE + 500);

    }

    window.TopDiscoveries = {
        render,
        recordRatingByFolder,
        getRanked:rankedDiscoveries
    };

    if (document.readyState === "loading") {

        document.addEventListener("DOMContentLoaded", initialize, { once:true });

    } else {

        initialize();

    }

})();
