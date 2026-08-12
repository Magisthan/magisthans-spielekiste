/*
==============================================================================
 Retro Discovery
 Carousel Engine V2
------------------------------------------------------------------------------
 Entwickler : Magisthans Spielekiste
 Architektur : Track Engine
 Version     : 2.0.0
==============================================================================

 Architektur

 Die Engine besitzt KEINE Slots.

 Jede Box besitzt nur eine Position auf einer virtuellen Schiene.

 screenPosition =

 trackPosition - trackOffset

 Alle sichtbaren Eigenschaften werden daraus berechnet.

==============================================================================
*/

/*=============================================================================
    Konfiguration
=============================================================================*/

const BOX_COUNT = 5;

const HALF_BOXES = Math.floor(BOX_COUNT / 2);

const BASE_HEIGHT = 185;

const REFERENCE_HEIGHT = 221;

const CENTER_SCALE = 1.18;

const SIDE_SCALE = 0.86;

const CENTER_OPACITY = 1.0;

const SIDE_OPACITY = 0.65;

const MAX_Z = 100;

const TRACK_LIMIT = HALF_BOXES + 0.5;

const LERP_SPEED = 0.16;

const DEFAULT_SPIN_SPEED = 0.055;

const TRACK_STEP = 1;

/*=============================================================================
    Carousel Box
=============================================================================*/

class CarouselBox {

    constructor(id) {

        this.id = id;

        this.game = null;

        this.gameIndex = -1;

        this.trackPosition = 0;

        this.screenPosition = 0;

        this.element = null;

        this.image = null;

        this.width = 0;

        this.height = BASE_HEIGHT;

        this.active = false;

        this.visible = true;        

    }

}

CarouselBox.prototype.create = function () {

    this.element = document.createElement("div");

    this.element.className = "rd-box";

    this.image = document.createElement("img");

    this.image.className = "rd-display-image";

    this.image.draggable = false;

    this.image.loading = "lazy";

    this.element.appendChild(this.image);

    return this.element;

};

CarouselBox.prototype.setGame = function (game, gameIndex) {

    this.game = game;

    this.gameIndex = gameIndex;

    if (!game)
        return;

    this.image.src =
        `assets/textures/${game.folder}/Front.webp`;

    this.image.alt =
        game.title || "";

};

CarouselBox.prototype.updateSize = function () {

    if (!this.game)
        return;

    const ratio =

        this.game.width && this.game.height

            ? this.game.width / this.game.height

            : 120 / 221;

    this.height = BASE_HEIGHT;

    this.width = this.height * ratio;

    this.element.style.width = `${this.width}px`;

    this.element.style.height = `${this.height}px`;

};

CarouselBox.prototype.updateClasses = function () {

    this.element.classList.toggle(

        "rd-focus",

        this.active

    );

    this.element.classList.toggle(

        "rd-box-focus",

        this.active

    );

    this.element.classList.toggle(

        "rd-box-side",

        !this.active

    );

};

CarouselBox.prototype.refresh = function () {

    this.updateSize();

    this.updateClasses();

};

/*=============================================================================
    Carousel Engine
=============================================================================*/

class CarouselEngine {

    constructor() {

        console.log("Carousel Engine V2");

        this.track = null;

        this.trackRect = null;

        this.boxes = [];

        this.games = [];

        this.visibleGames = [];

        this.currentGameIndex = 0;

        this.trackOffset = 0;

        this.velocity = 0;

        this.targetVelocity = 0;

        this.maxVelocity = DEFAULT_SPIN_SPEED;

        this.animating = false;

        this.animationFrame = null;

        this.focusedBox = null;

        this.initialized = false;

    }

}

/*=============================================================================
    Hilfsfunktionen
=============================================================================*/

CarouselEngine.prototype.clamp = function (v, min, max) {

    return Math.max(min, Math.min(max, v));

};

CarouselEngine.prototype.wrapGameIndex = function (index) {

    const total = this.visibleGames.length;

    if (total === 0)
        return 0;

    while (index < 0)
        index += total;

    while (index >= total)
        index -= total;

    return index;

};

/*=============================================================================
    Spiele setzen
=============================================================================*/

CarouselEngine.prototype.setGames = function (games) {

    this.visibleGames = games || [];

    this.currentGameIndex = 0;

};

/*=============================================================================
    Boxen erzeugen
=============================================================================*/

CarouselEngine.prototype.createBoxes = function () {

    this.track = document.getElementById("rd-carousel-track");

    if (!this.track) {

        console.error("Carousel Track nicht gefunden.");

        return;

    }

    this.track.innerHTML = "";

    this.boxes = [];

    for (let i = 0; i < BOX_COUNT; i++) {

        const box = new CarouselBox(i);

        box.trackPosition = i - HALF_BOXES;

        box.create();

        this.boxes.push(box);

        this.track.appendChild(box.element);

    }

    this.trackRect = this.track.getBoundingClientRect();

};

/*=============================================================================
    Erste Spiele laden
=============================================================================*/

