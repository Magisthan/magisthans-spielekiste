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
        this.coverCache = new Map();
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
            element.className = "rd-cover-slot";
            const images = Array.from({ length: 2 }, (_, imageIndex) => {
                const image = document.createElement("img");
                image.className = "rd-cover-image";
                image.classList.toggle("is-visible", imageIndex === 0);
                image.draggable = false;
                image.decoding = "async";
                image.alt = "";
                element.append(image);
                return image;
            });
            this.track.append(element);
            return {
                element,
                images,
                activeImageIndex:0,
                requestToken:0,
                coverReadyPromise:Promise.resolve(),
                position,
                game:null,
                gameId:null
            };
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
        // Nur die anfangs sichtbare Gruppe vorbereiten. Der Spin verwaltet
        // seinen eigenen rollenden Puffer, statt das gesamte Archiv zu laden.
        this.preloadPromise = this.prepareGroups([this.currentCenter]);
    }

    cacheCover(game) {
        if (!game) return Promise.resolve(null);
        const path = this.coverPath(game);
        const cached = this.coverCache.get(path);
        if (cached) return cached.promise;

        const image = new Image();
        image.decoding = "async";

        const entry = {
            image,
            path,
            ready:false,
            failed:false,
            promise:null
        };

        entry.promise = new Promise(resolve => {
            image.addEventListener("load", async () => {
                try {
                    if (typeof image.decode === "function") await image.decode();
                    entry.ready = true;
                    resolve(entry);
                } catch (error) {
                    entry.failed = true;
                    resolve(null);
                }
            }, { once:true });
            image.addEventListener("error", () => {
                entry.failed = true;
                resolve(null);
            }, { once:true });
            image.src = path;
        });

        this.coverCache.set(path, entry);
        return entry.promise;
    }

    prepareGroups(centerIndexes) {
        const games = new Map();

        centerIndexes.forEach(centerIndex => {
            for (let position = 0; position < SLOT_COUNT; position += 1) {
                const gameIndex = this.wrap(centerIndex + position - CENTER_SLOT);
                const game = this.games[gameIndex];
                if (game) games.set(game.id ?? this.coverPath(game), game);
            }
        });

        return Promise.all(Array.from(games.values(), game => this.cacheCover(game)));
    }

    prepareAhead(centerIndex, count = 30, direction = 1) {
        const games = [];
        const seen = new Set();
        const normalizedDirection = direction < 0 ? -1 : 1;

        for (let offset = -CENTER_SLOT; offset < count + CENTER_SLOT; offset += 1) {
            const gameIndex = this.wrap(centerIndex + offset * normalizedDirection);
            const game = this.games[gameIndex];
            const key = game?.id ?? (game ? this.coverPath(game) : null);
            if (game && !seen.has(key)) {
                seen.add(key);
                games.push(game);
            }
        }

        return Promise.all(games.map(game => this.cacheCover(game)));
    }

    async displayCover(slot, game) {
        const requestToken = ++slot.requestToken;
        const entry = await this.cacheCover(game);

        if (!entry?.ready || slot.requestToken !== requestToken) return;

        const nextImageIndex = slot.activeImageIndex === 0 ? 1 : 0;
        const nextImage = slot.images[nextImageIndex];

        if (nextImage.src !== entry.image.src) nextImage.src = entry.image.src;

        // Das Cache-Bild wurde bereits vollständig dekodiert. Ein zweites
        // decode() auf jedem DOM-Bild würde bei den 82-ms-Schritten häufig
        // erst nach der nächsten Anforderung fertig und den Wechsel dadurch
        // verwerfen. Nur wenn der Browser den Cache nicht synchron übernimmt,
        // warten wir noch auf das Load-Ereignis der Pufferebene.
        if (!nextImage.complete || !nextImage.naturalWidth) {
            const loaded = await new Promise(resolve => {
                const onLoad = () => resolve(true);
                const onError = () => resolve(false);
                nextImage.addEventListener("load", onLoad, { once:true });
                nextImage.addEventListener("error", onError, { once:true });
            });
            if (!loaded) return;
        }

        if (slot.requestToken !== requestToken) return;

        this.classifyCoverFormat(slot.element, entry.image);
        nextImage.alt = game.title || window.RDI18n?.t("slot.coverAlt") || "Game cover";
        slot.images[slot.activeImageIndex].classList.remove("is-visible");
        nextImage.classList.add("is-visible");
        slot.activeImageIndex = nextImageIndex;

        // Ein Wechsel im verdeckten Recycling-Slot muss auch tatsächlich
        // gerendert worden sein, bevor dieser Slot an Position 6 weiterläuft.
        // Zwei Frames verhindern, dass der Browser die Bildumschaltung und
        // die anschließende Positionsänderung in einem Paint zusammenfasst.
        if (slot.element.classList.contains("rd-cover-buffer-slot")) {
            await new Promise(resolve => {
                requestAnimationFrame(() => requestAnimationFrame(resolve));
            });
        }
    }

    queueCover(slot, game) {
        slot.coverReadyPromise = this.displayCover(slot, game);
        return slot.coverReadyPromise;
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
            this.queueCover(slot, game);
            this.applyLayout(slot, SLOT_LAYOUT[position]);
        });

        if (animate) this.triggerStep();
    }

    async stepTo(centerIndex, animate = true) {
        if (!this.games.length || !this.slots.length) return;

        const nextCenter = this.wrap(centerIndex);
        const forwardCenter = this.wrap(this.currentCenter + 1);
        const backwardCenter = this.wrap(this.currentCenter - 1);

        if (nextCenter !== forwardCenter && nextCenter !== backwardCenter) {
            this.showGroup(nextCenter, animate);
            return;
        }

        const direction = nextCenter === forwardCenter ? 1 : -1;

        // Der bisher verdeckte Eintrittsslot darf erst sichtbar werden, wenn
        // sein vorbereitetes Cover wirklich in der DOM-Bildebene angekommen
        // ist. So findet der Wechsel ausschließlich im unsichtbaren Slot 7
        // (beziehungsweise Slot 1 bei Gegenrichtung) statt.
        const incomingSlot = direction > 0
            ? this.slots[SLOT_COUNT - 1]
            : this.slots[0];
        await incomingSlot.coverReadyPromise;

        const recycledSlot = direction > 0 ? this.slots.shift() : this.slots.pop();

        if (direction > 0) {
            this.slots.push(recycledSlot);
        } else {
            this.slots.unshift(recycledSlot);
        }

        this.currentCenter = nextCenter;
        const edgePosition = direction > 0 ? SLOT_COUNT - 1 : 0;
        const gameIndex = this.wrap(
            this.currentCenter + edgePosition - CENTER_SLOT
        );
        const game = this.games[gameIndex];

        recycledSlot.game = game;
        recycledSlot.gameId = game.id;
        this.queueCover(recycledSlot, game);

        this.slots.forEach((slot, position) => {
            slot.position = position;
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
        slot.element.dataset.slotPosition = slot.position;
        slot.element.style.left = `calc(50% + ${layout.x}px)`;
        slot.element.style.bottom = "0";
        slot.element.style.zIndex = layout.z;
        slot.element.style.opacity = layout.opacity;
        slot.element.style.transform = `translateX(-50%) scale(${layout.scale})`;
        slot.element.classList.toggle("rd-cover-focus", layout.focus);
        slot.element.classList.toggle("rd-cover-buffer-slot", layout.opacity === 0);
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
        this.coverCache.clear();
        this.currentCenter = 0;
        this.running = false;
        this.initialized = false;
    }
}

const renderer = new SlotRenderer();
