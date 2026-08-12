/*
==================================================
Retro Discovery

app.js
==================================================
*/

let allGames = [];

let visibleGames = [];

let currentGameIndex = 0;

/*
==================================================
System Groups
Sprint 37.3
==================================================
*/

const SYSTEM_GROUPS = {

    C64: [
        "C64",
        "C128",
        "MEGA 65"
    ],

    Amiga: [
        "Amiga",
        "CD32",
        "CDTV"
    ],

    DOS: [
        "IBM-PC",
        "IBM-PC-DOS",
        "PC",
        "MS-DOS"
    ],

    Apple: [
        "Apple II",
        "Apple IIGS",
        "Macintosh"
    ],

    Atari: [
        "Atari ST",
        "Atari STE",
        "Atari Falcon",
        "Atari TT",
        "Atari 8-Bit",
        "Atari XL",
        "Atari XE"
    ]

};

/*
==================================================
Discovery Configuration
Sprint 37.3c
==================================================
*/

const DISCOVERY_CONFIG = {

    systems: [

        "C64",
        "Amiga",
        "DOS",
        "Apple",
        "Atari"

    ],

    genreOrder: [

        "Action",
        "Adventure",
        "Rollenspiel",
        "Strategie",
        "Simulation",
        "Sport",
        "Rennspiel",
        "Jump & Run",
        "Puzzle",
        "Arcade"

    ]

};

/*
==================================================
Discovery Session
Sprint 35.1
==================================================
*/

const discoverySession = {

    filters: {

        systems: ["C64", "Amiga", "DOS", "Apple", "Atari"],

        genres: [],

        random: false

    },

    filterDirty: false,

    sessionBuilt: false,

    games: [],

    currentGame: null,

    lastGame: null

};

document.addEventListener("DOMContentLoaded", init);

/*
==================================================
Discovery Session Functions
Sprint 35.1
==================================================
*/

function markFiltersDirty() {

    discoverySession.filterDirty = true;

}

function clearFilterDirty() {

    discoverySession.filterDirty = false;

}

function init() {

    console.log("Retro Discovery gestartet");

    initializeGames();

    /* Renderer starten */
    renderer.init(visibleGames);

    createSystemButtons();

    createGenreButtons();

    // Discovery Filter aktivieren
    initializeDiscoveryFilters();

    refreshFilterButtons();

    console.log(">>> vor initViewer");

    initViewer();

    console.log(">>> nach initViewer");

    refreshUI();  

    loadGameFromURL();
    
    const discoveryButton =
    document.getElementById("discovery-button");

    if (discoveryButton){

    discoveryButton.addEventListener(

    "click",

    handleDiscovery

);

}

}

function initializeGames() {

    if (typeof GAMES === "undefined") {

        console.error("game.js wurde nicht gefunden.");

        return;

    }

    allGames = [...GAMES];

    const systems = [...new Set(allGames.map(g => g.system))];

    console.log("Vorhandene Systeme:");

    console.table(systems.sort());

    visibleGames = [...allGames];

    discoverySession.games = [...allGames];

    console.log("Spiele gefunden:", visibleGames.length);

}

function refreshUI() {

    refreshLCD();

    renderer.setGames(visibleGames);

    console.log("Renderer hat", renderer.games.length, "Spiele");
    console.log("Visible hat", visibleGames.length, "Spiele");

    renderer.setCurrentIndex(currentGameIndex);

    renderer.assignInitialGames(currentGameIndex);

}



function loadGameCounter() {

    document.getElementById("rd-total-games").textContent =
        visibleGames.length;

    document.getElementById("rd-current-game").textContent =
        visibleGames.length
            ? currentGameIndex + 1
            : 0;

}

/*
==================================================
Discovery Button
Sprint 35.1
==================================================
*/

function handleDiscovery() {

    const needsNewSession =
          discoverySession.filterDirty ||
          !discoverySession.sessionBuilt;

    if (needsNewSession) {

        refreshDiscoverySession();

    }

    // ==========================================
    // Keine Treffer
    // Sprint 27.8
    // ==========================================

    if (visibleGames.length === 0) {

        console.log("Discovery: Keine Treffer.");

        loadGameCounter();

        setLCDMode("nomatch");

        setTimeout(() => {

            setLCDMode("ready");

        }, 2000);

        return;

    }

    spinDiscovery();

}

/*
==================================================
Build Discovery Session
Sprint 36.3
==================================================
*/

