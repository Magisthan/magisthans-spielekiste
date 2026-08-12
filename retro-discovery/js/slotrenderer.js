/* =========================================================

    Slot Renderer V2
    ------------------------------------------

    Aufgabe:

    - besitzt genau 5 Slots
    - erzeugt DOM genau einmal
    - besitzt seinen eigenen Zustand
    - kennt keine Navigation
    - kennt keine Animation
    - kennt keinen Viewer

========================================================= */

/* ==========================================
   Slot Layout
========================================== */

const SLOT_LAYOUT = [

    {
        x: -555,
        bottom: 0,
        scale: 0.70,
        rotateY: -18,
        opacity: 0,
        z: 0,
        focus: false
    },

    {
        x: -370,
        bottom: 0,
        scale: 0.82,
        rotateY: -12,
        opacity: 0.45,
        z: 1,
        focus: false
    },

    {
        x: -185,
        bottom: 0,
        scale: 0.93,
        rotateY: -7,
        opacity: 0.75,
        z: 2,
        focus: false
    },

    {
        x: 0,
        bottom: FOCUS_OFFSET,
        scale: 1.18,
        rotateY: 0,
        opacity: 1,
        z: 5,
        focus: true
    },

    {
        x: 185,
        bottom: 0,
        scale: 0.93,
        rotateY: 7,
        opacity: 0.75,
        z: 2,
        focus: false
    },

    {
        x: 370,
        bottom: 0,
        scale: 0.82,
        rotateY: 12,
        opacity: 0.45,
        z: 1,
        focus: false
    },

    {
        x: 555,
        bottom: 0,
        scale: 0.70,
        rotateY: 18,
        opacity: 0,
        z: 0,
        focus: false
    }

];

const SLOT_COUNT = 7;

class SlotRenderer {

    constructor() {

        // DOM
    this.track = null;

    // Permanente Slot-Objekte
    this.slots = [];

    // Warteschlange für geänderte Slots
    this.dirtySlots = [];

    // Aktuell verfügbare Spiele
    this.games = [];

    // Index des mittleren Spiels
    this.currentCenter = 0;

    // Renderer läuft bereits?
    this.running = false;

    // Renderer bereits initialisiert?
    this.initialized = false;

    }

    /* ==========================================
       Initialisierung
    ========================================== */

    init(games) {

        if (this.initialized) {

            return;

        }

        this.track =
            document.getElementById("rd-carousel-track");

        if (!this.track) {

            console.error(
                "SlotRenderer: rd-carousel-track nicht gefunden."
            );

            return;

        }

        this.games = games;

        this.createDOM();

        this.createSlots();

        //this.assignInitialGames(0);

        this.initialized = true;

        console.log(
            "SlotRenderer initialisiert."
        );

    }

    /* ==========================================
       Bühne vorbereiten
    ========================================== */

