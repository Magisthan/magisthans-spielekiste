/* ==========================================
   Retro Discovery
   Viewer
========================================== */

let canvas = null;
let engine = null;
let scene = null;
let guideTimeout;
let guideCanShow = true;
let isFullscreen = false;
let infoPanelOpen = false;

//--------------------------------------------------
// Viewer
//--------------------------------------------------

const SCALE = 0.014;

//--------------------------------------------------
// Viewer Position
//--------------------------------------------------

const BOX_Y_OFFSET = 0.58;

//--------------------------------------------------
// Hero Pose
//--------------------------------------------------

const HERO_ROTATION_X = BABYLON.Tools.ToRadians(-2);

const HERO_ROTATION_Y = Math.PI - BABYLON.Tools.ToRadians(28);

const HERO_ROTATION_Z = 0;

//--------------------------------------------------
// Kamera Startposition
//--------------------------------------------------

const CAMERA_ALPHA = -Math.PI / 2;

const CAMERA_BETA = Math.PI / 2.5;

const CAMERA_RADIUS = 7.5;

let pivot = null;
let currentPackage = null;
let packageHintDismissed = false;

//--------------------------------------------------
// Showcase Rotation
//--------------------------------------------------

let showcaseRotation = true;

let showcaseIdleTimer = null;

const SHOWCASE_SPEED = 0.0060;

const SHOWCASE_DELAY = 5000;

//--------------------------------------------------
// Viewer Actions
//--------------------------------------------------

function hideViewerActions(){

    infoPanelOpen = false;

    const actions =
        document.getElementById("viewer-actions");

    if(actions){

        actions.classList.remove("visible");

    }

    const panel =
        document.getElementById("viewer-info-panel");

    if(panel){

        panel.classList.remove("open");

    }

}

function showViewerActions(){

    const fullscreen =
        document.getElementById("fullscreen-btn");

    if(fullscreen){

        fullscreen.classList.add("visible");

    }

    if(infoPanelOpen) return;

    const actions =
        document.getElementById("viewer-actions");

    if(actions){

        actions.classList.add("visible");

    }

}

function showFullscreenButton(){

    const button =
        document.getElementById("fullscreen-btn");

    if(button){

        button.classList.add("visible");

    }

}

function hideFullscreenButton(){

    const button =
        document.getElementById("fullscreen-btn");

    if(button){

        button.classList.remove("visible");

    }

}

//--------------------------------------------------
// Info Panel rechts
//--------------------------------------------------

function openInfoPanel(){

    infoPanelOpen = true;

    document
        .getElementById("viewer-actions")
        .classList.remove("visible");

    document
        .getElementById("viewer-info-panel")
        .classList.add("open");

}

function closeInfoPanel(){

    infoPanelOpen = false;

    document
        .getElementById("viewer-info-panel")
        .classList.remove("open");

    document
        .getElementById("viewer-actions")
        .classList.add("visible");

}

function toggleInfoPanel(){

    if(infoPanelOpen){

        closeInfoPanel();

    }else{

        openInfoPanel();

    }

}

//--------------------------------------------------
// Info Panel Daten
//--------------------------------------------------

