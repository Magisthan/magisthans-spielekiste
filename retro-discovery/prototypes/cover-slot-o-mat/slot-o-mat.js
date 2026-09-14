"use strict";

class CoverReel extends EventTarget {
    constructor(track, motionToggle) {
        super();
        this.track = track;
        this.window = track.closest(".reel-window");
        this.motionToggle = motionToggle;
        this.games = [];
        this.preloadedImages = [];
        this.slots = [];
        this.currentIndex = 0;
        this.running = false;
        this.resizeObserver = new ResizeObserver(() => this.render());
    }

    init(games, startIndex = 0) {
        this.games = Array.isArray(games) ? games.filter(Boolean) : [];
        if (!this.games.length) return;
        this.currentIndex = this.wrap(startIndex);
        this.createSlots();
        this.showIndex(this.currentIndex, false);
        this.preloadPromise = this.preloadCovers();
        this.resizeObserver.observe(this.window);
    }

    wrap(index) {
        return ((index % this.games.length) + this.games.length) % this.games.length;
    }

    coverPath(game) {
        return `../../../assets/textures/${game.folder}/front.webp`;
    }

    createSlots() {
        this.track.replaceChildren();
        this.slots = Array.from({ length: 7 }, () => {
            const element = document.createElement("div");
            const image = document.createElement("img");
            element.className = "cover-slot";
            image.draggable = false;
            image.decoding = "async";
            element.append(image);
            this.track.append(element);
            return { element, image };
        });
    }

    preloadCovers() {
        return Promise.all(this.games.map(game => new Promise(resolve => {
            const image = new Image();
            image.onload = () => resolve(image);
            image.onerror = () => resolve(null);
            image.src = this.coverPath(game);
        }))).then(images => {
            this.preloadedImages = images;
        });
    }

    metrics() {
        const width = this.slots[0]?.element.offsetWidth || 120;
        const gap = window.innerWidth <= 700 ? 13 : Math.max(16, Math.min(window.innerWidth * .022, 38));
        return { step: width + gap };
    }

    render() {
        const { step } = this.metrics();
        this.slots.forEach((slot, position) => {
            const distance = position - 3;
            const scale = distance === 0 ? 1 : Math.max(.84, 1 - Math.abs(distance) * .04);
            slot.element.style.transform = `translate(calc(-50% + ${distance * step}px), -50%) scale(${scale})`;
            slot.element.style.zIndex = String(10 - Math.abs(distance));
            slot.element.style.opacity = Math.abs(distance) >= 3 ? "0" : "1";
            slot.element.dataset.distance = distance === 0 ? "0" : "1";
        });
    }

    assignGroup(centerIndex) {
        this.slots.forEach((slot, position) => {
            const game = this.games[this.wrap(centerIndex + position - 3)];
            slot.image.src = this.coverPath(game);
            slot.image.alt = game.title || "Spielcover";
        });
    }

    pulse() {
        this.track.classList.remove("cover-step");
        void this.track.offsetWidth;
        this.track.classList.add("cover-step");
    }

    showIndex(index, animate = true) {
        this.currentIndex = this.wrap(index);
        this.assignGroup(this.currentIndex);
        this.render();
        if (animate) this.pulse();
    }

    setPhase(phase) {
        this.window.classList.remove("phase-launching", "phase-full-speed", "phase-braking", "phase-locked");
        this.window.classList.add(`phase-${phase}`);
        this.dispatchEvent(new CustomEvent("phaseChanged", { detail: { phase } }));
    }

    wait(duration) {
        return new Promise(resolve => setTimeout(resolve, duration));
    }

    nextRandomIndex(previousIndex, forbiddenIndex = null) {
        let index;
        do index = Math.floor(Math.random() * this.games.length);
        while (index === previousIndex || index === forbiddenIndex);
        return index;
    }