function buildSession() {

    const filteredGames = filterGames();

    console.log("-----------");

console.log(
    "Systemfilter:",
    discoverySession.filters.systems
);

console.log(
    "Alle Spiele:",
    allGames.length
);

console.log(
    "Gefilterte Spiele:",
    filteredGames.length
);

console.log("-----------");

    discoverySession.games = [...filteredGames];

    discoverySession.currentGame = null;

    discoverySession.sessionBuilt = true;

    clearFilterDirty();

    console.log(
        "Discovery Session:",
        discoverySession.games.length,
        "Treffer"
    );

}

/*
==================================================
Refresh Discovery Session
Sprint 2.0
==================================================
*/

function refreshDiscoverySession() {

    buildSession();

    visibleGames = [...discoverySession.games];

    currentGameIndex = 0;

    refreshUI();

}

/*
==================================================
Discovery Spin
Sprint 35.4
==================================================
*/

function spinDiscovery() {

    hideViewerActions();

    if (!discoverySession.games.length) {

    console.warn(
        "Keine Spiele gefunden."
    );

    return;

}

    // Die Discovery bestimmt,
    // welche Spiele sichtbar sind.

    visibleGames = [...discoverySession.games];

    const selectedGame = selectDiscoveryGame();

    if (!selectedGame) {

        return;

}

    // Sicherheitsprüfung

    if (!visibleGames.length) {

        console.warn("Keine Spiele für Discovery vorhanden.");

        return;

    }

    // Counter zurücksetzen

    // Zielposition bestimmen

    const targetIndex =
    visibleGames.findIndex(
        game => game.id === selectedGame.id
    );

// Aktuelles Spiel zurücksetzen

    discoverySession.currentGame = null;

    console.log(
        "Discovery Spin:",
        visibleGames.length,
        "Spiele"
    );

// Spin starten

    spinShelf(targetIndex);

}

/*
==================================================
Discovery Filter
Sprint 35.3
==================================================
*/

/*
==================================================
Discovery Filter
Sprint 35.3
==================================================
*/

function filterGames() {

    const filters = discoverySession.filters;

    return allGames.filter(game => {

        // System absichern
        const system = String(game.system ?? "").trim();

        // Genre immer als Array behandeln
        const genres = Array.isArray(game.genre)
            ? game.genre
            : [game.genre];

        // Systemfilter
        let systemMatch = false;

// Keine Systeme aktiv → keine Treffer
if (filters.systems.length === 0) {

    systemMatch = false;

}

// Mindestens ein System aktiv
else {

    systemMatch = filters.systems.some(filter => {

        const systems =
            SYSTEM_GROUPS[filter] ?? [filter];

        return systems.includes(system);

    });

}

        // Genrefilter
        const genreMatch =
            filters.genres.length === 0 ||
            genres.some(genre =>
                filters.genres.includes(genre)
            );

        return systemMatch && genreMatch;

    });

}

/*
==================================================
Discovery Test
Sprint 35.3
==================================================
*/

function testFilter() {

    discoverySession.filters.systems = ["C64"];

    discoverySession.filters.genres = ["Strategie"];

    markFiltersDirty();

}

/*
/*
==================================================
Discovery Selection
Sprint 36.2
==================================================
*/

function selectDiscoveryGame() {

    if (!discoverySession.games.length) {

        return null;

    }

    // Hat die Session nur ein Spiel,
    // gibt es keine Alternative.

    if (discoverySession.games.length === 1) {

        discoverySession.currentGame =
            discoverySession.games[0];

        return discoverySession.currentGame;

    }

    let selectedGame;

    do {

        const index =
            Math.floor(
                Math.random() *
                discoverySession.games.length
            );

        selectedGame =
            discoverySession.games[index];

    }

    while (

        discoverySession.lastGame &&
        selectedGame.id === discoverySession.lastGame.id

    );

    console.log(
    "Gewählt:",
    selectedGame.title
);

console.log(
    "Vorher:",
    discoverySession.lastGame
        ? discoverySession.lastGame.title
        : "-"
);

    discoverySession.lastGame =
        selectedGame;

    discoverySession.currentGame =
        selectedGame;

    return selectedGame;

}

/*
==================================================
System Filter
Sprint 37.1
==================================================
*/

function toggleSystemFilter(system) {

    console.log("toggleSystemFilter:", system);

    const systems =
        discoverySession.filters.systems;

    const index =
        systems.indexOf(system);

    if (index === -1) {

        systems.push(system);

    }

    else {

        systems.splice(index, 1);

    }

    markFiltersDirty();

refreshDiscoverySession();

refreshFilterButtons();

console.log(
    "Systemfilter:",
    systems
);

}

/*
==================================================
Genre Filter
Sprint 37.1
==================================================
*/