function updateInfoPanel(gameData){

    if(!gameData) return;

    document.getElementById(
        "info-title"
    ).textContent =
        gameData.title || "-";

    document.getElementById(
        "info-meta"
    ).textContent =

        `${gameData.system} • ${gameData.genre} • ${gameData.year}`;

    document.getElementById(
        "info-developer"
    ).textContent =
        gameData.developer || "-";

    document.getElementById(
        "info-publisher"
    ).textContent =
        gameData.publisher || "-";

    const artists = (gameData.boxArtists || [])
    .filter(name => name && name.trim() !== "");

document.getElementById(
    "info-boxartist"
).textContent =

    artists.length
        ? artists.join(", ")
        : "keine Angabe";

    //--------------------------------------------------
// Links
//--------------------------------------------------

const mobyButton =
    document.getElementById("info-mobygames");

if(gameData.links?.mobygames){

    mobyButton.style.display = "";

    mobyButton.onclick = () => {

        window.open(

            gameData.links.mobygames,

            "_blank"

        );

    };

}else{

    mobyButton.style.display = "none";

}

const wikiButton =
    document.getElementById("info-wikipedia");

if(gameData.links?.wikipedia){

    wikiButton.style.display = "";

    wikiButton.onclick = () => {

        window.open(

            gameData.links.wikipedia,

            "_blank"

        );

    };

}else{

    wikiButton.style.display = "none";

}

const gogButton =
    document.getElementById("info-gog");

if(gameData.links?.gog){

    gogButton.style.display = "";

    gogButton.onclick = () => {

        window.open(

            gameData.links.gog,

            "_blank"

        );

    };

}else{

    gogButton.style.display = "none";

}

const letsPlayButton =
    document.getElementById("info-letsplay");

if(gameData.letsPlay){

    letsPlayButton.style.display = "";

    letsPlayButton.onclick = () => {

        window.open(

            gameData.letsPlay,

            "_blank"

        );

    };

}else{

    letsPlayButton.style.display = "none";

}

//--------------------------------------------------
// Link kopieren
//--------------------------------------------------

const copyButton =
    document.getElementById(
        "copy-game-link"
    );

copyButton.onclick = async () => {

    const url =

        `${window.location.origin}${window.location.pathname}?game=${gameData.folder}`;

    await navigator.clipboard.writeText(url);

    copyButton.classList.add("copied");

    copyButton.innerHTML =

        "✓ Link kopiert!";

    setTimeout(() => {

        copyButton.classList.remove("copied");

        copyButton.innerHTML =

            "🔗 Spiel teilen / share game";

    },2000);

};

}



//--------------------------------------------------
// Viewer
//--------------------------------------------------

function initViewer() {

    console.log("initViewer gestartet");

    canvas = document.getElementById("viewer3d");

    const fullscreenBtn =
    document.getElementById("fullscreen-btn");

    const infoBtn =
    document.getElementById("viewer-info-btn");

    const closeBtn =
    document.getElementById("viewer-info-close");

    fullscreenBtn.addEventListener(

    "click",

    toggleFullscreen

);

infoBtn.addEventListener(

    "click",

    toggleInfoPanel

);

closeBtn.addEventListener(

    "click",

    closeInfoPanel

);

    showViewerGuide();

    const viewer =
    document.getElementById("viewer-container");

viewer.addEventListener(

    "mouseleave",

    ()=>{

        enableGuideAgain();

    }

);

viewer.addEventListener(

    "mouseenter",

    ()=>{

        if(guideCanShow){

            showViewerGuide();

        }

    }

);

    console.log("Canvas:", canvas);

    engine = new BABYLON.Engine(canvas, true);

    console.log("Vor resize:", canvas.width, canvas.height);

    resizeCanvas();

    console.log("Nach resize:", canvas.width, canvas.height);

    createScene();

}

