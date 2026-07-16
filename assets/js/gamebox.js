const canvas = document.getElementById("pirates-viewer");
const engine = new BABYLON.Engine(canvas, true);
const fullscreenButton =
document.getElementById(
    "fullscreen-button"
);

let currentFolder = "";

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
// Szene
//--------------------------------------------------

async function createScene() {

    const scene = new BABYLON.Scene(engine);

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

    //--------------------------------------------------
    // Licht
    //--------------------------------------------------

    const hemiLight = new BABYLON.HemisphericLight(

        "hemi",

        new BABYLON.Vector3(0,1,0),

        scene

    );

    hemiLight.intensity = 1.9;

    const dirLight = new BABYLON.DirectionalLight(

        "dir",

        new BABYLON.Vector3(-1,-2,-1),

        scene

    );

    dirLight.position = new BABYLON.Vector3(5,8,5);
    dirLight.intensity = 1.4;

    //--------------------------------------------------
    // Pivot
    //--------------------------------------------------

    const pivot = new BABYLON.TransformNode(
        "pivot",
        scene
    );

    pivot.position.y = -0.50;

    
    //--------------------------------------------------
    // Referenzhöhe
    //--------------------------------------------------

    const BOX_HEIGHT = 3.4;

    //--------------------------------------------------
    // Material erzeugen
    //--------------------------------------------------

    function createMaterial(image) {

        const material = new BABYLON.PBRMaterial(
            "mat",
            scene
        );

        material.albedoTexture = new BABYLON.Texture(
            image.src,
            scene
        );

        material.albedoTexture.uScale = -1;
        material.albedoTexture.uOffset = 1;

        material.metallic = 0;
        material.roughness = 0.85;
        material.backFaceCulling = false;

        return material;

    }

    //--------------------------------------------------
    // Spiel laden
    //--------------------------------------------------

    async function loadGame(folder) {

        function loadImage(file) {

            return new Promise((resolve,reject)=>{

                const img = new Image();

                img.onload = ()=>resolve(img);

                img.onerror = reject;

                img.src = `/assets/textures/${folder}/${file}.webp`;

            });

        }

        const images = {

            front  : await loadImage("front"),
            back   : await loadImage("back"),
            left   : await loadImage("left"),
            right  : await loadImage("right"),
            top    : await loadImage("top"),
            bottom : await loadImage("bottom")

        };

        return {

            images,

            width:
                BOX_HEIGHT *
                (images.front.naturalWidth /
                 images.front.naturalHeight),

            height:
                BOX_HEIGHT,

            depth:
                BOX_HEIGHT *
                (images.left.naturalWidth /
                 images.left.naturalHeight)

        };

    }

    //--------------------------------------------------
    // Spiel anzeigen
    //--------------------------------------------------

    let currentBox = null;
    
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

    const game = await loadGame(gameData.folder);

    const materials = {

    front  : createMaterial(game.images.front),
    back   : createMaterial(game.images.back),
    left   : createMaterial(game.images.left),
    right  : createMaterial(game.images.right),
    top    : createMaterial(game.images.top),
    bottom : createMaterial(game.images.bottom)

};

    materials.top.albedoTexture.uScale = 1;
    materials.top.albedoTexture.uOffset = 0;
    materials.top.albedoTexture.wAng = Math.PI / 2;

    materials.bottom.albedoTexture.wAng = -Math.PI / 2;

const current = {

    gameData,
    game,
    materials

};

if (currentBox) {

    disposeBox(currentBox);

}

currentBox = buildBox(
    scene,
    pivot,
    current
);

return current;

}

let currentGame = 0;

const current = await showGame(currentGame);

const game = current.game;

//--------------------------------------------------
// Collection Search
//--------------------------------------------------

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

            <span>${game.title}</span>

            <small>${game.system}</small>

        `;

        item.addEventListener("click", async ()=>{

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


    //--------------------------------------------------
    // Materialien
    //--------------------------------------------------

    const materials = current.materials;

    
    //--------------------------------------------------
// Box erzeugen
//--------------------------------------------------

function buildBox(
    scene,
    pivot,
    current
) {

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
        "back",
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
// Box entfernen
//--------------------------------------------------

function disposeBox(box) {

    if (!box) return;

    box.front.dispose();
    box.back.dispose();
    box.left.dispose();
    box.right.dispose();
    box.top.dispose();
    box.bottom.dispose();

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
    // Texturen korrigieren
    //--------------------------------------------------

    console.log(currentBox);

    //--------------------------------------------------
    // Eigene Steuerung
    //--------------------------------------------------

    let dragging = false;
    let lastX = 0;
    let velocity = 0;

    canvas.addEventListener("pointerdown", (e) => {

        dragging = true;
        lastX = e.clientX;

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

createScene().then((scene) => {

    engine.runRenderLoop(() => {

        scene.render();

    });

});

//--------------------------------------------------
// Archive
//--------------------------------------------------

let archiveTimers = [];

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

    const result =
        document.getElementById("archive-result");

    const image =
        document.getElementById("archive-image");

    if(!loading) return;

    loading.style.zIndex = "1";
    loading.classList.remove("hide");
    content.classList.remove("show");
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

    image.classList.remove("show");
    image.src = "";

}

function startArchive(folder){

    resetArchive();

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

    if(!loading) return;

    console.log(folder);

    console.log(
        `assets/textures/${folder}/content.webp`
    );

    image.src =
        `assets/textures/${folder}/content.webp`;

    image.onerror = ()=>{

        result.textContent =
            "No archive material available.";

    };

    //--------------------------------------------------
    // Phase 1
    //--------------------------------------------------

    archiveTimers.push(

        setTimeout(()=>{

            status.textContent =
                "> Searching archive...";

            bar.textContent =
                "[██░░░░░░░░░░]";

        },700)

    );

    archiveTimers.push(

        setTimeout(()=>{

            status.textContent =
                "> Accessing collection database...";

            bar.textContent =
                "[████░░░░░░░░]";

        },1400)

    );

    archiveTimers.push(

        setTimeout(()=>{

            status.textContent =
                "> Authenticating media...";

            bar.textContent =
                "[███████░░░░░]";

        },2200)

    );

    archiveTimers.push(

        setTimeout(()=>{

            bar.textContent =
                "[██████████░░]";

        },3000)

    );

    archiveTimers.push(

        setTimeout(()=>{

            bar.textContent =
                "[████████████]";

        },3600)

    );

    archiveTimers.push(

        setTimeout(()=>{

            result.textContent =
                "✓ Archive scan complete.";

        },4100)

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

        setTimeout(()=>{

            loading.style.zIndex = "2";

        },800);

    },5000)

);

}

const toggle = document.getElementById("game-info-toggle");
const panel = document.getElementById("game-info-panel");

toggle.addEventListener("click", () => {

    panel.classList.toggle("open");

    const open =
        panel.classList.contains("open");

    toggle.textContent =
        open ? "⌄" : "⌃";

    if(panel.classList.contains("open")){

    startArchive(currentFolder);

}else{

    resetArchive();

}

});

