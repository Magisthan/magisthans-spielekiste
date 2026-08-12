/*
 * Native Babylon flatpack colour test.
 *
 * This is intentionally independent of viewer-test.js and contains neither
 * labels nor artwork. It uses four explicitly positioned FreeCamera poses so
 * no ArcRotate alpha convention can silently reverse a diagnostic view.
 */
(() => {
    "use strict";

    const WIDTH = 222;
    const HEIGHT = 222;
    const DEPTH = 7;
    const COVER_DEPTH = 1;
    const BODY_DEPTH = DEPTH - COVER_DEPTH;
    const SPINE_WIDTH = DEPTH;
    const HALF_WIDTH = WIDTH / 2;
    const EDGE_THICKNESS = 0.45;
    const OPEN_ANGLE = Math.PI - 0.5;

    const canvas = document.getElementById("viewer");
    const stateLabel = document.getElementById("state");
    const engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true });
    const scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color4(0.025, 0.04, 0.07, 1);

    const camera = new BABYLON.FreeCamera("inspection-camera", new BABYLON.Vector3(0, 0, 800), scene);
    camera.fov = 0.72;
    camera.minZ = 0.1;

    const light = new BABYLON.HemisphericLight("hemi", new BABYLON.Vector3(0, 1, 0), scene);
    light.intensity = 1.05;
    light.groundColor = new BABYLON.Color3(0.08, 0.09, 0.12);

    const palette = {
        front: "#d946ef",
        back: "#f97316",
        right: "#facc15",
        left: "#94a3b8",
        insideLeft: "#22c55e",
        insideSpin: "#ef4444",
        insideRight: "#3b82f6",
        top: "#06b6d4",
        bottom: "#8b5cf6",
        edge: "#202a39"
    };

    function material(name) {
        const mat = new BABYLON.StandardMaterial(`material-${name}`, scene);
        const color = BABYLON.Color3.FromHexString(palette[name]);
        mat.diffuseColor = color;
        mat.emissiveColor = color.scale(0.08);
        mat.specularColor = BABYLON.Color3.Black();
        return mat;
    }

    const materials = Object.fromEntries(
        Object.keys(palette).map((name) => [name, material(name)])
    );

    // Babylon box material slots: +Z, -Z, +X, -X, +Y, -Y.
    function createSolid(name, options, slots, parent) {
        const mesh = BABYLON.MeshBuilder.CreateBox(name, options, scene);
        const multi = new BABYLON.MultiMaterial(`${name}-multi`, scene);
        multi.subMaterials = slots.map((slot) => materials[slot || "edge"]);
        mesh.material = multi;
        mesh.parent = parent;
        return mesh;
    }

    const root = new BABYLON.TransformNode("flatpack-root", scene);
    const fixedAssembly = new BABYLON.TransformNode("fixed-assembly", scene);
    fixedAssembly.parent = root;

    // Fixed back panel: exterior back (-Z), interior inside-right (+Z).
    createSolid(
        "fixed-back-body",
        { width: WIDTH, height: HEIGHT, depth: BODY_DEPTH },
        ["insideRight", "back", null, null, null, null],
        fixedAssembly
    );

    // Fixed spine. The red inner face and yellow outer edge share one actual
    // body. Its right edge is the closed front-cover pivot.
    const fixedSpine = createSolid(
        "fixed-spine",
        { width: SPINE_WIDTH, height: HEIGHT, depth: COVER_DEPTH },
        ["insideSpin", null, null, "right", null, null],
        fixedAssembly
    );
    fixedSpine.position.set(-HALF_WIDTH - SPINE_WIDTH / 2, 0, BODY_DEPTH / 2 + COVER_DEPTH / 2);

    // The three remaining closed-shell edges are present only while closed.
    const topShell = createSolid(
        "closed-top",
        { width: WIDTH + SPINE_WIDTH, height: EDGE_THICKNESS, depth: DEPTH },
        ["top", "top", "top", "top", "top", "top"],
        fixedAssembly
    );
    topShell.position.set(-SPINE_WIDTH / 2, HEIGHT / 2, 0);
    const bottomShell = createSolid(
        "closed-bottom",
        { width: WIDTH + SPINE_WIDTH, height: EDGE_THICKNESS, depth: DEPTH },
        ["bottom", "bottom", "bottom", "bottom", "bottom", "bottom"],
        fixedAssembly
    );
    bottomShell.position.set(-SPINE_WIDTH / 2, -HEIGHT / 2, 0);
    const leftShell = createSolid(
        "closed-left",
        { width: EDGE_THICKNESS, height: HEIGHT, depth: DEPTH },
        ["left", "left", "left", "left", "left", "left"],
        fixedAssembly
    );
    leftShell.position.set(HALF_WIDTH, 0, 0);
    const closedShellEdges = [topShell, bottomShell, leftShell];

    // Moving front panel: exterior front (+Z), interior inside-left (-Z).
    const frontHinge = new BABYLON.TransformNode("front-hinge", scene);
    frontHinge.parent = root;
    const frontCover = createSolid(
        "front-cover",
        { width: WIDTH, height: HEIGHT, depth: COVER_DEPTH },
        ["front", "insideLeft", null, null, null, null],
        frontHinge
    );
    frontCover.position.x = HALF_WIDTH;

    const closedHingeZ = BODY_DEPTH / 2 + COVER_DEPTH / 2;
    const openHingeZ = BODY_DEPTH / 2;
    const poses = {
        "closed-front": {
            label: "Geschlossen außen vorne: front, gelbe right-Kante links",
            fixedX: 0,
            hingeX: -HALF_WIDTH,
            hingeZ: closedHingeZ,
            angle: 0,
            camera: new BABYLON.Vector3(-360, 50, 820),
            target: new BABYLON.Vector3(-10, 0, 0),
            closed: true
        },
        "closed-back": {
            label: "Geschlossen außen hinten: back",
            fixedX: 0,
            hingeX: -HALF_WIDTH,
            hingeZ: closedHingeZ,
            angle: 0,
            camera: new BABYLON.Vector3(320, 45, -820),
            target: new BABYLON.Vector3(0, 0, 0),
            closed: true
        },
        "open-outer": {
            label: "Geöffnet außen: back | right | front",
            fixedX: HALF_WIDTH,
            hingeX: 0,
            hingeZ: openHingeZ,
            angle: OPEN_ANGLE,
            camera: new BABYLON.Vector3(-420, 70, -900),
            target: new BABYLON.Vector3(0, 0, 0),
            closed: false
        },
        "open-inner": {
            label: "Geöffnet innen: inside-left | inside-spin | inside-right",
            fixedX: HALF_WIDTH,
            hingeX: 0,
            hingeZ: openHingeZ,
            angle: OPEN_ANGLE,
            camera: new BABYLON.Vector3(420, 70, 900),
            target: new BABYLON.Vector3(0, 0, 0),
            closed: false
        }
    };

    function setPose(name) {
        const pose = poses[name];
        if (!pose) return;
        // A pose always restores the canonical, unrotated inspection state.
        root.rotation.set(0, 0, 0);
        fixedAssembly.position.x = pose.fixedX;
        frontHinge.position.x = pose.hingeX;
        frontHinge.position.z = pose.hingeZ;
        frontHinge.rotation.y = pose.angle;
        closedShellEdges.forEach((edge) => edge.setEnabled(pose.closed));
        camera.position.copyFrom(pose.camera);
        camera.setTarget(pose.target);
        stateLabel.textContent = pose.label;
    }

    document.querySelectorAll("[data-pose]").forEach((button) => {
        button.addEventListener("click", () => setPose(button.dataset.pose));
    });

    // Direct model rotation keeps every camera pose deterministic while still
    // allowing a user to inspect all physical edges with mouse or touch.
    let pointerId = null;
    let lastX = 0;
    let lastY = 0;
    canvas.addEventListener("pointerdown", (event) => {
        pointerId = event.pointerId;
        lastX = event.clientX;
        lastY = event.clientY;
        canvas.setPointerCapture(pointerId);
    });
    canvas.addEventListener("pointermove", (event) => {
        if (event.pointerId !== pointerId) return;
        root.rotation.y += (event.clientX - lastX) * 0.01;
        root.rotation.x = BABYLON.Scalar.Clamp(
            root.rotation.x + (event.clientY - lastY) * 0.006,
            -0.75,
            0.75
        );
        lastX = event.clientX;
        lastY = event.clientY;
    });
    function endPointer(event) {
        if (event.pointerId !== pointerId) return;
        if (canvas.hasPointerCapture(pointerId)) canvas.releasePointerCapture(pointerId);
        pointerId = null;
    }
    canvas.addEventListener("pointerup", endPointer);
    canvas.addEventListener("pointercancel", endPointer);

    setPose("closed-front");
    engine.runRenderLoop(() => scene.render());
    window.addEventListener("resize", () => engine.resize());
})();
