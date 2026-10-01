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
let archiveMessageKey = "collection.archive.searching";

function collectionText(key, fallback) {
    return window.SiteI18n?.t?.(key) || fallback;
}

function localizedGame(game) {
    return window.GameLocalization?.localizeGame?.(game) || game;
}

function renderCurrentGameText() {
    const gameData = localizedGame(GAMES[currentGame]);
    if (!gameData) return;
    document.getElementById("game-title").textContent = gameData.title;
    const navTitle = document.getElementById("game-nav-title");
    if (navTitle) navTitle.textContent = gameData.title;
    document.getElementById("game-system").textContent = gameData.system;
    document.getElementById("game-year").textContent = gameData.year;
    document.getElementById("game-publisher").textContent = gameData.publisher;
    document.getElementById("game-developer").textContent = gameData.developer;
}

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

    renderCurrentGameText();

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
    const navigation = document.querySelector(".game-archive-navigation--collection");
    const toggle = document.getElementById("collection-archive-search-toggle");
    const panel = document.getElementById("collection-archive-search-panel");
    const searchInput = document.getElementById("game-search");
    const searchResults = document.getElementById("game-search-results");
    const status = document.getElementById("collection-archive-search-status");
    const online = document.getElementById("collection-archive-online");
    const maxVisibleResults = 20;

    if(!navigation || !toggle || !panel || !searchInput || !searchResults || !status){
        return;
    }

    function normalizedText(value){
        const language = window.SiteI18n?.getLanguage?.() || "de";
        return String(value || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLocaleLowerCase(language);
    }

    function searchableText(game){
        const displayGame = localizedGame(game);
        const genres = Array.isArray(displayGame.genre)
            ? displayGame.genre
            : [displayGame.genre];
        return normalizedText([
            displayGame.title,
            displayGame.system,
            displayGame.year,
            displayGame.developer,
            displayGame.publisher,
            ...genres
        ].filter(Boolean).join(" "));
    }

    async function selectGame(game){
        const index = GAMES.indexOf(game);
        if(index < 0) return;
        userInteraction();
        currentGame = index;
        animateOut();
        await showGame(currentGame);
        animateIn();
        searchInput.value = "";
        closeSearch({ restoreFocus:false });
    }

    function renderResults(){
        const query = normalizedText(searchInput.value.trim());
        const matches = GAMES.filter(game=>!query || searchableText(game).includes(query));
        const visibleMatches = matches.slice(0,maxVisibleResults);
        searchResults.replaceChildren();

        visibleMatches.forEach((game,index)=>{
            const displayGame = localizedGame(game);
            const item = document.createElement("li");
            const button = document.createElement("button");
            button.className = "game-archive-navigation__result-link";
            button.type = "button";

            const resultTitle = document.createElement("span");
            resultTitle.className = "game-archive-navigation__result-title";
            const resultIndex = document.createElement("span");
            resultIndex.className = "game-archive-navigation__result-index";
            resultIndex.textContent = String(index + 1).padStart(2,"0");
            resultTitle.append(resultIndex,document.createTextNode(displayGame.title));

            const resultMeta = document.createElement("span");
            resultMeta.className = "game-archive-navigation__result-meta";
            resultMeta.textContent = [displayGame.system,displayGame.year].filter(Boolean).join(" · ");

            button.append(resultTitle,resultMeta);
            button.addEventListener("click",()=>selectGame(game));
            item.append(button);
            searchResults.append(item);
        });

        if(!matches.length){
            status.textContent = collectionText("collection.navigation.none","Kein passendes Spiel gefunden.");
        }else if(matches.length > maxVisibleResults){
            status.textContent = collectionText(
                "collection.navigation.limited",
                `${matches.length} Treffer – die ersten ${maxVisibleResults} werden angezeigt.`
            ).replace("{count}",matches.length).replace("{limit}",maxVisibleResults);
        }else{
            status.textContent = collectionText(
                "collection.navigation.count",
                `${matches.length} Treffer`
            ).replace("{count}",matches.length);
        }
    }

    function updateDynamicLabels(){
        if(online){
            online.textContent = collectionText(
                "collection.navigation.online",
                `${GAMES.length} Boxen online`
            ).replace("{count}",GAMES.length);
        }
        if(!panel.hidden) renderResults();
    }

    function openSearch(){
        panel.hidden = false;
        toggle.setAttribute("aria-expanded","true");
        renderResults();
        window.requestAnimationFrame(()=>searchInput.focus());
    }

    function closeSearch({ restoreFocus = true } = {}){
        panel.hidden = true;
        toggle.setAttribute("aria-expanded","false");
        searchResults.replaceChildren();
        status.textContent = "";
        if(restoreFocus) toggle.focus();
    }

    toggle.addEventListener("click",()=>{
        if(panel.hidden) openSearch();
        else closeSearch();
    });
    searchInput.addEventListener("input",renderResults);
    searchInput.addEventListener("keydown",event=>{
        const buttons = [...searchResults.querySelectorAll("button")];
        if(event.key === "ArrowDown" && buttons.length){
            event.preventDefault();
            buttons[0].focus();
        }else if(event.key === "Enter" && buttons.length){
            event.preventDefault();
            buttons[0].click();
        }
    });
    searchResults.addEventListener("keydown",event=>{
        const buttons = [...searchResults.querySelectorAll("button")];
        const index = buttons.indexOf(document.activeElement);
        if(event.key === "ArrowDown" && index >= 0){
            event.preventDefault();
            buttons[(index + 1) % buttons.length].focus();
        }else if(event.key === "ArrowUp" && index >= 0){
            event.preventDefault();
            if(index === 0) searchInput.focus();
            else buttons[index - 1].focus();
        }
    });
    document.addEventListener("pointerdown",event=>{
        if(!panel.hidden && !navigation.contains(event.target)){
            closeSearch({ restoreFocus:false });
        }
    });
    document.addEventListener("keydown",event=>{
        const target = event.target;
        const isTyping = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target?.isContentEditable;
        if(event.key === "Escape" && !panel.hidden){
            event.preventDefault();
            closeSearch();
        }else if(event.key === "/" && !isTyping && panel.hidden){
            event.preventDefault();
            openSearch();
        }
    });
    document.addEventListener("siteLanguageChanged",updateDynamicLabels);
    updateDynamicLabels();
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

function startCollectionViewer() {
Promise.resolve(window.__siteI18nReady).then(createScene).then(() => {

    engine.runRenderLoop(() => {

        if (scene) {
            scene.render();
        }

    });

});
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startCollectionViewer, { once:true });
} else {
    startCollectionViewer();
}

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

    archiveMessageKey = "collection.archive.searching";
    status.textContent = collectionText(archiveMessageKey, "> Archiv wird durchsucht …");

    bar.classList.add("show");

    bar.textContent =
        "[████░░░░░░░░]";

    result.classList.add("show");

    result.textContent = collectionText(
        "collection.archive.complete",
        "✓ Archivscan abgeschlossen."
    );

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

        result.textContent = collectionText(
            "collection.archive.missing",
            "Noch kein Inhaltsbild vorhanden"
        );

        image.alt = collectionText(
            "collection.archive.missing",
            "Noch kein Inhaltsbild vorhanden"
        );

        image.src = "assets/images/content-placeholder.svg";

    };

    image.src = `assets/textures/${folder}/content.webp`;

    //--------------------------------------------------
    // Phase 1
    //--------------------------------------------------

    archiveTimers.push(

        setTimeout(()=>{

            archiveMessageKey = "collection.archive.searching";
            status.textContent = collectionText(archiveMessageKey, "> Archiv wird durchsucht …");

            bar.textContent =
                "[██░░░░░░░░░░]";

        },300)

    );

    archiveTimers.push(

        setTimeout(()=>{

            archiveMessageKey = "collection.archive.accessing";
            status.textContent = collectionText(archiveMessageKey, "> Sammlungsdatenbank wird aufgerufen …");

            bar.textContent =
                "[████░░░░░░░░]";

        },650)

    );

    archiveTimers.push(

        setTimeout(()=>{

            archiveMessageKey = "collection.archive.authenticating";
            status.textContent = collectionText(archiveMessageKey, "> Medium wird geprüft …");

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
                ? collectionText("collection.archive.missing", "Noch kein Inhaltsbild vorhanden")
                : collectionText("collection.archive.complete", "✓ Archivscan abgeschlossen.");

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
const toggleChevron = toggle?.querySelector(".game-info-toggle__chevron");
const panel = document.getElementById("game-info-panel");

function setViewerZoomControlsHidden(hidden){
    const zoomControls = document.querySelector(".gamebox-stage .viewer-zoom-controls");
    if(!zoomControls) return;
    zoomControls.hidden = hidden;
    zoomControls.setAttribute("aria-hidden",String(hidden));
}

function toggleInfoPanel() {

    const isOpen = panel.classList.contains("open");

    if (!isOpen) {

        panel.classList.add("open");

        panel.style.height = panel.scrollHeight + "px";

        toggle.setAttribute("aria-expanded","true");
        if(toggleChevron) toggleChevron.textContent = "⌃";
        setViewerZoomControlsHidden(true);

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

        toggle.setAttribute("aria-expanded","false");
        if(toggleChevron) toggleChevron.textContent = "⌄";
        setViewerZoomControlsHidden(false);

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

document.addEventListener("siteLanguageChanged", () => {
    renderCurrentGameText();

    const status = document.getElementById("archive-status");
    const result = document.getElementById("archive-result");
    const image = document.getElementById("archive-image");

    if (status) status.textContent = collectionText(archiveMessageKey, status.textContent);
    if (result?.classList.contains("show")) {
        result.textContent = archiveLoadState === "missing"
            ? collectionText("collection.archive.missing", "Noch kein Inhaltsbild vorhanden")
            : collectionText("collection.archive.complete", "✓ Archivscan abgeschlossen.");
    }
    if (image && archiveLoadState === "missing") {
        image.alt = collectionText("collection.archive.missing", "Noch kein Inhaltsbild vorhanden");
    }
});

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
