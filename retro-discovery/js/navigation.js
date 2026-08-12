/* ==========================================
   Shelf bewegen
========================================== */


/* ==========================================
   Discovery Spin
========================================== */

const MIN_SPIN_STEPS = 12;
const MAX_SPIN_STEPS = 18;

const SHELF_ANIMATION_TIME = 120;


let isAnimating = false;

let isSpinning = false;

function moveShelf(direction) {

    if (isAnimating && !isSpinning) return;

    isAnimating = true;

    currentGameIndex =
    getWrappedIndex(currentGameIndex + direction);

// Nur das Regal aktualisieren
    // Nur das Regal aktualisieren
loadGameCounter();

renderer.setCurrentIndex(currentGameIndex);
renderer.assignInitialGames(currentGameIndex);

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

    // ==========================================
// Sprint 2.5
// Sicherheitsprüfung
// ==========================================

if (visibleGames.length === 0) {

    return;

}

if (targetIndex < 0) {

    console.warn("Discovery: Ungültiger Zielindex.");

    return;

}

    const viewer = document.getElementById("viewer3d");
    viewer.style.visibility = "hidden";

    hideViewerActions();

    hideFullscreenButton();

    hideCommunity();

    if (isAnimating || isSpinning) return;

    isSpinning = true;

    const button =
        document.getElementById("discovery-button");

    button.disabled = true;

    setLCDMode("searching");

    // ==========================================
// Ziel berechnen
// Sprint 58A
// ==========================================

    const spinSteps =
    Math.floor(
        Math.random() *
        (MAX_SPIN_STEPS - MIN_SPIN_STEPS + 1)
    ) + MIN_SPIN_STEPS;

    const startIndex =
    getWrappedIndex(
        targetIndex - spinSteps +1
    );

    const direction = 1;

    let delay = 70;

    currentGameIndex = startIndex;

    loadGameCounter();

    renderer.setCurrentIndex(currentGameIndex);
    renderer.assignInitialGames(currentGameIndex);

    console.log("========== START SPIN ==========");
    console.log({
    currentGameIndex,
    startIndex,
    targetIndex,
    spinSteps
});

    for (let i = 0; i < spinSteps; i++) {

        moveShelf(direction);

        await new Promise(resolve =>
            setTimeout(resolve, delay));

        if (delay < 220) {

            delay += 8;

        }

    }

console.log("ENDE", {
    currentGameIndex,
    targetIndex,
    spinSteps,
    difference:
        (targetIndex - currentGameIndex + visibleGames.length)
        % visibleGames.length
});

button.disabled = false;

isSpinning = false;

dispatchGameChanged();

viewer.style.visibility = "visible";

showViewerActions();

showFullscreenButton();

// aktuelles Spiel anzeigen

console.log("Vor FOUND");
console.log(visibleGames[currentGameIndex]);

setLCDMode(
    "found",
    visibleGames[currentGameIndex]
);

console.log("Nach FOUND");
// nach 1,5 Sekunden zurück

setTimeout(() => {

    setLCDMode("ready");

}, 2200);

}

/* ==========================================
   Tastatursteuerung
========================================== */

document.addEventListener("keydown", (event) => {

    switch (event.key) {

        case "ArrowLeft":

            previousGame();

            break;

        case "ArrowRight":

            nextGame();

            break;

    }

});

/* ==========================================
   Mausrad
========================================== */

//document.addEventListener("DOMContentLoaded", () => {

//    const shelf =
//        document.querySelector(".rd-carousel-section");
//
//    if (!shelf) return;
//
//  shelf.addEventListener("wheel", (event) => {
//
//        event.preventDefault();
//
//        if (event.deltaY > 0) {
//
//            nextGame();
//
//        } else {
//
//           previousGame();
//
//        }
//
//    });
//
//});