CarouselEngine.prototype.assignGames = function () {

    if (!this.visibleGames.length)
        return;

    for (let i = 0; i < this.boxes.length; i++) {

        const gameIndex = this.wrapGameIndex(

            this.currentGameIndex + i - HALF_BOXES

        );

        this.boxes[i].setGame(

            this.visibleGames[gameIndex],

            gameIndex

        );

        this.boxes[i].refresh();

    }

};

/*=============================================================================
    Animation
=============================================================================*/

CarouselEngine.prototype.stopAnimation = function () {

    this.animating = false;

    if (this.animationFrame) {

        cancelAnimationFrame(this.animationFrame);

        this.animationFrame = null;

    }

};

/*=============================================================================
    Spin starten
=============================================================================*/

CarouselEngine.prototype.spin = function (direction = 1) {

    this.targetVelocity =
        direction * this.maxVelocity;

};

/*=============================================================================
    Spin stoppen
=============================================================================*/

CarouselEngine.prototype.stopSpin = function () {

    this.targetVelocity = 0;

};

/*=============================================================================
    Hauptloop
=============================================================================*/

CarouselEngine.prototype.animate = function () {

    if (!this.animating)
        return;

    this.updatePhysics();

    this.normalizeTrack();

    this.recycleBoxes();

    this.render();

    this.animationFrame =
        requestAnimationFrame(() => {

            this.animate();

        });

};

/*=============================================================================
    Physics
=============================================================================*/

CarouselEngine.prototype.updatePhysics = function () {

    /*
    ------------------------------------------
    Geschwindigkeit weich an Ziel annähern
    ------------------------------------------
    */

    this.velocity +=

        (this.targetVelocity - this.velocity)

        * LERP_SPEED;



    /*
    ------------------------------------------
    Track bewegen
    ------------------------------------------
    */

    this.trackOffset += this.velocity;



    /*
    ------------------------------------------
    Fast Stillstand
    ------------------------------------------
    */

    if (

        Math.abs(this.velocity) < 0.00005 &&

        Math.abs(this.targetVelocity) < 0.00005

    ) {

        this.velocity = 0;

        this.targetVelocity = 0;

    }

};

/*=============================================================================
    Recycling
=============================================================================*/

/*=============================================================================
    Renderer
=============================================================================*/



/*=============================================================================
    API
=============================================================================*/

CarouselEngine.prototype.next = function () {

    this.spin(1);

};



CarouselEngine.prototype.previous = function () {

    this.spin(-1);

};

/*=============================================================================
    Neue Spiele übernehmen
=============================================================================*/

CarouselEngine.prototype.setGames = function (games) {

    this.visibleGames = games || [];

};

/*=============================================================================
    Zu bestimmtem Spiel springen
=============================================================================*/

CarouselEngine.prototype.spinTo = function (targetGameIndex) {

    if (!this.visibleGames.length)
        return;

    targetGameIndex = this.wrapGameIndex(targetGameIndex);

    this.currentGameIndex = targetGameIndex;

    /*
    ------------------------------------------
    Track zurücksetzen
    ------------------------------------------
    */

    this.trackOffset = 0;

    this.velocity = 0;

    this.targetVelocity = 0;

    /*
    ------------------------------------------
    Alle Boxen neu positionieren
    ------------------------------------------
    */

    for (let i = 0; i < this.boxes.length; i++) {

        const box = this.boxes[i];

        box.trackPosition = i - HALF_BOXES;

        const gameIndex = this.wrapGameIndex(

            this.currentGameIndex +

            i -

            HALF_BOXES

        );

        box.setGame(

            this.visibleGames[gameIndex],

            gameIndex

        );

        box.refresh();

    }

    /*
    ------------------------------------------
    Neu zeichnen
    ------------------------------------------
    */

    this.render();

};

/*=============================================================================
    Track normalisieren
=============================================================================*/

CarouselEngine.prototype.normalizeTrack = function () {

    while (this.trackOffset >= TRACK_STEP) {

        this.trackOffset -= TRACK_STEP;

        for (const box of this.boxes) {

            box.trackPosition += TRACK_STEP;

        }

    }

    while (this.trackOffset <= -TRACK_STEP) {

        this.trackOffset += TRACK_STEP;

        for (const box of this.boxes) {

            box.trackPosition -= TRACK_STEP;

        }

    }

};

/*=============================================================================
    Recycling Engine
=============================================================================*/

CarouselEngine.prototype.getLeftMostBox = function () {

    let left = this.boxes[0];

    for (const box of this.boxes) {

        if (box.trackPosition < left.trackPosition) {

            left = box;

        }

    }

    return left;

};

CarouselEngine.prototype.getRightMostBox = function () {

    let right = this.boxes[0];

    for (const box of this.boxes) {

        if (box.trackPosition > right.trackPosition) {

            right = box;

        }

    }

    return right;

};