function toggleGenreFilter(genre) {

    const genres =
        discoverySession.filters.genres;

    // ======================================
    // Sonderfall:
    // Alle Genres waren aktiv
    // ======================================

    if (genres.length === 0) {

        discoverySession.filters.genres =
            DISCOVERY_CONFIG.genreOrder.filter(
                g => g !== genre
            );

    }

    else {

        const index =
            genres.indexOf(genre);

        if (index === -1) {

            genres.push(genre);

        }

        else {

            // Verhindern, dass alle Genres deaktiviert werden
            if (genres.length === 1) {

                return;

            }

            genres.splice(index, 1);

        }

    }   // <<< DIESE KLAMMER FEHLT BEI DIR

    markFiltersDirty();

    refreshDiscoverySession();

    refreshFilterButtons();

    console.log(
        "Genrefilter:",
        discoverySession.filters.genres
    );

}


/*
==================================================
Initialize Discovery Filters
Sprint 37.5
==================================================
*/

function initializeDiscoveryFilters() {

    // ============================
    // Systemfilter
    // ============================

    const systemButtons =
        document.querySelectorAll(".rd-system-btn");

    systemButtons.forEach(button => {

        button.addEventListener("click", () => {

            toggleSystemFilter(
                button.dataset.system
            );

            refreshFilterButtons();

        });

    });

    // ============================
    // Genrefilter
    // ============================

    const genreButtons =
        document.querySelectorAll(".rd-genre-btn");

    genreButtons.forEach(button => {

        button.addEventListener("click", () => {

            toggleGenreFilter(
                button.dataset.genre
            );

            refreshFilterButtons();

        });

    });

}

/*
==================================================
Create Genre Buttons
Sprint 37.3b
==================================================
*/

function createGenreButtons() {

    const container =
        document.getElementById(
            "genre-filter-container"
        );

    if (!container) {

        return;

    }

    container.innerHTML = "";

    DISCOVERY_CONFIG.genreOrder.forEach(genre => {

    const button =
    document.createElement("button");

button.className =
    "rd-genre-btn";

button.dataset.genre =
    genre;

button.innerHTML = `

    <img
        class="genre-panel"
        src="assets/ui/genre_button.webp"
        alt="">

    <div class="genre-overlay">

        <span class="genre-label">

            ${genre}

        </span>

        <img
            class="genre-led"
            src="assets/ui/system_led.svg"
            alt="">

    </div>

`;

container.appendChild(button);

});

}

/*
==================================================
Create System Buttons
Sprint 37.4
==================================================
*/

function createSystemButtons() {

    const container =
        document.getElementById(
            "system-filter-container"
        );

    if (!container) {

        return;

    }

    container.innerHTML = "";

    DISCOVERY_CONFIG.systems.forEach(system => {

    const button =
        document.createElement("button");

    button.className =
        "rd-system-btn";

    button.dataset.system =
        system;

    button.innerHTML = `

        <div class="rd-system-switch">

    <img
        class="switch-frame"
        src="assets/ui/rocker_frame.svg"
        alt="">

    <img
        class="switch-rocker"
        src="assets/ui/rocker_button.svg"
        alt="">

</div>

        <img
        class="system-led"
        src="assets/ui/system_led.svg"
        alt="">

    `;

    container.appendChild(button);

});

}



/*
==================================================
Refresh Filter UI
Sprint 37.5
==================================================
*/

function refreshFilterButtons() {

    // ============================
    // Systembuttons
    // ============================

    document
        .querySelectorAll(".rd-system-btn")
        .forEach(button => {

            button.classList.toggle(

                "active",

                discoverySession.filters.systems.includes(
                    button.dataset.system
                )

            );

            

        });

    // ============================
    // Genrebuttons
    // ============================

    const allGenresActive =
        discoverySession.filters.genres.length === 0;

    document
        .querySelectorAll(".rd-genre-btn")
        .forEach(button => {

            button.classList.toggle(

                "active",

                allGenresActive ||

                discoverySession.filters.genres.includes(
                    button.dataset.genre
                )         

            );
        
        });

        refreshLCD();
    
}

function updateLCDGame() {

    loadGameCounter();

}

function updateLCDSystems() {

    const lcd =
        document.getElementById("lcd-systems");

    if (!lcd) return;

    const systems =
        discoverySession.filters.systems;

    // Anzahl der verfügbaren Systeme
    const totalSystems =

    DISCOVERY_CONFIG.systems.length;

    // Kein System ausgewählt
    if (systems.length === 0) {

        lcd.textContent = "NONE";
        return;

    }

    // Alle Systeme ausgewählt
    if (systems.length === totalSystems) {

        lcd.textContent = "ALL";
        return;

    }

    // Einzelne Systeme anzeigen
    lcd.textContent =
        systems.join(" ");

}

