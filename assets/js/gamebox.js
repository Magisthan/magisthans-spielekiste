const collectionEnhancerScript = document.currentScript?.src;
const collectionEnhancerReady = loadCollectionContentEnhancer(collectionEnhancerScript);

function loadCollectionContentEnhancer(scriptUrl){
    if(window.ContentImageEnhancer) return Promise.resolve(window.ContentImageEnhancer);
    if(window.__contentImageEnhancerReady) return window.__contentImageEnhancerReady;
    window.__contentImageEnhancerReady = new Promise((resolve,reject)=>{
        const script = document.createElement("script");
        script.src = new URL("content-image-enhancer.js",scriptUrl).href;
        script.onload = ()=>resolve(window.ContentImageEnhancer);
        script.onerror = reject;
        document.head.append(script);
    });
    return window.__contentImageEnhancerReady;
}

const canvas = document.getElementById("pirates-viewer");
const engine = new BABYLON.Engine(canvas, true);
const fullscreenButton =
document.getElementById(
    "fullscreen-button"
);

let currentFolder = "";
let scene = null;
let currentBox = null;
let pivot = null;
let currentGame = 0;

let autoChangeTimer = null;
let inactivityTimer = null;

const AUTO_CHANGE_DELAY = 10000;

//--------------------------------------------------
// Referenzhöhe
//--------------------------------------------------

const BOX_SCALE = 0.014;

//--------------------------------------------------
// Canvas
//--------------------------------------------------

function resizeCanvas() {

    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    engine.resize();

}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

    //--------------------------------------------------
    // Spiel laden
    //--------------------------------------------------

    async function loadGame(gameData) {

        function loadImage(file, optional = false) {

            return new Promise((resolve,reject)=>{

                const img = new Image();

                img.onload = ()=>resolve(img);

                img.onerror = () => optional
                    ? resolve(null)
                    : reject(new Error(`Missing texture: ${file}.webp`));

                img.src = `assets/textures/${gameData.folder}/${file}.webp`;

            });

        }

        const [front, back, left, right, top, bottom, insideLeft, insideRight, insideSpin] =
            await Promise.all([
                loadImage("front"),
                loadImage("back"),
                loadImage("left"),
                loadImage("right"),
                loadImage("top"),
                loadImage("bottom"),
                loadImage("inside_left", true),
                loadImage("inside_right", true),
                loadImage("inside_spin", true)
            ]);

        const images = {
            front,
            back,
            left,
            right,
            top,
            bottom,
            insideLeft,
            insideRight,
            insideSpin
        };

        const dimensions = gameData.dimensions || {};

        return {

            images,

            width: (dimensions.width || 200) * BOX_SCALE,
            height: (dimensions.height || 260) * BOX_SCALE,
            depth: Math.max(dimensions.depth || 20, 3) * BOX_SCALE,
            hasInside: Boolean(gameData.hasInside && insideLeft && insideRight)

        };

    }

//--------------------------------------------------
    // Automatischer Spielwechsel
    //--------------------------------------------------

    
    
async function showGame(index) {

    const gameData = GAMES[index];

    currentFolder = gameData.folder;

    document.getElementById("game-title").textContent = gameData.title;

    const navTitle = document.getElementById("game-nav-title");

    if (navTitle) {
        navTitle.textContent = gameData.title;
    }

    document.getElementById("game-system").textContent = gameData.system;
    document.getElementById("game-year").textContent = gameData.year;
    document.getElementById("game-publisher").textContent = gameData.publisher;
    document.getElementById("game-developer").textContent = gameData.developer;

    const game = await loadGame(gameData);

const current = {

    gameData,
    game

};

if (currentBox) {

    Package.dispose(currentBox);

}

currentBox = Package.create(
    scene,
    pivot,
    current
);

return current;

}

//--------------------------------------------------
// Automatischer Spielwechsel
//--------------------------------------------------

function startAutoChange(){

    console.trace("startAutoChange");

    clearInterval(autoChangeTimer);

    autoChangeTimer = setInterval(async ()=>{

        console.log("AUTO CHANGE");

        currentGame++;

        if(currentGame >= GAMES.length){

            currentGame = 0;

        }

        await showGame(currentGame);

    },AUTO_CHANGE_DELAY);

}