CarouselEngine.prototype.recycleBoxes = function () {

    for (const box of this.boxes) {

        const screen =

            box.trackPosition -

            this.trackOffset;



        /*
        ----------------------------------------
        Box links verschwunden
        ----------------------------------------
        */

        if (screen < -TRACK_LIMIT) {

            this.recycleLeft(box);

        }



        /*
        ----------------------------------------
        Box rechts verschwunden
        ----------------------------------------
        */

        if (screen > TRACK_LIMIT) {

            this.recycleRight(box);

        }

    }

};

CarouselEngine.prototype.recycleLeft = function (box) {

    const right =

        this.getRightMostBox();



    box.trackPosition =

        right.trackPosition + 1;



    box.gameIndex =

        this.wrapGameIndex(

            right.gameIndex + 1

        );



    box.setGame(

        this.visibleGames[box.gameIndex],

        box.gameIndex

    );



    box.refresh();

};

CarouselEngine.prototype.recycleRight = function (box) {

    const left =

        this.getLeftMostBox();



    box.trackPosition =

        left.trackPosition - 1;



    box.gameIndex =

        this.wrapGameIndex(

            left.gameIndex - 1

        );



    box.setGame(

        this.visibleGames[box.gameIndex],

        box.gameIndex

    );



    box.refresh();

};

/*=============================================================================
    Renderer
=============================================================================*/

CarouselEngine.prototype.getScreenPosition = function (box) {

    return box.trackPosition - this.trackOffset;

};

CarouselEngine.prototype.render = function () {

    for (const box of this.boxes) {

        const screen =
            this.getScreenPosition(box);

        this.renderBox(box, screen);

    }

    this.updateFocus();

};

CarouselEngine.prototype.renderBox = function (box, screen) {

    const distance = Math.abs(screen);



    /*
    ------------------------------------------
    Position
    ------------------------------------------
    */

    const x = screen * SLOT_DISTANCE;



    /*
    ------------------------------------------
    Skalierung
    ------------------------------------------
    */

    const scale =

        SIDE_SCALE +

        (CENTER_SCALE - SIDE_SCALE)

        *

        Math.max(0, 1 - distance);



    /*
    ------------------------------------------
    Transparenz
    ------------------------------------------
    */

    const opacity =

        SIDE_OPACITY +

        (CENTER_OPACITY - SIDE_OPACITY)

        *

        Math.max(0, 1 - distance);



    /*
    ------------------------------------------
    Tiefensortierung
    ------------------------------------------
    */

    const z =

        Math.round(

            MAX_Z -

            distance * 100

        );



    /*
    ------------------------------------------
    CSS anwenden
    ------------------------------------------
    */

    box.element.style.left = "50%";

    const SHELF_BASE = 70;

    box.element.style.opacity = opacity;

    box.element.style.zIndex = z;



    box.element.style.transform =

        `translateX(${x}px) scale(${scale})`;

};

/*=============================================================================
    Focus Management
=============================================================================*/

CarouselEngine.prototype.updateFocus = function () {

    let closest = null;
    let closestDistance = Infinity;

    for (const box of this.boxes) {

        const distance = Math.abs(
            this.getScreenPosition(box)
        );

        box.active = (distance < 0.45);
        box.updateClasses();

        if (distance < closestDistance) {

            closestDistance = distance;
            closest = box;

        }

    }

    if (closest !== this.focusedBox) {

        this.focusedBox = closest;

        this.dispatchGameChanged();

    }

};

/*=============================================================================
    Game Changed Event
=============================================================================*/

CarouselEngine.prototype.dispatchGameChanged = function () {

    if (!this.focusedBox)
        return;

    this.track.dispatchEvent(

        new CustomEvent(

            "carouselGameChanged",

            {

                detail: {

                    game: this.focusedBox.game,

                    gameIndex: this.focusedBox.gameIndex,

                    box: this.focusedBox

                }

            }

        )

    );

};

/*=============================================================================
    Start / Stop
=============================================================================*/

CarouselEngine.prototype.start = function () {

    if (this.animating)
        return;

    this.animating = true;

    this.animate();

};

CarouselEngine.prototype.stop = function () {

    this.animating = false;

    cancelAnimationFrame(

        this.animationFrame

    );

};

/*=============================================================================
    Eingaben
=============================================================================*/

CarouselEngine.prototype.bindEvents = function () {

    const nextButton =
        document.getElementById("next-button");

    const previousButton =
        document.getElementById("previous-button");

    if (nextButton) {

        nextButton.addEventListener(

            "click",

            () => this.next()

        );

    }

    if (previousButton) {

        previousButton.addEventListener(

            "click",

            () => this.previous()

        );

    }

};

/*=============================================================================
    Resize
=============================================================================*/

CarouselEngine.prototype.onResize = function () {

    this.trackRect =
        this.track.getBoundingClientRect();

    this.render();

};
   
/*=============================================================================
    Initialisierung
=============================================================================*/

CarouselEngine.prototype.initialize = function () {

    this.createBoxes();

    this.assignGames();

    this.bindEvents();

    window.addEventListener(

        "resize",

        () => this.onResize()

    );

    this.render();

    this.start();

};





