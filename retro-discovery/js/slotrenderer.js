/* =========================================================
   Retro Discovery – Cover Slot Renderer

   Zeigt sieben permanente, normierte Cover-Slots. Der Renderer
   kennt weder Discovery-Zufall noch Viewer-Logik; er stellt nur
   die von navigation.js angeforderte Gruppe dar.
========================================================= */

const SLOT_LAYOUT = [
    { x: -684, scale: 1, opacity: 0, z: 0, focus: false },
    { x: -456, scale: 1, opacity: 1, z: 1, focus: false },
    { x: -228, scale: 1, opacity: 1, z: 2, focus: false },
    { x: 0, scale: 1, opacity: 1, z: 5, focus: true },
    { x: 228, scale: 1, opacity: 1, z: 2, focus: false },
    { x: 456, scale: 1, opacity: 1, z: 1, focus: false },
    { x: 684, scale: 1, opacity: 0, z: 0, focus: false }
];

const SLOT_COUNT = SLOT_LAYOUT.length;
const CENTER_SLOT = Math.floor(SLOT_COUNT / 2);

class SlotRenderer {
    constructor() {
        this.track = null;
        this.slots = [];
        this.games = [];
        this.currentCenter = 0;
        this.running = false;
        this.initialized = false;
        this.preloadPromise = Promise.resolve();
    }

    init(games) {
        if (this.initialized) return;
        this.track = document.getElementById("rd-carousel-track");
        if (!this.track) {
            console.error("SlotRenderer: rd-carousel-track nicht gefunden.");
            return;
        }
        this.createDOM();
        this.createLighting();
        this.createSlots();
        this.createSelectionGate();
        this.setGames(games);
        this.initialized = true;
    }

    createDOM() {
        this.track.replaceChildren();
        this.track.classList.add("rd-cover-reel");
        this.track.dataset.reelPhase = "ready";
    }

    createLighting() {
        const lighting = document.createElement("div");
        lighting.className = "rd-reel-lighting";
        lighting.setAttribute("aria-hidden", "true");
        lighting.innerHTML = `
            <span class="rd-reel-top-transition"></span>
            <span class="rd-reel-top-reflection"></span>
            <span class="rd-reel-center-light"></span>
            <span class="rd-reel-edge-mask rd-reel-edge-mask-left"></span>
            <span class="rd-reel-edge-mask rd-reel-edge-mask-right"></span>
            <span class="rd-reel-light-sweep"></span>
            <span class="rd-reel-rail-shade"></span>
        `;
        this.track.append(lighting);
    }

    createSlots() {
        this.slots = Array.from({ length: SLOT_COUNT }, (_, position) => {
            const element = document.createElement("div");
            const image = document.createElement("img");
            element.className = "rd-cover-slot";
            image.className = "rd-cover-image";
            image.draggable = false;
            image.decoding = "async";
            image.addEventListener("load", () => {
                this.classifyCoverFormat(element, image);
            });
            element.append(image);
            this.track.append(element);
            return { element, image, position, game: null, gameId: null };
        });
    }

    createSelectionGate() {
        const gate = document.createElement("div");
        gate.className = "rd-selection-gate";
        gate.setAttribute("aria-hidden", "true");
        gate.innerHTML = "<span>SELECT</span>";
        this.track.append(gate);
        this.selectionGate = gate;
    }

    wrap(index) {
        const total = this.games.length;
        return total ? ((index % total) + total) % total : 0;
    }

    coverPath(game) {
        return `../assets/textures/${game.folder}/front.webp`;
    }

    classifyCoverFormat(element, image) {
        const ratio = image.naturalWidth / image.naturalHeight;

        element.classList.remove(
            "rd-cover-portrait",
            "rd-cover-square",
            "rd-cover-wide"
        );

        if (!Number.isFinite(ratio)) return;

        if (ratio >= 1.12) {
            element.classList.add("rd-cover-wide");
        } else if (ratio >= 0.88) {
            element.classList.add("rd-cover-square");
        } else {
            element.classList.add("rd-cover-portrait");
        }
    }

    setGames(games) {
        this.games = Array.isArray(games) ? games : [];
        this.currentCenter = this.wrap(this.currentCenter);
        this.preloadPromise = this.preloadGames();
    }

    preloadGames() {
        return Promise.all(this.games.map(game => new Promise(resolve => {
            const image = new Image();
            image.onload = image.onerror = resolve;
            image.src = this.coverPath(game);
        })));
    }

    assignInitialGames(startIndex = 0) {
        this.showGroup(startIndex, false);
        this.running = true;
    }

    showGroup(centerIndex, animate = false) {
        if (!this.games.length || !this.slots.length) return;
        this.currentCenter = this.wrap(centerIndex);

        this.slots.forEach((slot, position) => {
            const gameIndex = this.wrap(this.currentCenter + position - CENTER_SLOT);
            const game = this.games[gameIndex];
            slot.game = game;
            slot.gameId = game.id;
            slot.image.src = this.coverPath(game);
            slot.image.alt = game.title || "Spielcover";
            this.applyLayout(slot, SLOT_LAYOUT[position]);
        });

        if (animate) this.triggerStep();
    }

    triggerStep() {
        this.track.classList.remove("rd-cover-step");
        void this.track.offsetWidth;
        this.track.classList.add("rd-cover-step");
    }

    applyLayout(slot, layout) {
        slot.element.style.left = `calc(50% + ${layout.x}px)`;
        slot.element.style.bottom = "0";
        slot.element.style.zIndex = layout.z;
        slot.element.style.opacity = layout.opacity;
        slot.element.style.transform = `translateX(-50%) scale(${layout.scale})`;
        slot.element.classList.toggle("rd-cover-focus", layout.focus);
    }

    refresh() {
        this.showGroup(this.currentCenter, false);
    }

    refreshLayout() {
        this.slots.forEach((slot, position) => this.applyLayout(slot, SLOT_LAYOUT[position]));
    }

    next() {
        if (!this.running) return;
        this.showGroup(this.currentCenter + 1, true);
    }

    previous() {
        if (!this.running) return;
        this.showGroup(this.currentCenter - 1, true);
    }

    setCurrentIndex(index) {
        this.currentCenter = this.wrap(index);
    }

    getCurrentIndex() {
        return this.currentCenter;
    }

    getCurrentGame() {
        return this.slots[CENTER_SLOT]?.game || null;
    }

    getSlots() {
        return this.slots;
    }

    destroy() {
        if (!this.track) return;
        this.track.replaceChildren();
        this.track.classList.remove("rd-cover-reel", "rd-cover-step");
        this.slots = [];
        this.games = [];
        this.currentCenter = 0;
        this.running = false;
        this.initialized = false;
    }
}

const renderer = new SlotRenderer();