function animateViewerZoom(targetRadius) {

    if (!window.viewerCamera) return;

    const animation = new BABYLON.Animation(
        "viewerZoom",
        "radius",
        60,
        BABYLON.Animation.ANIMATIONTYPE_FLOAT,
        BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    animation.setKeys([
        {
            frame: 0,
            value: window.viewerCamera.radius
        },
        {
            frame: 20,
            value: targetRadius
        }
    ]);

    window.viewerCamera.animations = [];

    window.viewerCamera.animations.push(animation);

    scene.beginAnimation(
        window.viewerCamera,
        0,
        20,
        false
    );

}

//--------------------------------------------------
// Fullscreen
//--------------------------------------------------

async function toggleFullscreen(){

    const stage =
        document.getElementById("viewer-stage");

    try{

        if(!document.fullscreenElement){

            await stage.requestFullscreen();

            await new Promise(resolve=>setTimeout(resolve,100));

        }

        else{

            await document.exitFullscreen();

            await new Promise(resolve=>setTimeout(resolve,100));

        }

    }

    catch(error){

        console.error(error);

    }

}

//--------------------------------------------------
// Premium Viewer Guide
//--------------------------------------------------

function showViewerGuide(){

    if(!guideCanShow) return;

    const guide = document.getElementById("viewer-guide");

    if(!guide) return;

    guide.classList.remove("hide");

    guide.classList.add("show");

    clearTimeout(guideTimeout);

    guideTimeout = setTimeout(()=>{

        guide.classList.remove("show");

        guide.classList.add("hide");

    },5000);

}

function enableGuideAgain(){

    guideCanShow = false;

    setTimeout(()=>{

        guideCanShow = true;

    },10000);

}

//--------------------------------------------------
// Material
//--------------------------------------------------

function createMaterial(image) {

    const material =
    new BABYLON.StandardMaterial(
        "mat",
        scene
    );
    
    material.diffuseTexture =
    new BABYLON.Texture(
        image.src,
        scene
    );

material.diffuseTexture.uScale = -1;
material.diffuseTexture.uOffset = 1;

material.diffuseTexture.anisotropicFilteringLevel = 16;

//--------------------------------------------------
// Texture Calibration
//--------------------------------------------------

material.diffuseTexture.gammaSpace = true;

material.diffuseTexture.level = 1.18;

material.diffuseTexture.updateSamplingMode(
    BABYLON.Texture.TRILINEAR_SAMPLINGMODE
);



//--------------------------------------------------
// Premium Cardboard
//--------------------------------------------------

material.ambientColor =
    new BABYLON.Color3(
        0.42,
        0.42,
        0.42
    );

material.specularColor =
    new BABYLON.Color3(
        0.22,
        0.22,
        0.22
    );

material.specularPower = 140;

material.emissiveColor =
    new BABYLON.Color3(
        0.12,
        0.12,
        0.12
    );

material.backFaceCulling = false;

return material;

}

//--------------------------------------------------
// Box entfernen
//--------------------------------------------------

function disposeBox(box){

    if(!box) return;

    box.front.dispose();
    box.back.dispose();
    box.left.dispose();
    box.right.dispose();
    box.top.dispose();
    box.bottom.dispose();

}

//--------------------------------------------------
// Physikalische Boxgröße berechnen
//--------------------------------------------------

function getBoxSize(gameData){

    const d = gameData.dimensions;

    return{

        width  : d.width  * SCALE,
        height : d.height * SCALE,
        depth  : d.depth  * SCALE

    };

}

/* ==========================================
   Viewer Fade Animation
========================================== */

function fadeInBox() {

    const canvas = document.getElementById("viewer3d");

    canvas.classList.remove("viewer-fade-in");

    void canvas.offsetWidth;

    canvas.classList.add("viewer-fade-in");

}

//--------------------------------------------------
// Spiel laden
//--------------------------------------------------

async function loadGame(gameData){

    const folder = gameData.folder;

    function loadImage(file, optional = false){

    return new Promise((resolve, reject)=>{

        const img = new Image();

        img.onload = () => resolve(img);

        img.onerror = () => {

            if(optional){

                resolve(null);

            }else{

                reject(new Error(`Datei ${file}.webp nicht gefunden`));

            }

        };

        img.src =
            `../assets/textures/${folder}/${file}.webp`;

    });

}

//--------------------------------------------------
// Try Load Image
//--------------------------------------------------

async function tryLoadImage(file){

    try{

        return await loadImage(file);

    }catch{

        return null;

    }

}

    const images = {

    front : await loadImage("front"),

    back : await loadImage("back"),

    insideLeft : gameData.hasInside
        ? await tryLoadImage("inside_left")
        : null,

    insideRight : gameData.hasInside
        ? await tryLoadImage("inside_right")
        : null,

    insideSpin : gameData.hasInside && gameData.package?.type !== "flatpack"
        ? await tryLoadImage("inside_spin")
        : null,

    left : await loadImage("left"),

    right : await loadImage("right"),

    top : await loadImage("top"),

    bottom : await loadImage("bottom")

};

console.log("=== IMAGES ===");
console.log(images);
console.log("insideLeft:", images.insideLeft);
console.log("insideRight:", images.insideRight);
    
    const size = getBoxSize(gameData);

return{

    images,

    width  : size.width,
    height : size.height,
    depth  : size.depth,

    // A package becomes interactive only when both interior images loaded.
    // This keeps all ordinary boxes closed even when a data entry is incomplete.
    hasInside : Boolean(
        gameData.hasInside &&
        images.insideLeft &&
        images.insideRight
    )

};
    
}

//--------------------------------------------------
// Box erzeugen
//--------------------------------------------------

function buildBox(scene,pivot,current){

    const game = current.game;

    const materials = current.materials;

    const boxWidth  = game.width;
    const boxHeight = game.height;
    const boxDepth  = game.depth;

    const halfW = boxWidth / 2;
    const halfH = boxHeight / 2;
    const halfD = boxDepth / 2;

    //--------------------------------------------------
    // Front
    //--------------------------------------------------

    const front = BABYLON.MeshBuilder.CreatePlane(
        "front",
        {
            width: boxWidth,
            height: boxHeight
        },
        scene
    );

    front.parent = pivot;
    front.position.z = halfD;
    front.material = materials.front;

    //--------------------------------------------------
    // Back
    //--------------------------------------------------

    const back = BABYLON.MeshBuilder.CreatePlane(
        "backLight",
        {
            width: boxWidth,
            height: boxHeight
        },
        scene
    );

    back.parent = pivot;
    back.position.z = -halfD;
    back.rotation.y = Math.PI;
    back.material = materials.back;

    //--------------------------------------------------
    // Left
    //--------------------------------------------------

    const left = BABYLON.MeshBuilder.CreatePlane(
        "left",
        {
            width: boxDepth,
            height: boxHeight
        },
        scene
    );

    left.parent = pivot;
    left.position.x = -halfW;
    left.rotation.y = -Math.PI / 2;
    left.material = materials.left;

    //--------------------------------------------------
    // Right
    //--------------------------------------------------

    const right = BABYLON.MeshBuilder.CreatePlane(
        "right",
        {
            width: boxDepth,
            height: boxHeight
        },
        scene
    );

    right.parent = pivot;
    right.position.x = halfW;
    right.rotation.y = Math.PI / 2;
    right.material = materials.right;

    //--------------------------------------------------
    // Top
    //--------------------------------------------------

    const top = BABYLON.MeshBuilder.CreatePlane(
        "top",
        {
            width: boxWidth,
            height: boxDepth
        },
        scene
    );

    top.parent = pivot;
    top.position.y = halfH;
    top.rotation.x = Math.PI / 2;
    top.material = materials.top;

    //--------------------------------------------------
    // Bottom
    //--------------------------------------------------

    const bottom = BABYLON.MeshBuilder.CreatePlane(
        "bottom",
        {
            width: boxWidth,
            height: boxDepth
        },
        scene
    );

    bottom.parent = pivot;
    bottom.position.y = -halfH;
    bottom.rotation.x = Math.PI / 2;
    bottom.material = materials.bottom;

    return {

        front,
        back,
        left,
        right,
        top,
        bottom

    };

}

//--------------------------------------------------
// Präsentationsanimation
//--------------------------------------------------

function playPresentationAnimation(materials){

    //----------------------------------------------
    // Scale
    //----------------------------------------------

    const scaleAnimation = new BABYLON.Animation(

        "boxScale",

        "scaling",

        60,

        BABYLON.Animation.ANIMATIONTYPE_VECTOR3,

        BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT

    );

    scaleAnimation.setKeys([

        {

            frame:0,

            value:new BABYLON.Vector3(.82,.82,.82)

        },

        {

            frame:25,

            value:new BABYLON.Vector3(1,1,1)

        }

    ]);

    pivot.animations=[];

    pivot.animations.push(scaleAnimation);

    scene.beginAnimation(

        pivot,

        0,

        25,

        false

    );

    //----------------------------------------------
    // Fade
    //----------------------------------------------

    Object.values(materials).filter(Boolean).forEach(material=>{

        BABYLON.Animation.CreateAndStartAnimation(

            "fade",

            material,

            "alpha",

            60,

            25,

            0,

            1,

            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT

        );

    });

}

//--------------------------------------------------
// Hero Pose
//--------------------------------------------------

function animateHeroPose(){

    if(!pivot) return;

    const animation = new BABYLON.Animation(

        "heroPose",

        "rotation.y",

        60,

        BABYLON.Animation.ANIMATIONTYPE_FLOAT,

        BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT

    );

    animation.setKeys([

        {
            frame:0,
            value:Math.PI
        },

        {
            frame:35,
            value:HERO_ROTATION_Y
        }

    ]);

    pivot.animations.push(animation);

    scene.beginAnimation(

        pivot,

        0,

        35,

        false

    );

}

//--------------------------------------------------
// Showcase Rotation
//--------------------------------------------------

function startShowcaseRotation(){

    showcaseRotation = true;

}

function stopShowcaseRotation(){

    showcaseRotation = false;

    clearTimeout(showcaseIdleTimer);

    showcaseIdleTimer = setTimeout(

        ()=>{

            showcaseRotation = true;

        },

        SHOWCASE_DELAY

    );

}

// A flatpack starts from the same approved front pose as a newly loaded
// closed package. This makes the hand-off to its opening model predictable.
function alignFlatpackForOpening(onComplete){

    if(!pivot){
        onComplete?.();
        return;
    }

    const pose = new BABYLON.Animation(
        "flatpackFrontPose",
        "rotation.y",
        60,
        BABYLON.Animation.ANIMATIONTYPE_FLOAT,
        BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    pose.setKeys([
        { frame:0, value:pivot.rotation.y },
        { frame:18, value:HERO_ROTATION_Y }
    ]);

    window.viewerCamera.alpha = CAMERA_ALPHA;
    window.viewerCamera.beta = CAMERA_BETA;
    window.viewerCamera.radius = CAMERA_RADIUS;
    pivot.rotation.x = HERO_ROTATION_X;
    pivot.rotation.z = HERO_ROTATION_Z;

    scene.beginDirectAnimation(pivot, [pose], 0, 18, false, 1, onComplete);

}

function toggleCurrentPackage(){

    if(!currentPackage?.isOpenable) return;

    if(packageHintDismissed && currentPackage.openAmount <= 0.02) return;

    stopShowcaseRotation();

    if(currentPackage.openAmount > 0.5){
        Package.close(scene, currentPackage, () => {
            packageHintDismissed = false;
        });
        return;
    }

    packageHintDismissed = true;

    if(currentPackage.type === "flatpack"){
        alignFlatpackForOpening(() => Package.open(scene, currentPackage));
        return;
    }

    Package.open(scene, currentPackage);

}

function updatePackageOpenHint(){

    const hint = document.getElementById("package-open-hint");

    if(!hint || !scene || !engine || !canvas || !currentPackage?.isOpenable || packageHintDismissed || showcaseRotation ||
        currentPackage.isAnimating || currentPackage.openAmount > 0.02){
        hint?.classList.remove("visible");
        return;
    }

    hint.classList.add("visible");

}

//--------------------------------------------------
// Spiel anzeigen
//--------------------------------------------------

async function showGame(gameData){

    if(!gameData) return;

    hideCommunity();

    const game =
    await loadGame(
        gameData
    );

        const current = {

        gameData,
        game

    };

        if(currentPackage){

            Package.dispose(currentPackage);

        }

        currentPackage =

            Package.create(

                scene,

                pivot,

                current

            );

        packageHintDismissed = false;

        // The visible package owns the only material set. The former duplicate
        // materials made the fade animation run on meshes that were not shown.
        Object.values(currentPackage.materials).filter(Boolean).forEach(material => {

            material.alpha = 0;

        });

        //--------------------------------------------------
// Kamera zurücksetzen
//--------------------------------------------------

if (window.viewerCamera) {

    window.viewerCamera.alpha = CAMERA_ALPHA;

    window.viewerCamera.beta = CAMERA_BETA;

    window.viewerCamera.radius = CAMERA_RADIUS;

}


        playPresentationAnimation(currentPackage.materials);
        
        animateHeroPose();

        showcaseRotation = false;

clearTimeout(showcaseIdleTimer);

showcaseIdleTimer = setTimeout(

    ()=>{

        showcaseRotation = true;

    },

    2200

);

    setTimeout(() => {

    showCommunity(gameData.folder);

}, 1800);


//--------------------------------------------------
// Fade-In vorbereiten
//--------------------------------------------------

pivot.scaling.set(0.85,0.85,0.85);

let fade = 0;

        //--------------------------------------------------
// Startposition
//--------------------------------------------------

pivot.rotation.x = HERO_ROTATION_X;

pivot.rotation.y = Math.PI;

pivot.rotation.z = HERO_ROTATION_Z;

pivot.position.x = 0;
const STANDARD_HEIGHT = 275 * SCALE;

pivot.position.y =
    BOX_Y_OFFSET
    - ((game.height - STANDARD_HEIGHT) * 0.08);
pivot.position.z = 0;

updateInfoPanel(gameData);

}

function createScene() {

    console.log("1");

    scene = new BABYLON.Scene(engine);

//--------------------------------------------------
// Studio Environment
//--------------------------------------------------

scene.environmentTexture =
    BABYLON.CubeTexture.CreateFromPrefilteredData(

        "https://assets.babylonjs.com/environments/studio.env",

        scene

    );

scene.environmentIntensity = 0.45;

    console.log("2");

    window.debugScene = scene;

    console.log("3");

    scene.clearColor = new BABYLON.Color4(
    0,
    0,
    0,
    0
);

    console.log("4");

    const camera =
new BABYLON.ArcRotateCamera(
    "camera",
    CAMERA_ALPHA,
    CAMERA_BETA,
    CAMERA_RADIUS,
    BABYLON.Vector3.Zero(),
    scene
);

// Kamera global merken
window.viewerCamera = camera;

window.viewerCameraDefaultRadius = camera.radius;

    console.log("5");

    camera.attachControl(canvas, true);

    canvas.addEventListener(

    "pointerdown",

    stopShowcaseRotation

);

    canvas.addEventListener(

    "wheel",

    stopShowcaseRotation

);

// A short tap on an eligible package opens or closes it. Babylon emits
// POINTERTAP only when the pointer was not dragged, so camera orbit gestures
// remain untouched.
scene.onPointerObservable.add((pointerInfo) => {

    if (pointerInfo.type !== BABYLON.PointerEventTypes.POINTERTAP) return;

    const pickedMesh = pointerInfo.pickInfo?.pickedMesh;

    if (!pickedMesh || !currentPackage?.isOpenable) return;

    const packageMeshes = Object.values(currentPackage.meshes);

    if (!packageMeshes.includes(pickedMesh)) return;

    toggleCurrentPackage();

});

document.getElementById("package-open-hint").addEventListener("click", () => {
    toggleCurrentPackage();
});

//--------------------------------------------------
// Zoom Einstellungen
//--------------------------------------------------

camera.wheelPrecision = 60;

// minimaler Zoom
camera.lowerRadiusLimit = 2.0;

// maximaler Zoom
camera.upperRadiusLimit = 9.0;

console.log("6");

scene.activeCamera = camera;

camera.setTarget(
    new BABYLON.Vector3(
        0,
        0.10,
        0
    )
);

console.log("7");

pivot = new BABYLON.TransformNode(
    "pivot",
    scene
);

pivot.position.y = 0.0;
pivot.rotation.y = Math.PI;

//--------------------------------------------------
// Fenstergröße ändern
//--------------------------------------------------

window.addEventListener("resize", () => {

    if (!engine) return;

    engine.resize();

    if (isFullscreen) {

        animateViewerZoom(
            window.viewerCameraDefaultRadius * 0.88
        );

    } else {

        animateViewerZoom(
            window.viewerCameraDefaultRadius
        );

    }

});

//--------------------------------------------------
// Render Loop
//--------------------------------------------------

engine.runRenderLoop(() => {

    if (showcaseRotation && pivot) {

        pivot.rotation.y += SHOWCASE_SPEED;

    }

    updatePackageOpenHint();
    scene.render();

});

//--------------------------------------------------
// Studio Lighting
//--------------------------------------------------

// Grundlicht
const hemi = new BABYLON.HemisphericLight(

    "hemi",

    new BABYLON.Vector3(0,1,0),

    scene

);

hemi.intensity = 0.52;

hemi.groundColor =
    new BABYLON.Color3(
        0.05,
        0.05,
        0.05
    );

hemi.diffuse =
    new BABYLON.Color3(
        1,
        1,
        1
    );

//--------------------------------------------------
// Studio Spot Left
//--------------------------------------------------

//--------------------------------------------------
// Key Light Left
//--------------------------------------------------

const keyLightLeft =
    new BABYLON.DirectionalLight(

        "keyLightLeft",

        new BABYLON.Vector3(

            -0.28,
            -1,
            0.12

        ),

        scene

);

keyLightLeft.position =
    new BABYLON.Vector3(

        1.5,
        2.5,
        -0.8

);

keyLightLeft.intensity = 2.55;


//--------------------------------------------------
// Key Light Right
//--------------------------------------------------

const keyLightRight =
    new BABYLON.DirectionalLight(

        "keyLightRight",

        new BABYLON.Vector3(

            0.28,
            -1,
            0.12

        ),

        scene

);

keyLightRight.position =
    new BABYLON.Vector3(

        -2.5,
        4.5,
        -2

);

keyLightRight.intensity = 2.55;



//--------------------------------------------------
// Studio Spot Right
//--------------------------------------------------

const fillLight =
    new BABYLON.PointLight(

        "fillLight",

        new BABYLON.Vector3(

            3,
            2,
            3

        ),

        scene

);

fillLight.intensity = 2.95;



//--------------------------------------------------
// Rim Light
//--------------------------------------------------

const rimLight =
    new BABYLON.PointLight(

        "rimLight",

        new BABYLON.Vector3(

            -1.4,
            5.5,
            -4

        ),

        scene

);

rimLight.intensity = 2.10;

rimLight.diffuse =
    new BABYLON.Color3(

        1,
        1,
        1

);

//--------------------------------------------------
// Top Light
//--------------------------------------------------

const topLight =
    new BABYLON.PointLight(

        "topLight",

        new BABYLON.Vector3(

            0,
            6,
            0

        ),

        scene

);

topLight.intensity = 0.95;

topLight.diffuse =
    new BABYLON.Color3(

        1,
        1,
        1

);

scene.imageProcessingConfiguration.contrast = 1.15;

scene.imageProcessingConfiguration.exposure = 1.12;

}



//--------------------------------------------------
// Events
//--------------------------------------------------

document.addEventListener(

    "gameChanged",

    async(event)=>{

        await showGame(
            event.detail
        );

    }

);

function resizeCanvas() {

    console.log(
        "client:",
        canvas.clientWidth,
        canvas.clientHeight
    );

    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    console.log(
        "gesetzt:",
        canvas.width,
        canvas.height
    );

    engine.resize();

}

//--------------------------------------------------
// Fullscreen Events
//--------------------------------------------------

document.addEventListener(

    "fullscreenchange",

    ()=>{

        isFullscreen =
            !!document.fullscreenElement;

        const button =
            document.getElementById(
                "fullscreen-btn"
            );

        button.textContent =
            isFullscreen ? "🡼" : "⛶";

        //--------------------------------------------------
// Fullscreen UI
//--------------------------------------------------

const community =
    document.getElementById("community-panel");

const bottomChassis =
    document.querySelector(".rd-console-bottom");

if (community) {

    community.style.display =
        isFullscreen ? "none" : "";

}

if (bottomChassis) {

    bottomChassis.style.display =
        isFullscreen ? "none" : "";

}

        setTimeout(()=>{

    engine.resize();

    //----------------------------------
    // Kamera aktualisieren
    //----------------------------------

    if(window.viewerCamera){

        window.viewerCamera.rebuildAnglesAndRadius();

        window.viewerCamera.getProjectionMatrix(true);

    }

    //----------------------------------
    // Szene einmal neu rendern
    //----------------------------------

    if(scene){

        scene.render();

    }

},80);

    }

);



