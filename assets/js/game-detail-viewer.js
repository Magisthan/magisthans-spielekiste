/* =====================================================
   Reusable 3D box viewer for individual game pages
===================================================== */

(function(){
    "use strict";

    const viewerScriptUrl = document.currentScript?.src;
    const viewerControlsReady = loadViewerControls(viewerScriptUrl);
    const TEXTURE_BASE = "../assets/textures";
    const BOX_SCALE = 0.014;
    const AUTO_ROTATION_SPEED = 0.0025;

    function loadViewerControls(scriptUrl){
        if(window.ViewerInputControls) return Promise.resolve(window.ViewerInputControls);
        if(window.__viewerInputControlsReady) return window.__viewerInputControlsReady;
        window.__viewerInputControlsReady = new Promise((resolve,reject)=>{
            const script = document.createElement("script");
            script.src = new URL("viewer-input-controls.js",scriptUrl).href;
            script.onload = ()=>resolve(window.ViewerInputControls);
            script.onerror = reject;
            document.head.append(script);
        });
        return window.__viewerInputControlsReady;
    }

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

        createScanCredit(stage,gameData);

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
            const viewerControls = await viewerControlsReady;
            viewerControls.setup({
                camera,
                canvas,
                container:stage,
                onInteraction:()=>{ autoRotate = false; }
            });
            const guide = stage.querySelector(".game-detail-viewer-controls");
            if(guide){
                guide.innerHTML = "<span>Linke Taste: Drehen</span><span>Rechte Taste: Zoomen</span><span>Zwei Finger: Zoomen</span>";
            }
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

    function createScanCredit(stage,gameData){
        if(!gameData.scanBy || stage.querySelector(".game-detail-viewer-scan-credit")){
            return;
        }

        const credit = document.createElement("div");
        credit.className = "game-detail-viewer-scan-credit";
        credit.setAttribute("aria-label",`Scanned by ${gameData.scanBy}`);

        const label = document.createElement("span");
        label.className = "game-detail-viewer-scan-label";
        label.textContent = "SCANNED BY";

        const source = document.createElement("span");
        source.className = "game-detail-viewer-scan-source";
        source.textContent = gameData.scanBy;

        credit.append(label,source);
        stage.append(credit);
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
        camera.panningSensibility = 0;
        camera.inertia = .78;
        scene.activeCamera = camera;

        const hemi = new BABYLON.HemisphericLight(
            "gameDetailHemi",
            new BABYLON.Vector3(0,1,0),
            scene
        );
        hemi.intensity = .58;
        hemi.groundColor = new BABYLON.Color3(.04,.05,.07);

        const viewerFill = new BABYLON.PointLight(
            "gameDetailViewerFill",
            BABYLON.Vector3.Zero(),
            scene
        );
        viewerFill.intensity = 1.55;
        scene.onBeforeRenderObservable.add(() => {
            viewerFill.position.copyFrom(camera.globalPosition);
        });

        const key = new BABYLON.DirectionalLight(
            "gameDetailKey",
            new BABYLON.Vector3(-.3,-1,.65),
            scene
        );
        key.position = new BABYLON.Vector3(3,5,-2);
        key.intensity = .85;

        const rim = new BABYLON.PointLight(
            "gameDetailRim",
            new BABYLON.Vector3(2.5,4,-4),
            scene
        );
        rim.diffuse = new BABYLON.Color3(1,.84,.56);
        rim.intensity = .30;

        scene.imageProcessingConfiguration.toneMappingEnabled = true;
        scene.imageProcessingConfiguration.toneMappingType =
            BABYLON.ImageProcessingConfiguration.TONEMAPPING_ACES;
        scene.imageProcessingConfiguration.contrast = 1.06;
        scene.imageProcessingConfiguration.exposure = 1.0;
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