function stopAutoChange(){

    console.log("stopAutoChange");

    clearInterval(autoChangeTimer);

    autoChangeTimer = null;

}

function userInteraction(){

    stopAutoChange();

    clearTimeout(inactivityTimer);

    if(autoSwitchPaused) return;

    inactivityTimer = setTimeout(()=>{

        startAutoChange();

    },AUTO_CHANGE_DELAY);

}

//--------------------------------------------------
// Animationen
//--------------------------------------------------

function animateOut() {

    pivot.scaling.set(0.96, 0.96, 0.96);

}

function animateIn() {

    pivot.scaling.set(1, 1, 1);

}

//--------------------------------------------------
// Collection Search
//--------------------------------------------------

function initSearch() {

const searchInput =
    document.getElementById("game-search");

const searchResults =
    document.getElementById("game-search-results");

function clearResults(){

    searchResults.innerHTML = "";

    searchResults.classList.remove("show");

}

function buildResults(matches){

    searchResults.innerHTML = "";

    if(matches.length===0){

        searchResults.classList.remove("show");

        return;

    }

    matches.forEach(game=>{

        const item =
            document.createElement("div");

        item.className = "search-item";

        item.innerHTML = `

            <div class="search-item-info">
                <span class="search-title">${game.title}</span>
                <span class="search-system">${game.system}</span>
            </div>
        `;

        item.addEventListener("click", async ()=>{

    userInteraction();

    currentGame =
        GAMES.indexOf(game);

    animateOut();

    await showGame(currentGame);

    animateIn();

    searchInput.value = "";

    clearResults();

    searchInput.focus();

});

        searchResults.appendChild(item);

    });

    searchResults.classList.add("show");

}

searchInput.addEventListener("input",()=>{

    const value =
        searchInput.value
        .trim()
        .toLowerCase();

    if(value===""){

    clearResults();

    return;

}

    const matches =

        GAMES.filter(game=>

            game.title
                .toLowerCase()
                .includes(value)

        );

    buildResults(matches);

});

}

//--------------------------------------------------
// Szene
//--------------------------------------------------

