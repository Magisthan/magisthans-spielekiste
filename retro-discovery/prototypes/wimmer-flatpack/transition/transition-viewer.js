(() => {
    "use strict";

    const GAME = { width: 222, height: 222, depth: 7 };
    const ROOT = "../../../../assets/textures/7cities_of_gold_c64";
    const status = document.getElementById("state");
    const canvas = document.getElementById("viewer");
    const engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true });
    const scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color4(0.035, 0.075, 0.13, 1);

    const camera = new BABYLON.ArcRotateCamera("camera", Math.PI / 2, Math.PI / 2.35, 560, BABYLON.Vector3.Zero(), scene);
    camera.lowerRadiusLimit = 320;
    camera.upperRadiusLimit = 850;
    camera.wheelDeltaPercentage = 0.015;
    camera.panningSensibility = 0;
    camera.attachControl(canvas, true);
    const initialCamera = {
        alpha: camera.alpha,
        beta: camera.beta,
        radius: camera.radius,
        target: BABYLON.Vector3.Zero()
    };

    new BABYLON.HemisphericLight("hemi", new BABYLON.Vector3(0, 1, 0), scene).intensity = 1.1;
    const light = new BABYLON.DirectionalLight("key", new BABYLON.Vector3(-0.4, -0.8, -0.35), scene);
    light.position.set(180, 260, 250);
    light.intensity = 1.15;

    const images = Object.fromEntries([
        ["front", "front.webp"], ["back", "back.webp"], ["left", "left.webp"], ["right", "right.webp"],
        ["top", "top.webp"], ["bottom", "bottom.webp"], ["insideLeft", "inside_left.webp"],
        ["insideRight", "inside_right.webp"], ["insideSpin", "inside_spin.webp"]
    ].map(([name, file]) => [name, { src: `${ROOT}/${file}` }]));

    const closedUV = {};
    const gatefoldUV = {
        frontExterior: { flipU: true }, backExterior: { flipU: true },
        outerSpine: { flipU: true }, insideLeft: { flipU: true },
        insideRight: { flipU: false }, insideSpin: { flipU: false },
        fixedLeft: { flipU: true }, fixedTop: { flipU: true, rotation: Math.PI / 2 },
        fixedBottom: { flipU: true, rotation: -Math.PI / 2 }
    };

    const presentationRoot = new BABYLON.TransformNode("presentationRoot", scene);
    // The known-good PackageBuilder model is the sole visual start state.
    const closed = ClosedPackageAdapter.build(scene, presentationRoot, GAME, images, closedUV);
    const gatefold = WimmerGatefoldBuilder.build(scene, presentationRoot, GAME, images, gatefoldUV);
    gatefold.root.setEnabled(false);

    const OPEN_ANGLE = Math.PI - 0.5;
    // The rebuilt hinge is on the right cover edge; positive Y now opens the
    // front from that edge towards the left.
    const OPEN_DIRECTION = 1;
    const approach = (current, value, easing = 0.1) => current + (value - current) * easing;
    let target = 0;
    let progress = 0;
    let gatefoldActive = false;
    let phase = "closed";

    function shortestAngle(from, to) {
        return ((to - from + Math.PI) % (Math.PI * 2)) - Math.PI;
    }

    function activateGatefoldAtClosedPose() {
        // Identical closed pose before the first visible Gatefold frame.
        gatefold.fixedBody.position.x = 0;
        gatefold.frontHinge.position.x = GAME.width / 2;
        gatefold.frontHinge.rotation.y = 0;
        gatefold.root.setEnabled(true);
        closed.root.setEnabled(false);
        gatefoldActive = true;
    }

    function restoreClosedReference() {
        gatefold.root.setEnabled(false);
        closed.root.setEnabled(true);
        gatefoldActive = false;
    }

    function requestOpen() {
        if (phase !== "closed") return;
        // Closed box is freely inspectable. Only the click starts this reset.
        phase = "returning";
        camera.detachControl();
    }

    function requestClose() {
        if (phase !== "open") return;
        phase = "closing";
        target = 0;
    }

    function settleCameraAtStartPose() {
        camera.alpha += shortestAngle(camera.alpha, initialCamera.alpha) * 0.14;
        camera.beta += (initialCamera.beta - camera.beta) * 0.14;
        camera.radius += (initialCamera.radius - camera.radius) * 0.14;
        camera.target.x += (initialCamera.target.x - camera.target.x) * 0.16;
        camera.target.y += (initialCamera.target.y - camera.target.y) * 0.16;
        camera.target.z += (initialCamera.target.z - camera.target.z) * 0.16;

        const settled = Math.abs(shortestAngle(camera.alpha, initialCamera.alpha)) < 0.001
            && Math.abs(camera.beta - initialCamera.beta) < 0.001
            && Math.abs(camera.radius - initialCamera.radius) < 0.1
            && camera.target.length() < 0.1;
        if (!settled) return false;
        camera.alpha = initialCamera.alpha;
        camera.beta = initialCamera.beta;
        camera.radius = initialCamera.radius;
        camera.target.copyFrom(initialCamera.target);
        return true;
    }

    scene.onBeforeRenderObservable.add(() => {
        if (phase === "returning" && settleCameraAtStartPose()) {
            activateGatefoldAtClosedPose();
            target = 1;
            phase = "opening";
        }

        if (phase === "opening" || phase === "closing" || phase === "open") {
            progress = approach(progress, target);
            if (Math.abs(progress - target) < 0.0002) progress = target;
        }

        if (gatefoldActive) {
            // Wimmer-style coupled centring. The artwork itself is never moved
            // independently; the only changing part is the front-hinge angle.
            gatefold.fixedBody.position.x = -GAME.width / 2 * progress;
            gatefold.frontHinge.position.x = GAME.width / 2 * (1 - progress);
            gatefold.frontHinge.rotation.y = OPEN_DIRECTION * OPEN_ANGLE * progress;
            camera.target.x = approach(camera.target.x, GAME.width / 2 * progress, 0.12);

            if (phase === "opening" && progress === 1) {
                phase = "open";
                // The controlled opening is complete; the opened package is
                // now freely inspectable from every side again.
                camera.attachControl(canvas, true);
            }
            if (phase === "closing" && progress === 0) {
                restoreClosedReference();
                phase = "closed";
                camera.target.copyFrom(initialCamera.target);
                camera.attachControl(canvas, true);
            }
        }

        status.textContent = phase === "closed"
            ? "Geschlossen: frei drehen; Öffnen richtet zuerst die Frontansicht aus"
            : phase === "returning"
                ? "Richte die geschlossene Box für die Öffnungsanimation aus …"
                : phase === "open"
                    ? "Geöffnet: Gatefold aktiv"
                    : phase === "closing"
                        ? `Schließe: ${Math.round((1 - progress) * 100)} %`
                        : `Öffne: ${Math.round(progress * 100)} %`;
    });

    document.getElementById("toggle").addEventListener("click", () => {
        if (phase === "closed") requestOpen();
        else if (phase === "open") requestClose();
    });
    document.getElementById("closed").addEventListener("click", requestClose);
    document.getElementById("open").addEventListener("click", requestOpen);
    window.addEventListener("keydown", (event) => {
        if (event.code !== "Space") return;
        event.preventDefault();
        if (phase === "closed") requestOpen();
        else if (phase === "open") requestClose();
    });

    engine.runRenderLoop(() => scene.render());
    window.addEventListener("resize", () => engine.resize());
})();
