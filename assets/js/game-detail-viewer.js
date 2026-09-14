/* =====================================================
   Reusable 3D box viewer for individual game pages
===================================================== */

(function(){
    "use strict";

    const TEXTURE_BASE = "../assets/textures";
    const BOX_SCALE = 0.014;
    const AUTO_ROTATION_SPEED = 0.0025;

    document.addEventListener("DOMContentLoaded",()=>{
        document.querySelectorAll("[data-game-detail-viewer]")
            .forEach(stage=>initGameDetailViewer(stage));
    });

    async function initGameDetailViewer(stage){
        const canvas = stage.querySelector(".game-detail-viewer-canvas");
        const loading = stage.querySelector(".game-detail-viewer-loading");
        const openButton = stage.querySelector(".game-detail-viewer-open");
        const fullscreenButton = stage.querySelector(".game-detail-viewer-fullscreen");
        const page = window.location.pathname.split("/").pop();
        const games = typeof GAMES !== "undefined" ? GAMES : [];
        const canonicalPage = page.replace(/ \(\d+\)(?=\.html$)/i,"");
        const gameData = games.find(game=>game.page === page) ||
            games.find(game=>game.page === canonicalPage);

        if(!canvas || !window.BABYLON || !window.Package || !gameData){
            showError(stage,loading,"Die 3D-Box konnte nicht geladen werden.");
            return;
        }

        let engine;
        let scene;
        let camera;
        let pivot;
        let currentPackage;
        let autoRotate = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        try{
            engine = new BABYLON.Engine(canvas,true,{
                preserveDrawingBuffer:false,
                stencil:true
            },true);

            scene = createScene(engine,canvas);
            camera = scene.activeCamera;
            pivot = new BABYLON.TransformNode("gameDetailPivot",scene);
            pivot.rotation.y = Math.PI;

            const game = await loadGameTextures(gameData);
            const current = { gameData,game };
            currentPackage = Package.create(scene,pivot,current);

            pivot.scaling.set(.86,.86,.86);
            animatePresentation(scene,pivot);

            if(currentPackage.isOpenable && openButton){
                openButton.hidden = false;
                openButton.addEventListener("click",()=>{
                    autoRotate = false;
                    if(currentPackage.isAnimating) return;

                    Package.toggle(scene,currentPackage,()=>{
                        const isOpen = currentPackage.openAmount > .5;
                        openButton.textContent = isOpen ? "BOX SCHLIESSEN" : "BOX ÖFFNEN";
                        camera.radius = isOpen ? 8.3 : 7;
                    });
                });
            }

            const stopAutoRotation = ()=>{ autoRotate = false; };
            canvas.addEventListener("pointerdown",stopAutoRotation,{ passive:true });
            canvas.addEventListener("wheel",stopAutoRotation,{ passive:true });

            fullscreenButton?.addEventListener("click",async()=>{
                if(document.fullscreenElement === stage){
                    await document.exitFullscreen();
                }else{
                    await stage.requestFullscreen();
                }
            });

            document.addEventListener("fullscreenchange",()=>{
                if(fullscreenButton){
                    fullscreenButton.textContent = document.fullscreenElement === stage ? "×" : "⛶";
                    fullscreenButton.setAttribute(
                        "aria-label",
                        document.fullscreenElement === stage
                            ? "Vollbild schließen"
                            : "3D-Ansicht im Vollbild öffnen"
                    );
                }
                engine.resize();
            });

            const resizeObserver = new ResizeObserver(()=>engine.resize());
            resizeObserver.observe(stage);

            engine.runRenderLoop(()=>{
                if(autoRotate && pivot && !currentPackage?.isAnimating){
                    pivot.rotation.y += AUTO_ROTATION_SPEED;
                }
                scene.render();
            });

            stage.classList.add("is-ready");

            window.addEventListener("pagehide",()=>{
                resizeObserver.disconnect();
                Package.dispose(currentPackage);
                engine.dispose();
            },{ once:true });
        }catch(error){
            console.error("Game detail viewer:",error);
            engine?.dispose();
            showError(stage,loading,"Die Texturen der 3D-Box konnten nicht geladen werden.");
        }
    }

    function createScene(engine,canvas){
        const scene = new BABYLON.Scene(engine);
        scene.clearColor = new BABYLON.Color4(0,0,0,0);

        const camera = new BABYLON.ArcRotateCamera(
            "gameDetailCamera",
            -Math.PI / 2,
            Math.PI / 2.45,
            7,
            new BABYLON.Vector3(0,.08,0),
            scene
        );

        camera.attachControl(canvas,true);
        camera.lowerRadiusLimit = 3.1;
        camera.upperRadiusLimit = 10;
        camera.lowerBetaLimit = .35;
        camera.upperBetaLimit = Math.PI - .35;
        camera.wheelPrecision = 55;
        camera.panningSensibility = 0;
        camera.inertia = .78;
        scene.activeCamera = camera;

        const hemi = new BABYLON.HemisphericLight(
            "gameDetailHemi",
            new BABYLON.Vector3(0,1,0),
            scene
        );
        hemi.intensity = .62;
        hemi.groundColor = new BABYLON.Color3(.04,.05,.07);

        const key = new BABYLON.DirectionalLight(
            "gameDetailKey",
            new BABYLON.Vector3(-.3,-1,.35),
            scene
        );
        key.position = new BABYLON.Vector3(3,5,-2);
        key.intensity = 2.25;

        const fill = new BABYLON.PointLight(
            "gameDetailFill",
            new BABYLON.Vector3(-3,2.5,3),
            scene
        );
        fill.diffuse = new BABYLON.Color3(.66,.82,1);
        fill.intensity = 1.35;

        const rim = new BABYLON.PointLight(
            "gameDetailRim",
            new BABYLON.Vector3(2.5,4,-4),
            scene
        );
        rim.diffuse = new BABYLON.Color3(1,.84,.56);
        rim.intensity = 1.1;

        scene.imageProcessingConfiguration.contrast = 1.12;
        scene.imageProcessingConfiguration.exposure = 1.08;
        return scene;
    }

    async function loadGameTextures(gameData){
        const loadImage = (name,optional=false)=>new Promise((resolve,reject)=>{
            const image = new Image();
            image.onload = ()=>resolve(image);
            image.onerror = ()=>optional
                ? resolve(null)
                : reject(new Error(`Missing texture: ${name}.webp`));
            image.src = `${TEXTURE_BASE}/${gameData.folder}/${name}.webp`;
        });

        const [front,back,left,right,top,bottom,insideLeft,insideRight,insideSpin] =
            await Promise.all([
                loadImage("front"),
                loadImage("back"),
                loadImage("left"),
                loadImage("right"),
                loadImage("top"),
                loadImage("bottom"),
                loadImage("inside_left",true),
                loadImage("inside_right",true),
                loadImage("inside_spin",true)
            ]);

        const dimensions = gameData.dimensions || {};
        return {
            images:{ front,back,left,right,top,bottom,insideLeft,insideRight,insideSpin },
            width:(dimensions.width || 200) * BOX_SCALE,
            height:(dimensions.height || 260) * BOX_SCALE,
            depth:Math.max(dimensions.depth || 20,3) * BOX_SCALE,
            hasInside:Boolean(gameData.hasInside && insideLeft && insideRight)
        };
    }

    function animatePresentation(scene,pivot){
        const animation = new BABYLON.Animation(
            "gameDetailPresentation",
            "scaling",
            60,
            BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
        );
        animation.setKeys([
            { frame:0,value:new BABYLON.Vector3(.86,.86,.86) },
            { frame:42,value:BABYLON.Vector3.One() }
        ]);
        const easing = new BABYLON.CubicEase();
        easing.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEOUT);
        animation.setEasingFunction(easing);
        scene.beginDirectAnimation(pivot,[animation],0,42,false);
    }

    function showError(stage,loading,message){
        stage.classList.add("has-error");
        if(loading) loading.textContent = message;
    }
})();