async function createScene() {

    scene = new BABYLON.Scene(engine);

    scene.clearColor = new BABYLON.Color4(
        0.10,
        0.13,
        0.18,
        1
    );

    
    //--------------------------------------------------
    // Kamera
    //--------------------------------------------------

    const camera = new BABYLON.ArcRotateCamera(

        "camera",

        -Math.PI / 2.35,

        Math.PI / 2.45,

        9.8,

        BABYLON.Vector3.Zero(),

        scene

    );

    camera.attachControl(canvas, false);
    camera.fov = 0.65;
    
    
    const NORMAL_CAMERA_RADIUS = 8.8;
    const FULLSCREEN_CAMERA_RADIUS = 10.5;
    camera.lowerRadiusLimit = 3.0;
    camera.upperRadiusLimit = 11.0;

    window.ViewerInputControls?.setup({
        camera,
        canvas,
        container:document.querySelector(".gamebox-stage"),
        onInteraction:userInteraction
    });

    //--------------------------------------------------
    // Licht
    //--------------------------------------------------

    const hemiLight = new BABYLON.HemisphericLight(

        "hemi",

        new BABYLON.Vector3(0,1,0),

        scene

    );

    hemiLight.intensity = 0.58;

    const viewerFill = new BABYLON.PointLight(
        "collectionViewerFill",
        BABYLON.Vector3.Zero(),
        scene
    );
    viewerFill.intensity = 1.55;
    scene.onBeforeRenderObservable.add(() => {
        viewerFill.position.copyFrom(camera.globalPosition);
    });

    const dirLight = new BABYLON.DirectionalLight(

        "dir",

        new BABYLON.Vector3(-1,-2,-1),

        scene

    );

    dirLight.position = new BABYLON.Vector3(5,8,5);
    dirLight.intensity = 0.65;

    scene.imageProcessingConfiguration.toneMappingEnabled = true;
    scene.imageProcessingConfiguration.toneMappingType =
        BABYLON.ImageProcessingConfiguration.TONEMAPPING_ACES;
    scene.imageProcessingConfiguration.contrast = 1.06;
    scene.imageProcessingConfiguration.exposure = 1.0;

    //--------------------------------------------------
    // Pivot
    //--------------------------------------------------

    pivot = new BABYLON.TransformNode(
        "pivot",
        scene
    );

    pivot.position.y = -0.50;
    
  

    //--------------------------------------------------
    // Spiel anzeigen
    //--------------------------------------------------

    
await showGame(currentGame);

startAutoChange();


//--------------------------------------------------
    // Benutzerinteraktion am Viewer
    //--------------------------------------------------

    scene.onPointerObservable.add((pointerInfo)=>{

        switch(pointerInfo.type){

            case BABYLON.PointerEventTypes.POINTERDOWN:

                userInteraction();

                break;

    }

});

    initSearch(); 


    //--------------------------------------------------
    // Eigene Steuerung
    //--------------------------------------------------

    let dragging = false;
    let lastX = 0;
    let velocity = 0;

    canvas.addEventListener("pointerdown", (e) => {

        dragging = true;
        lastX = e.clientX;

        userInteraction();

    });

    window.addEventListener("pointerup", () => {

        dragging = false;

    });

    window.addEventListener("pointermove", (e) => {

        if (!dragging) return;

        const dx = e.clientX - lastX;

        lastX = e.clientX;

        velocity = dx * 0.008;

        pivot.rotation.y += velocity;

    });

    //--------------------------------------------------
    // Wechselanimation
    //--------------------------------------------------

    let targetScale = 1;
    let scaleSpeed = 0.12;
    

    //--------------------------------------------------
    // Animation
    //--------------------------------------------------

    scene.onBeforeRenderObservable.add(() => {

        if (!dragging) {

            pivot.rotation.y += velocity;

            velocity *= 0.94;

        }

    const currentScale = pivot.scaling.x;

    pivot.scaling.x += (targetScale - currentScale) * scaleSpeed;
    pivot.scaling.y = pivot.scaling.x;
    pivot.scaling.z = pivot.scaling.x;

    pivot.rotation.y = Math.PI;

    });

    //--------------------------------------------------
// Fullscreen
//--------------------------------------------------

fullscreenButton.addEventListener(

    "click",

    async()=>{

        const viewer =
        document.querySelector(
            ".gamebox-stage"
        );

        if(!document.fullscreenElement){

            await viewer.requestFullscreen();

        }else{

            await document.exitFullscreen();

        }

    }

);

document.addEventListener(

    "fullscreenchange",

    ()=>{

        if(document.fullscreenElement){

            camera.radius =
                FULLSCREEN_CAMERA_RADIUS;

            fullscreenButton.textContent = "🗗";

        }else{

            camera.radius =
                NORMAL_CAMERA_RADIUS;

            fullscreenButton.textContent = "⛶";

        }

        engine.resize();

    }

);

    return scene;

}

//--------------------------------------------------
// Start
//--------------------------------------------------

createScene().then(() => {

    engine.runRenderLoop(() => {

        if (scene) {
            scene.render();
        }

    });

});

//--------------------------------------------------
// Archive
//--------------------------------------------------

let archiveTimers = [];
let autoSwitchPaused = false;
let archiveLoadState = "idle";