function updateLCDGenres() {

    const lcd =
        document.getElementById("lcd-genres");

    if (!lcd) return;

    const genres =
        discoverySession.filters.genres;

    const totalGenres =
    DISCOVERY_CONFIG.genreOrder.length;

    if (genres.length === 0) {

        lcd.textContent = "ALL";

        return;

    }

    lcd.textContent =
        `${genres.length} / ${totalGenres}`;

}

/* ==========================================
   LCD State
========================================== */

let lcdMode = "ready";

/* ==========================================
   LCD Refresh
   Sprint 27.5
========================================== */

function refreshLCD() {

    updateLCDGame();

    updateLCDSystems();

    updateLCDGenres();

}

/* ==========================================
   LCD State Machine
========================================== */

function setLCDMode(mode, game = null) {

    lcdMode = mode;

    switch (mode) {

        case "ready":

            renderLCDReady();

            break;

        case "searching":

            renderLCDSearching();

            break;

        case "found":

            renderLCDFound(game);

            break;

        case "nomatch":

            renderLCDNoMatch();

            break;

        case "loading":

            renderLCDLoading();

            break;

    }

}

function renderLCDReady() {

    console.log("READY SCREEN");

    clearInterval(lcdSearchTimer);

    document
    .getElementById("lcd-found")
    .classList.add("hidden");

    document
    .getElementById("lcd-nomatch")
    .classList.add("hidden");

    document
        .getElementById("lcd-ready")
        .classList.remove("hidden");

    document
        .getElementById("lcd-searching")
        .classList.add("hidden");

    refreshLCD();

}

/* ==========================================
   LCD Search Animation
   Sprint 27.6
========================================== */

let lcdSearchTimer = null;

let lcdSearchStep = 0;

function renderLCDSearching() {

    document
        .getElementById("lcd-ready")
        .classList.add("hidden");

    document
        .getElementById("lcd-searching")
        .classList.remove("hidden");

    lcdSearchStep = 0;

    clearInterval(lcdSearchTimer);

    lcdSearchTimer = setInterval(() => {

        lcdSearchStep++;

        const dots =
            ".".repeat(
                (lcdSearchStep % 3) + 1
            );

        document
            .getElementById("lcd-search-status")
            .textContent =
            "SEARCHING" + dots;

        const blocks =
            (lcdSearchStep % 10) + 1;

        document
            .getElementById("lcd-search-progress")
            .textContent =

            "█".repeat(blocks) +

            "░".repeat(10 - blocks);

    }, 90);

}

function renderLCDFound(game) {

    document
        .getElementById("lcd-ready")
        .classList.add("hidden");

    document
        .getElementById("lcd-searching")
        .classList.add("hidden");

    document
        .getElementById("lcd-found")
        .classList.remove("hidden");

    const title =
        document.getElementById("lcd-found-title");

    const system =
        document.getElementById("lcd-found-system");

    const year =
        document.getElementById("lcd-found-year");

    // zuerst alles ausblenden

    title.textContent = "";

    system.textContent = "";

    year.textContent = "";

    // FOUND bleibt sichtbar

    setTimeout(() => {

        title.textContent = game.title;

    }, 150);

    setTimeout(() => {

        system.textContent = game.system;

    }, 300);

    setTimeout(() => {

        year.textContent = game.year;

    }, 450);

}

function renderLCDNoMatch() {

    document
        .getElementById("lcd-ready")
        .classList.add("hidden");

    document
        .getElementById("lcd-searching")
        .classList.add("hidden");

    document
        .getElementById("lcd-found")
        .classList.add("hidden");

    document
        .getElementById("lcd-nomatch")
        .classList.remove("hidden");

}

function renderLCDLoading() {

    console.log("LOADING");

}

//--------------------------------------------------
// URL Game Parameter
//--------------------------------------------------

//--------------------------------------------------
// URL Game Parameter
//--------------------------------------------------

function getGameFromURL(){

    const params = new URLSearchParams(
        window.location.search
    );

    return params.get("game");

}

function loadGameFromURL(){

    const folder = getGameFromURL();

    if(!folder){

        return;

    }

    const game = allGames.find(

        g => g.folder === folder

    );

    if(!game){

        console.warn(

            "Spiel nicht gefunden:",

            folder

        );

        return;

    }

    const index = allGames.findIndex(

    g => g.folder === folder

);

if(index < 0){

    return;

}

currentGameIndex = index;

// -------------------------------------
// Regal synchronisieren
// -------------------------------------

loadGameCounter();

renderer.setCurrentIndex(currentGameIndex);

renderer.assignInitialGames(currentGameIndex);

// -------------------------------------
// Viewer aktualisieren
// -------------------------------------

dispatchGameChanged();

// -------------------------------------
// UI einblenden
// -------------------------------------

showViewerActions();

showFullscreenButton();

}

