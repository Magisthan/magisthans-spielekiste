/* =========================================================
   Retro Discovery – Navigation und Cover-Slot-o-mat
========================================================= */

const SHELF_ANIMATION_TIME = 120;
const DISCOVERY_LAUNCH_DELAYS = [320, 250, 190, 145, 110, 90];
const DISCOVERY_CRUISE_CHANGES = 60;
const DISCOVERY_CRUISE_DELAY = 82;
const DISCOVERY_BRAKING_DELAYS = [115, 155, 220, 310, 430, 600, 820];

let isAnimating = false;
let isSpinning = false;

function waitForDiscoveryStep(duration) {
    return new Promise(resolve => setTimeout(resolve, duration));
}

function wrapVisibleGameIndex(index) {
    const total = visibleGames.length;
    return total ? ((index % total) + total) % total : 0;
}

function setReelPhase(phase) {
    const track = document.getElementById("rd-carousel-track");
    if (track) track.dataset.reelPhase = phase;

    const status = document.getElementById("lcd-search-status");
    if (!status) return;

    const labels = {
        launching: "SPINNING UP",
        "full-speed": "SEARCHING ARCHIVE",
        braking: "TARGET LOCK",
        locked: "DISCOVERY FOUND"
    };
    if (labels[phase]) status.textContent = labels[phase];
}

function chooseReelIndex(previousIndex, targetIndex) {
    const candidates = visibleGames
        .map((game, index) => index)
        .filter(index => index !== previousIndex && index !== targetIndex);

    const fallback = visibleGames
        .map((game, index) => index)
        .filter(index => index !== previousIndex);

    const pool = candidates.length ? candidates : fallback;
    if (!pool.length) return targetIndex;
    return pool[Math.floor(Math.random() * pool.length)];
}

function showReelGroup(index, animate = true) {
    renderer.showGroup(index, animate);
}

async function runDiscoveryReel(targetIndex) {
    let shownIndex = currentGameIndex;

    setReelPhase("launching");
    for (const delay of DISCOVERY_LAUNCH_DELAYS) {
        shownIndex = chooseReelIndex(shownIndex, targetIndex);
        showReelGroup(shownIndex);
        await waitForDiscoveryStep(delay);
    }

    setReelPhase("full-speed");
    for (let change = 0; change < DISCOVERY_CRUISE_CHANGES; change += 1) {
        shownIndex = chooseReelIndex(shownIndex, targetIndex);
        showReelGroup(shownIndex);
        await waitForDiscoveryStep(DISCOVERY_CRUISE_DELAY);
    }

    setReelPhase("braking");
    for (let change = 0; change < DISCOVERY_BRAKING_DELAYS.length; change += 1) {
        const isFinalChange = change === DISCOVERY_BRAKING_DELAYS.length - 1;
        shownIndex = isFinalChange
            ? targetIndex
            : chooseReelIndex(shownIndex, targetIndex);
        showReelGroup(shownIndex);
        if (!isFinalChange) {
            await waitForDiscoveryStep(DISCOVERY_BRAKING_DELAYS[change]);
        }
    }
}

function moveShelf(direction) {
    if (isAnimating || isSpinning || !visibleGames.length) return;
    isAnimating = true;
    currentGameIndex = wrapVisibleGameIndex(currentGameIndex + direction);
    renderer.showGroup(currentGameIndex, true);
    loadGameCounter();

    setTimeout(() => {
        isAnimating = false;
        hideCommunity();
    }, SHELF_ANIMATION_TIME);
}

function nextGame() {
    moveShelf(1);
}

function previousGame() {
    moveShelf(-1);
}

async function spinShelf(targetIndex) {
    if (!visibleGames.length || targetIndex < 0) return;
    if (isAnimating || isSpinning) return;

    isSpinning = true;
    const viewer = document.getElementById("viewer3d");
    const button = document.getElementById("discovery-button");

    if(typeof hideViewerGameTitle === "function"){
        hideViewerGameTitle();
    }

    if (viewer) viewer.style.visibility = "hidden";
    hideViewerActions();
    hideFullscreenButton();
    hideCommunity();

    if (button) {
        button.classList.add("is-spinning");
        button.setAttribute("aria-disabled", "true");
    }

    setLCDMode("searching");

    try {
        await renderer.preloadPromise;

        if (visibleGames.length === 1) {
            renderer.showGroup(targetIndex, false);
        } else {
            await runDiscoveryReel(targetIndex);
        }

        currentGameIndex = targetIndex;
        renderer.showGroup(currentGameIndex, false);
        renderer.track?.classList.remove("rd-cover-step");
        setReelPhase("locked");
        loadGameCounter();

        await waitForDiscoveryStep(520);
        dispatchGameChanged();

        if (viewer) viewer.style.visibility = "visible";
        showViewerActions();
        showFullscreenButton();
        setLCDMode("found", visibleGames[currentGameIndex]);

        setTimeout(() => {
            setLCDMode("ready");
            setReelPhase("ready");
        }, 2200);
    } finally {
        isSpinning = false;
        if (button) {
            button.classList.remove("is-spinning");
            button.removeAttribute("aria-disabled");
        }
    }
}

document.addEventListener("keydown", event => {
    if (event.key === "ArrowLeft") previousGame();
    if (event.key === "ArrowRight") nextGame();
});
