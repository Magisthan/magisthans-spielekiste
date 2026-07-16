//----------------------------------
// Canvas
//----------------------------------

const canvas = document.getElementById("preview-viewer");
const engine = new BABYLON.Engine(canvas, true);

//----------------------------------
// Aktuelles Spiel
//----------------------------------

let currentGame = 0;

function resizeCanvas() {

    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    engine.resize();

}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();


//----------------------------------
// Szene
//----------------------------------

async function createScene() {

    const scene = new BABYLON.Scene(engine);

    scene.clearColor = new BABYLON.Color4(
        0.10,
        0.13,
        0.18,
        1
    );

    //----------------------------------
    // Kamera
    //----------------------------------

    const camera = new BABYLON.ArcRotateCamera(

        "camera",

        -Math.PI / 2.35,

        Math.PI / 2.45,

        8.8,

        BABYLON.Vector3.Zero(),

        scene

    );

    camera.attachControl(canvas, false);
    camera.fov = 0.65;

    //----------------------------------
    // Licht
    //----------------------------------

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

    //----------------------------------
    // Pivot
    //----------------------------------

    const pivot = new BABYLON.TransformNode(
        "pivot",
        scene
    );

    //----------------------------------
    // Referenzhöhe
    //----------------------------------

    const BOX_HEIGHT = 3.4;

    //----------------------------------
    // Material erzeugen
    //----------------------------------

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

    //----------------------------------
    // Bilder laden
    //----------------------------------

    function loadImage(folder,file) {

        return new Promise((resolve,reject)=>{

            const img = new Image();

            img.onload = ()=>resolve(img);

            img.onerror = reject;

            img.src = `assets/textures/${folder}/${file}.webp`;

        });

    }

    //----------------------------------
    // Spiel laden
    //----------------------------------

    async function loadGame(folder){

        const images = {

            front  : await loadImage(folder,"front"),
            back   : await loadImage(folder,"back"),
            left   : await loadImage(folder,"left"),
            right  : await loadImage(folder,"right"),
            top    : await loadImage(folder,"top"),
            bottom : await loadImage(folder,"bottom")

        };

        return{

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

        //----------------------------------
    // Box erzeugen
    //----------------------------------

    function buildBox(game, materials){

        const boxWidth  = game.width;
        const boxHeight = game.height;
        const boxDepth  = game.depth;

        const halfW = boxWidth / 2;
        const halfH = boxHeight / 2;
        const halfD = boxDepth / 2;

        const box = {};

        //----------------------------------
        // Front
        //----------------------------------

        box.front = BABYLON.MeshBuilder.CreatePlane(
            "front",
            {
                width: boxWidth,
                height: boxHeight
            },
            scene
        );

        box.front.parent = pivot;
        box.front.position.z = halfD;
        box.front.material = materials.front;

        //----------------------------------
        // Back
        //----------------------------------

        box.back = BABYLON.MeshBuilder.CreatePlane(
            "back",
            {
                width: boxWidth,
                height: boxHeight
            },
            scene
        );

        box.back.parent = pivot;
        box.back.position.z = -halfD;
        box.back.rotation.y = Math.PI;
        box.back.material = materials.back;

        //----------------------------------
        // Left
        //----------------------------------

        box.left = BABYLON.MeshBuilder.CreatePlane(
            "left",
            {
                width: boxDepth,
                height: boxHeight
            },
            scene
        );

        box.left.parent = pivot;
        box.left.position.x = -halfW;
        box.left.rotation.y = -Math.PI / 2;
        box.left.material = materials.left;

        //----------------------------------
        // Right
        //----------------------------------

        box.right = BABYLON.MeshBuilder.CreatePlane(
            "right",
            {
                width: boxDepth,
                height: boxHeight
            },
            scene
        );

        box.right.parent = pivot;
        box.right.position.x = halfW;
        box.right.rotation.y = Math.PI / 2;
        box.right.material = materials.right;

        //----------------------------------
        // Top
        //----------------------------------

        box.top = BABYLON.MeshBuilder.CreatePlane(
            "top",
            {
                width: boxWidth,
                height: boxDepth
            },
            scene
        );

        box.top.parent = pivot;
        box.top.position.y = halfH;
        box.top.rotation.x = Math.PI / 2;
        box.top.material = materials.top;

        //----------------------------------
        // Bottom
        //----------------------------------

        box.bottom = BABYLON.MeshBuilder.CreatePlane(
            "bottom",
            {
                width: boxWidth,
                height: boxDepth
            },
            scene
        );

        box.bottom.parent = pivot;
        box.bottom.position.y = -halfH;
        box.bottom.rotation.x = Math.PI / 2;
        box.bottom.material = materials.bottom;

        return box;

    }

    //----------------------------------
    // Box entfernen
    //----------------------------------

    let currentBox = null;

    function disposeBox(){

        if(!currentBox) return;

        Object.values(currentBox).forEach(mesh=>mesh.dispose());

    }

    //----------------------------------
    // Spiel anzeigen
    //----------------------------------

    async function showGame(folder){

        const game = await loadGame(folder);

        const materials = {

            front  : createMaterial(game.images.front),
            back   : createMaterial(game.images.back),
            left   : createMaterial(game.images.left),
            right  : createMaterial(game.images.right),
            top    : createMaterial(game.images.top),
            bottom : createMaterial(game.images.bottom)

        };

        //----------------------------------
        // Texturen korrigieren
        //----------------------------------

        materials.top.albedoTexture.uScale = 1;
        materials.top.albedoTexture.uOffset = 0;
        materials.top.albedoTexture.wAng = Math.PI / 2;

        materials.bottom.albedoTexture.wAng = -Math.PI / 2;

        disposeBox();

        currentBox = buildBox(
            game,
            materials
        );

    }

        //----------------------------------
    // Eigene Steuerung
    //----------------------------------

    let dragging = false;
    let hovering = false;

    let lastX = 0;
    let velocity = 0;

    const AUTO_ROTATE_SPEED = 0.003;

    //----------------------------------
    // Automatischer Wechsel
    //----------------------------------

    const CHANGE_INTERVAL = 10000; // 10 Sekunden

    let lastChange = performance.now();

    //----------------------------------
    // Wechselanimation
    //----------------------------------

    let changing = false;

    let targetScale = 1.0;

    let currentScale = 1.0;

    let changeStart = 0;

    const CHANGE_DURATION = 450;

    canvas.addEventListener("pointerenter", () => {

        hovering = true;

    });

    canvas.addEventListener("pointerleave", () => {

        hovering = false;
        dragging = false;

    });

    canvas.addEventListener("pointerdown", (e) => {

        dragging = true;
        lastX = e.clientX;

    });

    window.addEventListener("pointerup", () => {

        dragging = false;

    });

    window.addEventListener("pointermove", (e) => {

        if(!dragging) return;

        const dx = e.clientX - lastX;

        lastX = e.clientX;

        velocity = dx * 0.008;

        pivot.rotation.y += velocity;

    });

    //----------------------------------
    // Spiel laden
    //----------------------------------

    await showGame(
        GAMES[currentGame].folder
);

    //----------------------------------
    // Animation
    //----------------------------------

    scene.onBeforeRenderObservable.add(() => {

        //----------------------------------
        // Benutzer dreht nicht
        //----------------------------------

        if(!dragging){

            pivot.rotation.y += velocity;

            velocity *= 0.94;

        }

        //----------------------------------
        // Spiel wechseln
        //----------------------------------

        const now = performance.now();

        if(
            !changing &&
            now - lastChange > CHANGE_INTERVAL
){

            changing = true;

            changeStart = now;

            targetScale = 0.85;

}

        //----------------------------------
// Wechselanimation
//----------------------------------

currentScale +=
    (targetScale - currentScale) * 0.12;

pivot.scaling.set(
    currentScale,
    currentScale,
    currentScale
);

if(
    changing &&
    currentScale < 0.87
){

    currentGame++;

    if(currentGame >= GAMES.length){

        currentGame = 0;

    }

    showGame(
        GAMES[currentGame].folder
    );

    targetScale = 1.0;

    changing = false;

    lastChange = now;

}

        //----------------------------------
        // Langsame Auto-Rotation
        //----------------------------------

        if(!hovering && !dragging){

            pivot.rotation.y += AUTO_ROTATE_SPEED;

        }

    });

    return scene;

}


//----------------------------------
// Start
//----------------------------------

createScene().then((scene)=>{

    engine.runRenderLoop(()=>{

        scene.render();

    });

});