const VISIBLE_BOXES = 5;
const HALF_VISIBLE = Math.floor(VISIBLE_BOXES / 2);

let lastFocusedGame = null;

/* ==========================================
   Physikalische Boxgrößen
========================================== */

const BASE_HEIGHT = 185;
const REFERENCE_HEIGHT = 221;

/* ==========================================
   Physikalische Boxgröße berechnen
========================================== */

function setBoxSize(slot, game) {

    const d = game.dimensions;

    const height =
        BASE_HEIGHT *
        (d.height / REFERENCE_HEIGHT);

    const width =
        height *
        (d.width / d.height);

    slot.box.style.width = `${width}px`;
    slot.box.style.height = `${height}px`;

}

/*
==========================================
Stage Layout
==========================================
*/

const shelfBoxes = new Array(VISIBLE_BOXES);

/* ==========================================
   Carousel erzeugen
========================================== */

function createShelf(){

    console.log(">>> createShelf() wurde aufgerufen");

    const track = document.getElementById("rd-carousel-track");

    track.innerHTML = "";

    for (let i = 0; i < VISIBLE_BOXES; i++) {

        const box = document.createElement("div");

        box.className = "rd-box";

        const image = document.createElement("img");

        image.className = "rd-display-image";

        image.draggable = false;

        box.appendChild(image);

        track.appendChild(box);

        shelfBoxes[i] = {

             box,
             image

};    

    }

}

/* ==========================================
   Shelf aktualisieren
========================================== */

function updateShelfSlot(slotIndex, game, offset) {

    const slot = shelfBoxes[slotIndex];

    if (!slot || !game) return;

    const layout = SHELF_SLOTS[offset + HALF_VISIBLE];

    //--------------------------------------------------
// Physikalische Boxgröße
//--------------------------------------------------

slot.image.src =
    `../assets/textures/${game.folder}/Front.webp`;

setBoxSize(slot, game);


    /* Klassen zurücksetzen */

    slot.box.className = "rd-box";

    if(layout.focus){

    slot.box.classList.add("rd-focus");
    slot.box.classList.add("rd-active");

}   

    slot.box.dataset.offset = offset;
    slot.box.dataset.gameId = game.id;

    /* Position */

    slot.box.style.left =
    `calc(50% + ${layout.x}px)`;

    const SHELF_BASE = 0;

// Standardposition aller Boxen
slot.box.style.bottom = `${SHELF_BASE}px`;

// Fokusbox leicht anheben
if (layout.focus) {

    slot.box.style.bottom =
        `${SHELF_BASE + FOCUS_OFFSET}px`;

} else {

    slot.box.style.bottom =
        `${SHELF_BASE}px`;

}

    slot.box.style.opacity =
        layout.opacity;

    slot.box.style.opacity = 1;

    slot.box.style.filter = "none";

    slot.box.classList.toggle(
    "rd-box-focus",
    layout.focus
);

slot.box.classList.toggle(
    "rd-box-side",
    !layout.focus
);

    slot.box.style.zIndex =
    layout.focus ? 100 : layout.z;

    // Nur skalieren – keine Rotation oder Perspektive
    slot.box.style.transform = `
    translateX(-50%)
    scale(${layout.scale})
    ${layout.focus ? "translateY(-4px)" : ""}
`;

    /* Bild */

    slot.image.alt = game.title;

    slot.image.loading = "lazy";

    slot.image.draggable = false;

    slot.image.onerror = () => {

        slot.image.src = "../assets/images/no-cover.webp";

    };

}


/* ==========================================
   Carousel rendern
========================================== */

function updateShelf() {

    if (shelfBoxes.length === 0) return;

    for (let offset = -HALF_VISIBLE; offset <= HALF_VISIBLE; offset++) {

        const slotIndex = offset + HALF_VISIBLE;

        const index = getWrappedIndex(currentGameIndex + offset);

        const game = visibleGames[index];

        updateShelfSlot(slotIndex, game, offset);

    }

     const currentId = visibleGames[currentGameIndex]?.id;

    if (currentId !== lastFocusedGame) {

    lastFocusedGame = currentId;

    const focusBox =
        document.querySelector(".rd-box-focus");

    if (focusBox) {

        focusBox.classList.remove("rd-box-snap");

        void focusBox.offsetWidth;

        focusBox.classList.add("rd-box-snap");

    }

}

}

/* ==========================================
   Endlos-Index
========================================== */

function getWrappedIndex(index) {

    const total = visibleGames.length;

    return ((index % total) + total) % total;

}