    async runAutomaticPresses(targetIndex) {
        const launchDelays = [320, 250, 190, 145, 110, 90];
        const cruiseChanges = 60;
        const cruiseDelay = 82;
        const brakingDelays = [115, 155, 220, 310, 430, 600, 820];
        let shownIndex = this.currentIndex;

        this.setPhase("launching");
        for (const delay of launchDelays) {
            shownIndex = this.nextRandomIndex(shownIndex, targetIndex);
            this.showIndex(shownIndex);
            await this.wait(delay);
        }

        this.setPhase("full-speed");
        for (let change = 0; change < cruiseChanges; change += 1) {
            shownIndex = this.nextRandomIndex(shownIndex, targetIndex);
            this.showIndex(shownIndex);
            await this.wait(cruiseDelay);
        }

        this.setPhase("braking");
        for (let change = 0; change < brakingDelays.length; change += 1) {
            const isFinalChange = change === brakingDelays.length - 1;
            shownIndex = isFinalChange
                ? targetIndex
                : this.nextRandomIndex(shownIndex, targetIndex);
            this.showIndex(shownIndex);
            if (!isFinalChange) await this.wait(brakingDelays[change]);
        }
    }

    async spinTo(targetIndex) {
        if (this.running || !this.games.length) return null;
        targetIndex = this.wrap(targetIndex);
        this.running = true;

        if (this.motionToggle?.checked) {
            if (this.preloadPromise) await this.preloadPromise;
            await this.runAutomaticPresses(targetIndex);
        } else {
            this.showIndex(targetIndex, false);
        }

        this.track.classList.remove("cover-step");
        this.showIndex(targetIndex, false);
        this.setPhase("locked");
        await this.wait(520);
        this.window.classList.remove("phase-locked");
        this.running = false;

        const game = this.games[targetIndex];
        this.dispatchEvent(new CustomEvent("selectionChanged", { detail: { game, index: targetIndex } }));
        return game;
    }

    snapToTarget(targetIndex) {
        this.showIndex(targetIndex, false);
    }

    destroy() {
        this.resizeObserver.disconnect();
        this.track.replaceChildren();
        this.window.classList.remove("phase-launching", "phase-full-speed", "phase-braking", "phase-locked");
        this.games = [];
        this.preloadedImages = [];
        this.slots = [];
        this.running = false;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const machine = document.querySelector(".machine");
    const track = document.getElementById("reel-track");
    const button = document.getElementById("discovery-button");
    const motionToggle = document.getElementById("full-motion-toggle");
    const status = document.getElementById("status-label");
    const title = document.getElementById("result-title");
    const meta = document.getElementById("result-meta");

    if (typeof GAMES === "undefined" || !GAMES.length) {
        status.textContent = "DATA ERROR";
        title.textContent = "Spieldaten konnten nicht geladen werden";
        button.disabled = true;
        return;
    }

    const coverReel = new CoverReel(track, motionToggle);
    coverReel.init(GAMES);
    let lastSelection = coverReel.currentIndex;

    coverReel.addEventListener("phaseChanged", event => {
        const messages = {
            launching: ["SPIN UP", "Cover-Suche läuft an …", "DISCOVERY SEQUENCE STARTED"],
            "full-speed": ["FULL SPEED", "Sammlung wird durchsucht …", "RAPID RANDOM SCAN"],
            braking: ["BRAKING", "Treffer wird eingegrenzt …", "TARGET LOCK IN PROGRESS"],
            locked: ["TARGET LOCK", "Entdeckung gefunden", "SELECTION CONFIRMED"]
        };
        const message = messages[event.detail.phase];
        if (message) [status.textContent, title.textContent, meta.textContent] = message;
    });

    coverReel.addEventListener("selectionChanged", event => {
        const { game, index } = event.detail;
        lastSelection = index;
        machine.classList.remove("is-searching");
        machine.classList.add("is-found");
        status.textContent = "FOUND";
        title.textContent = game.title;
        meta.textContent = [game.system, game.year].filter(Boolean).join(" // ");
        button.disabled = false;
        motionToggle.disabled = false;
        setTimeout(() => {
            machine.classList.remove("is-found");
            status.textContent = "READY";
        }, 1800);
    });

    button.addEventListener("click", async () => {
        if (coverReel.running || GAMES.length < 2) return;
        let targetIndex;
        do targetIndex = Math.floor(Math.random() * GAMES.length);
        while (targetIndex === lastSelection);

        button.disabled = true;
        motionToggle.disabled = true;
        machine.classList.remove("is-found");
        machine.classList.add("is-searching");
        await coverReel.spinTo(targetIndex);
    });

    window.coverReelPrototype = coverReel;
});