function resetArchive(){

    archiveTimers.forEach(clearTimeout);
    archiveTimers = [];

    const loading =
        document.getElementById("archive-loading");

    const content =
        document.getElementById("archive-content");

    const status =
        document.getElementById("archive-status");

    const bar =
        document.getElementById("archive-bar");

    const archiveLightbox =
        document.getElementById("archive-lightbox");

    const archiveLightboxImage =
        document.getElementById("archive-lightbox-image");

    const result =
        document.getElementById("archive-result");

    const image =
        document.getElementById("archive-image");

    const empty =
        document.getElementById("archive-empty");

    const zoom =
        document.getElementById("archive-zoom");

    const imageWrapper =
        document.querySelector(".archive-image-wrapper");

    if(!loading) return;

    loading.style.zIndex = "1";
    loading.classList.remove("hide");
    content.classList.remove("show");
    content.classList.remove("content-available");
    content.classList.remove("content-missing");
    status.classList.remove("show");
    bar.classList.remove("show");
    result.classList.remove("show");

    status.classList.add("show");

    status.textContent =
        "> Searching archive...";

    bar.classList.add("show");

    bar.textContent =
        "[████░░░░░░░░]";

    result.classList.add("show");

    result.textContent =
        "✓ Archive scan complete.";

    archiveLoadState = "idle";

    image.onload = null;
    image.onerror = null;
    image.classList.remove("show");
    image.hidden = true;
    image.src = "";

    empty.hidden = true;
    zoom.hidden = true;
    imageWrapper.classList.remove("shimmer-run");

}

function runArchiveShimmer(){

    const image = document.getElementById("archive-image");
    const imageWrapper = document.querySelector(".archive-image-wrapper");

    if(
        archiveLoadState !== "available" ||
        !image ||
        !imageWrapper ||
        image.hidden
    ) return;

    const imageRect = image.getBoundingClientRect();
    const wrapperRect = imageWrapper.getBoundingClientRect();
    const shimmerWidth = Math.max(54, imageRect.width * .18);

    imageWrapper.style.setProperty(
        "--archive-image-left",
        `${imageRect.left - wrapperRect.left}px`
    );
    imageWrapper.style.setProperty(
        "--archive-image-top",
        `${imageRect.top - wrapperRect.top}px`
    );
    imageWrapper.style.setProperty(
        "--archive-image-width",
        `${imageRect.width}px`
    );
    imageWrapper.style.setProperty(
        "--archive-image-height",
        `${imageRect.height}px`
    );
    imageWrapper.style.setProperty(
        "--archive-shimmer-width",
        `${shimmerWidth}px`
    );

    imageWrapper.classList.remove("shimmer-run");
    void imageWrapper.offsetWidth;
    imageWrapper.classList.add("shimmer-run");

}

