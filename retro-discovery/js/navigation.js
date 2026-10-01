/* =========================================================
   Retro Discovery – Navigation und Cover-Slot-o-mat
========================================================= */

const SHELF_ANIMATION_TIME = 120;
const DISCOVERY_LAUNCH_DELAYS = [320, 250, 190, 145, 110, 90];
const DISCOVERY_CRUISE_CHANGES = 60;
const DISCOVERY_CRUISE_DELAY = 82;
const DISCOVERY_BRAKING_DELAYS = [115, 155, 220, 310, 430, 600, 820];
const DISCOVERY_BUFFER_SIZE = 30;

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

async function showReelGroup(index, animate = true, continuous = false) {
    if (continuous) {
        await renderer.stepTo(index, animate);
    } else {
        renderer.showGroup(index, animate);
    }
}

function createDiscoverySequence(targetIndex) {
    let shownIndex = currentGameIndex;
    const launching = DISCOVERY_LAUNCH_DELAYS.map(() => {
        shownIndex = wrapVisibleGameIndex(shownIndex + 1);
        return shownIndex;
    });
    const cruise = Array.from({ length:DISCOVERY_CRUISE_CHANGES }, () => {
        shownIndex = wrapVisibleGameIndex(shownIndex + 1);
        return shownIndex;
    });
    const braking = DISCOVERY_BRAKING_DELAYS.map((_, change) => {
        const isFinalChange = change === DISCOVERY_BRAKING_DELAYS.length - 1;
        shownIndex = isFinalChange
            ? targetIndex
            : wrapVisibleGameIndex(targetIndex - DISCOVERY_BRAKING_DELAYS.length + change + 1);
        return shownIndex;
    });

    return { launching, cruise, braking };
}

async function runDiscoveryReel(sequence) {

    setReelPhase("launching");
    for (let change = 0; change < sequence.launching.length; change += 1) {
        const centerIndex = sequence.launching[change];
        renderer.prepareAhead(centerIndex, DISCOVERY_BUFFER_SIZE);
        await showReelGroup(centerIndex, true, true);
        const delay = DISCOVERY_LAUNCH_DELAYS[change];
        await waitForDiscoveryStep(delay);
    }

    setReelPhase("full-speed");
    for (const centerIndex of sequence.cruise) {
        renderer.prepareAhead(centerIndex, DISCOVERY_BUFFER_SIZE);
        await showReelGroup(centerIndex, true, true);
        await waitForDiscoveryStep(DISCOVERY_CRUISE_DELAY);
    }

    setReelPhase("braking");
    for (let change = 0; change < sequence.braking.length; change += 1) {
        const isFinalChange = change === DISCOVERY_BRAKING_DELAYS.length - 1;
        const centerIndex = sequence.braking[change];
        const continuous = change > 0;
        await showReelGroup(centerIndex, true, continuous);
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
        const sequence = createDiscoverySequence(targetIndex);

        // Ziel und Bremsweg zuerst absichern. Danach genügt ein Startpuffer;
        // während des Laufs wird er bei jedem Schritt rollend aufgefüllt.
        const brakingReady = renderer.prepareGroups([
            targetIndex,
            ...sequence.braking
        ]);
        const startBufferReady = renderer.prepareAhead(
            currentGameIndex,
            DISCOVERY_BUFFER_SIZE
        );
        await Promise.all([brakingReady, startBufferReady]);

        if (visibleGames.length === 1) {
            renderer.showGroup(targetIndex, false);
        } else {
            await runDiscoveryReel(sequence);
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