    createDOM() {

        this.track.innerHTML = "";

    }

/* ==========================================
   Permanente Slots erzeugen
========================================== */

createSlots() {

    this.slots.length = 0;

    for (let i = 0; i < SLOT_COUNT; i++) {

        const box = document.createElement("div");
        box.className = "rd-box";

        const image = document.createElement("img");
        image.className = "rd-display-image";
        image.draggable = false;
        image.alt = "";

        box.appendChild(image);
        this.track.appendChild(box);

        this.slots.push({

    id: i,

    element: box,

    image: image,

    game: null,

    gameId: null,

    position: i,

    layout: {
        ...SLOT_LAYOUT[i]
    },

    active: false,

    dirty: true

});

    }

    console.log(
        `SlotRenderer: ${this.slots.length} permanente Slots erzeugt.`
    );

}

/* ==========================================
   Spiele zuweisen (nur Initialisierung)
========================================== */

assignInitialGames(startIndex = 0) {

    this.currentCenter = startIndex;

    this.updateSlotGames();

    this.refresh();

    this.running = true;

}

/* ==========================================
   Renderer aktualisieren
========================================== */

refresh() {

    for (let i = 0; i < this.slots.length; i++) {

    const slot = this.slots[i];

    slot.layout = {

        ...SLOT_LAYOUT[i]

    };

    this.applyLayout(slot);

}

while (this.dirtySlots.length) {

    const slot = this.dirtySlots.shift();

    this.applyGame(slot);

}

}

/* ==========================================
   Nur Layout aktualisieren
========================================== */

refreshLayout() {

    for (let i = 0; i < this.slots.length; i++) {

        const slot = this.slots[i];

        slot.layout = {
            ...SLOT_LAYOUT[i]
        };

        this.applyLayout(slot);

    }

}

/* ==========================================
   Ein Schritt nach rechts
========================================== */

next() {

    if (!this.running) return;

    this.currentCenter =
        getWrappedIndex(
            this.currentCenter + 1
        );

    this.updateSlotGames();

    this.refresh();

}

/* ==========================================
   Ein Schritt nach links
========================================== */

previous() {

    if (!this.running) return;

    this.currentCenter =
        getWrappedIndex(
            this.currentCenter - 1
        );

    this.updateSlotGames();

    this.refresh();

}

/* ==========================================
   Spielindex berechnen
========================================== */

getGameIndex(offset) {

    return getWrappedIndex(
        this.currentCenter + offset
    );

}

/* ==========================================
   Spiele neu zuweisen
========================================== */

updateSlotGames() {

    for (let i = 0; i < SLOT_COUNT; i++) {

        const HALF_SLOT = Math.floor(SLOT_COUNT / 2);

        const offset = i - HALF_SLOT;

        const gameIndex =
            this.getGameIndex(offset);

        const slot = this.slots[i];

        const game = this.games[gameIndex];

        if (!game) {

            console.error(
                "Kein Spiel gefunden:",
                gameIndex,
                this.games.length
    );

    continue;

}

if (slot.gameId !== game.id) {

    slot.game = game;
    slot.gameId = game.id;
    this.markDirty(slot);

}

}

}

/* ==========================================
   Slot als geändert markieren
========================================== */

markDirty(slot) {

    slot.dirty = true;

    if (!this.dirtySlots.includes(slot)) {

        this.dirtySlots.push(slot);

    }

}

/*moveRight() {

    const first = this.slots.shift();

    this.slots.push(first);

}
*/





/*moveLeft() {

    const last = this.slots.pop();

    this.slots.unshift(last);

}

*/

/* ==========================================
   Layout anwenden
========================================== */

applyLayout(slot) {

    const layout = slot.layout;

    slot.element.style.left =
        `calc(50% + ${layout.x}px)`;

    slot.element.style.zIndex =
        layout.z;

    slot.element.style.opacity =
        layout.opacity;

    slot.element.style.transform = `
        translateX(-50%)
        translateY(${-layout.bottom}px)
        scale(${layout.scale})
        rotateY(${layout.rotateY}deg)
    `;

    slot.element.classList.toggle(
        "rd-box-focus",
        layout.focus
    );

    slot.element.classList.toggle(
        "rd-focus",
        layout.focus
    );

    slot.element.classList.toggle(
        "rd-active",
        layout.focus
    );

}


/* ==========================================
   Spiel anwenden
========================================== */

applyGame(slot) {

    console.log("applyGame", slot.game?.title, slot.dirty);

    if (!slot.dirty) return;

    if (!slot.game) return;

    console.log(slot.game);

    slot.image.src =
        `../assets/textures/${slot.game.folder}/Front.webp`;

    slot.image.alt =
        slot.game.title;

    this.setBoxSize(slot);

    console.log(
    slot.element.style.width,
    slot.element.style.height
);

    slot.dirty = false;

}

/* ==========================================
   Physikalische Boxgröße
========================================== */

setBoxSize(slot) {

    const d =
        slot.game.dimensions;

    const height =
        BASE_HEIGHT *
        (d.height / REFERENCE_HEIGHT);

    const width =
        height *
        (d.width / d.height);

    slot.element.style.width =
        `${width}px`;

    slot.element.style.height =
        `${height}px`;

}

/* ==========================================
   Öffentliche API
========================================== */

setGames(games) {

    this.games = games;

}

setCurrentIndex(index) {

    this.currentCenter =
        getWrappedIndex(index);

}

getCurrentIndex() {

    return this.currentCenter;

}

getCurrentGame() {

    return this.slots[2].game;

}

getSlots() {

    return this.slots;

}

destroy() {

    if (!this.track) return;

    this.track.innerHTML = "";

    this.slots.length = 0;

    this.games = [];

    this.currentCenter = 0;

    this.running = false;

    this.initialized = false;

    this.running = false;

    console.log(
        "SlotRenderer zerstört."
    );

}

}

/* ==========================================================
   Singleton
========================================================== */

const renderer = new SlotRenderer();