function startArchive(folder){

    resetArchive();

    let showingContentPlaceholder = false;

    const loading =
        document.getElementById("archive-loading");

    const content =
        document.getElementById("archive-content");

    const status =
        document.getElementById("archive-status");

    const bar =
        document.getElementById("archive-bar");

    const result =
        document.getElementById("archive-result");

    const image =
        document.getElementById("archive-image");

    const empty =
        document.getElementById("archive-empty");

    const zoom =
        document.getElementById("archive-zoom");

    const archiveLightbox =
        document.getElementById("archive-lightbox");

    const archiveLightboxImage =
        document.getElementById("archive-lightbox-image");
    
    if(!loading) return;

    console.log(folder);

    console.log(
        `assets/textures/${folder}/content.webp`
    );

    archiveLoadState = "pending";

    image.onload = () => {

    if(showingContentPlaceholder){

        archiveLoadState = "missing";
        image.hidden = false;
        empty.hidden = true;
        zoom.hidden = true;
        content.classList.remove("content-available");
        content.classList.add("content-missing");

        if(panel.classList.contains("open")){
            panel.style.height = panel.scrollHeight + "px";
        }

        return;

    }

    archiveLoadState = "available";
    const archiveGame = GAMES.find(game=>game.folder === folder);
    collectionEnhancerReady.then(enhancer=>{
        enhancer.apply(image,archiveGame?.contentDisplay || {});
    });
    image.hidden = false;
    empty.hidden = true;
    zoom.hidden = false;
    content.classList.add("content-available");
    content.classList.remove("content-missing");

    // Panelhöhe nach dem Laden des Bildes neu berechnen
    if (panel.classList.contains("open")) {

        panel.style.height = panel.scrollHeight + "px";

    }

};

    image.onclick = () => {

    if(archiveLoadState !== "available") return;

    autoSwitchPaused = true;

    stopAutoChange();

    archiveLightboxImage.src = image.src;
    collectionEnhancerReady.then(enhancer=>enhancer.copy(image,archiveLightboxImage));

    archiveLightbox.classList.add("show");

};

    image.onerror = ()=>{

        if(showingContentPlaceholder){

            image.hidden = true;
            empty.hidden = false;
            zoom.hidden = true;

            return;

        }

        showingContentPlaceholder = true;
        collectionEnhancerReady.then(enhancer=>enhancer.reset(image));
        archiveLoadState = "missing";
        image.hidden = false;
        empty.hidden = true;
        zoom.hidden = true;
        content.classList.remove("content-available");
        content.classList.add("content-missing");

        result.textContent =
            "No content at the moment";

        image.alt =
            "Noch kein Inhaltsbild vorhanden / No content image available";

        image.src = "assets/images/content-placeholder.svg";

    };

    image.src = `assets/textures/${folder}/content.webp`;

    //--------------------------------------------------
    // Phase 1
    //--------------------------------------------------

    archiveTimers.push(

        setTimeout(()=>{

            status.textContent =
                "> Searching archive...";

            bar.textContent =
                "[██░░░░░░░░░░]";

        },300)

    );

    archiveTimers.push(

        setTimeout(()=>{

            status.textContent =
                "> Accessing collection database...";

            bar.textContent =
                "[████░░░░░░░░]";

        },650)

    );

    archiveTimers.push(

        setTimeout(()=>{

            status.textContent =
                "> Authenticating media...";

            bar.textContent =
                "[███████░░░░░]";

        },1050)

    );

    archiveTimers.push(

        setTimeout(()=>{

            bar.textContent =
                "[██████████░░]";

        },1450)

    );

    archiveTimers.push(

        setTimeout(()=>{

            bar.textContent =
                "[████████████]";

        },1750)

    );

    archiveTimers.push(

        setTimeout(()=>{

            result.textContent = archiveLoadState === "missing"
                ? "No content at the moment"
                : "✓ Archive scan complete.";

        },1950)

    );

    //--------------------------------------------------
    // Phase 2
    //--------------------------------------------------

    

    //--------------------------------------------------
    // Phase 3
    //--------------------------------------------------

    archiveTimers.push(

    setTimeout(()=>{

        loading.classList.add("hide");

        content.classList.add("show");

        requestAnimationFrame(()=>{
            requestAnimationFrame(runArchiveShimmer);
        });

        setTimeout(()=>{

            loading.style.zIndex = "2";

        },800);

    },2200)

);

}

const toggle = document.getElementById("game-info-toggle");
const panel = document.getElementById("game-info-panel");
const titleBar = document.querySelector(".game-title-bar");
const gameboxStage =
    document.querySelector(".gamebox-stage");

function toggleInfoPanel() {

    const isOpen = panel.classList.contains("open");

    if (!isOpen) {

        panel.classList.add("open");

        panel.style.height = panel.scrollHeight + "px";

        toggle.textContent = "⌄";

        document
            .querySelector(".gamebox-stage")
            .classList.add("archive-open");

        autoSwitchPaused = true;

        stopAutoChange();

        clearTimeout(inactivityTimer);

        startArchive(currentFolder);

    } else {

        panel.style.height = panel.scrollHeight + "px";

        requestAnimationFrame(() => {

            panel.style.height = "0px";

        });

        toggle.textContent = "⌃";

        document
            .querySelector(".gamebox-stage")
            .classList.remove("archive-open");

        autoSwitchPaused = false;

        resetArchive();

        startAutoChange();

        panel.addEventListener("transitionend", function handler() {

            panel.classList.remove("open");

            panel.removeEventListener("transitionend", handler);

        }, { once: true });

    }

}

toggle.addEventListener("click", (event) => {

    event.stopPropagation();

    toggleInfoPanel();

});

titleBar.addEventListener("click", toggleInfoPanel);

//--------------------------------------------------
// Archive Lightbox
//--------------------------------------------------

const archiveLightbox =
    document.getElementById("archive-lightbox");

archiveLightbox.addEventListener("click", (e) => {

    if(e.target === archiveLightbox){

        archiveLightbox.classList.remove("show");
        
    }



document.addEventListener("keydown", (e) => {

    if(e.key === "Escape"){

        archiveLightbox.classList.remove("show");
        

    }

});


});
