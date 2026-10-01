/* Small 3D package preview on the home page. */

const canvas = document.getElementById("preview-viewer");

if(canvas && window.BABYLON && window.Package){
    const engine = new BABYLON.Engine(canvas,true);
    const BOX_SCALE = 0.014;
    const AUTO_ROTATE_SPEED = 0.003;
    const CHANGE_INTERVAL = 10000;

    let currentGameIndex = 0;
    let currentPackage = null;

    function resizeCanvas(){
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
        engine.resize();
    }

    window.addEventListener("resize",resizeCanvas);
    resizeCanvas();

    async function createScene(){
        const scene = new BABYLON.Scene(engine);
        scene.clearColor = new BABYLON.Color4(0.10,0.13,0.18,1);

        const camera = new BABYLON.ArcRotateCamera(
            "previewCamera",
            -Math.PI / 2.35,
            Math.PI / 2.45,
            8.8,
            BABYLON.Vector3.Zero(),
            scene
        );
        camera.attachControl(canvas,false);
        camera.fov = 0.65;
        camera.lowerRadiusLimit = 3;
        camera.upperRadiusLimit = 11;

        window.ViewerInputControls?.setup({ camera,canvas,container:canvas.parentElement });

        const hemiLight = new BABYLON.HemisphericLight(
            "previewHemi",
            new BABYLON.Vector3(0,1,0),
            scene
        );
        hemiLight.intensity = 0.58;
        hemiLight.groundColor = new BABYLON.Color3(0.04,0.05,0.07);

        // This light follows the camera so the visible package face remains readable.
        const viewerFill = new BABYLON.PointLight(
            "previewViewerFill",
            BABYLON.Vector3.Zero(),
            scene
        );
        viewerFill.intensity = 1.55;
        scene.onBeforeRenderObservable.add(()=>{
            viewerFill.position.copyFrom(camera.globalPosition);
        });

        const keyLight = new BABYLON.DirectionalLight(
            "previewKey",
            new BABYLON.Vector3(-0.3,-1,0.65),
            scene
        );
        keyLight.position = new BABYLON.Vector3(3,5,-2);
        keyLight.intensity = 0.85;

        const rimLight = new BABYLON.PointLight(
            "previewRim",
            new BABYLON.Vector3(2.5,4,-4),
            scene
        );
        rimLight.diffuse = new BABYLON.Color3(1,0.84,0.56);
        rimLight.intensity = 0.30;

        scene.imageProcessingConfiguration.toneMappingEnabled = true;
        scene.imageProcessingConfiguration.toneMappingType =
            BABYLON.ImageProcessingConfiguration.TONEMAPPING_ACES;
        scene.imageProcessingConfiguration.contrast = 1.06;
        scene.imageProcessingConfiguration.exposure = 1.05;

        const pivot = new BABYLON.TransformNode("previewPivot",scene);

        function loadImage(folder,name,optional = false){
            return new Promise((resolve,reject)=>{
                const image = new Image();
                image.onload = ()=>resolve(image);
                image.onerror = ()=>optional
                    ? resolve(null)
                    : reject(new Error(`Missing texture: ${folder}/${name}.webp`));
                image.src = `assets/textures/${folder}/${name}.webp`;
            });
        }

        async function loadGame(gameData){
            const folder = gameData.folder;
            const [front,back,left,right,top,bottom,insideLeft,insideRight,insideSpin] =
                await Promise.all([
                    loadImage(folder,"front"),
                    loadImage(folder,"back"),
                    loadImage(folder,"left"),
                    loadImage(folder,"right"),
                    loadImage(folder,"top"),
                    loadImage(folder,"bottom"),
                    loadImage(folder,"inside_left",true),
                    loadImage(folder,"inside_right",true),
                    loadImage(folder,"inside_spin",true)
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

        async function showGame(gameData){
            const game = await loadGame(gameData);
            if(currentPackage) Package.dispose(currentPackage);
            currentPackage = Package.create(scene,pivot,{ gameData,game });
        }

        let dragging = false;
        let hovering = false;
        let lastX = 0;
        let velocity = 0;
        let lastChange = performance.now();
        let changing = false;
        let targetScale = 1;
        let currentScale = 1;

        canvas.addEventListener("pointerenter",()=>{ hovering = true; });
        canvas.addEventListener("pointerleave",()=>{
            hovering = false;
            dragging = false;
        });
        canvas.addEventListener("pointerdown",event=>{
            if(event.button !== 0) return;
            dragging = true;
            lastX = event.clientX;
        });
        window.addEventListener("pointerup",()=>{ dragging = false; });
        window.addEventListener("pointermove",event=>{
            if(!dragging) return;
            const deltaX = event.clientX - lastX;
            lastX = event.clientX;
            velocity = deltaX * 0.008;
            pivot.rotation.y += velocity;
        });

        await showGame(GAMES[currentGameIndex]);

        scene.onBeforeRenderObservable.add(()=>{
            if(!dragging){
                pivot.rotation.y += velocity;
                velocity *= 0.94;
            }

            const now = performance.now();
            if(!changing && now - lastChange > CHANGE_INTERVAL){
                changing = true;
                targetScale = 0.85;
            }

            currentScale += (targetScale - currentScale) * 0.12;
            pivot.scaling.setAll(currentScale);

            if(changing && currentScale < 0.87){
                currentGameIndex = (currentGameIndex + 1) % GAMES.length;
                showGame(GAMES[currentGameIndex]).catch(error=>{
                    console.error("Preview viewer:",error);
                });
                targetScale = 1;
                changing = false;
                lastChange = now;
            }

            if(!hovering && !dragging){
                pivot.rotation.y += AUTO_ROTATE_SPEED;
            }
        });

        return scene;
    }

    createScene()
        .then(scene=>{
            engine.runRenderLoop(()=>scene.render());
            window.addEventListener("pagehide",()=>{
                if(currentPackage) Package.dispose(currentPackage);
                engine.dispose();
            },{ once:true });
        })
        .catch(error=>{
            console.error("Preview viewer:",error);
            engine.dispose();
        });
}
