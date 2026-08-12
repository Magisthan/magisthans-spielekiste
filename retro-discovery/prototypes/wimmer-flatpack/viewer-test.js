/*
 * Babylon-native flatpack geometry test.
 *
 * The three main physical parts are real thin boxes. Face slots are Babylon's
 * CreateBox order: +Z, -Z, +X, -X, +Y, -Y. No primary artwork surface is a
 * free-standing plane.
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
    const OPEN_ANGLE = Math.PI - 0.5;
    const EDGE_THICKNESS = 0.45;

    const canvas = document.getElementById("viewer");
    const stateLabel = document.getElementById("state");
    const engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true });
    const scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color4(0.025, 0.04, 0.07, 1);

    const camera = new BABYLON.ArcRotateCamera(
        "test-camera", Math.PI / 2, Math.PI / 2.25, 650, BABYLON.Vector3.Zero(), scene
    );
    camera.lowerRadiusLimit = 350;
    camera.upperRadiusLimit = 980;
    camera.wheelDeltaPercentage = 0.015;
    camera.panningSensibility = 0;
    camera.attachControl(canvas, true);

    const light = new BABYLON.HemisphericLight("test-hemi", new BABYLON.Vector3(0, 1, 0), scene);
    light.intensity = 1.1;
    light.groundColor = new BABYLON.Color3(0.07, 0.08, 0.11);

    // Per-surface UV choices are intentionally documented here. Based on the
    // previous diagnostic screenshots, front and inside-right receive the
    // requested U-flip correction; back and inside-left retain their readable
    // orientation. The values apply only to this colour test.
    const SURFACES = {
        front: { label: "front", color: "#d946ef", flipU: false, flipV: true },
        back: { label: "back", color: "#f97316", flipU: false, flipV: true },
        right: { label: "right", color: "#facc15", flipU: false, flipV: true },
        left: { label: "left", color: "#94a3b8", flipU: false, flipV: true },
        insideLeft: { label: "inside-left", color: "#22c55e", flipU: false, flipV: true },
        insideSpin: { label: "inside-spin", color: "#ef4444", flipU: false, flipV: true },
        insideRight: { label: "inside-right", color: "#3b82f6", flipU: false, flipV: true },
        top: { label: "top", color: "#06b6d4", flipU: false, flipV: true },
        bottom: { label: "bottom", color: "#8b5cf6", flipU: false, flipV: true }
    };

    function createLabelMaterial(key) {
        const surface = SURFACES[key];
        const texture = new BABYLON.DynamicTexture(`label-${key}`, { width: 1024, height: 1024 }, scene, true);
        const context = texture.getContext();
        context.fillStyle = surface.color;
        context.fillRect(0, 0, 1024, 1024);
        context.strokeStyle = "#ffffff";
        context.lineWidth = 32;
        context.strokeRect(16, 16, 992, 992);
        context.fillStyle = "#101218";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.font = "bold 92px Arial";
        context.fillText(surface.label, 512, 470);
        context.font = "46px Arial";
        context.fillText("geometry test", 512, 590);
        texture.update(false);
        texture.uScale = surface.flipU ? -1 : 1;
        texture.uOffset = surface.flipU ? 1 : 0;
        texture.vScale = surface.flipV ? -1 : 1;
        texture.vOffset = surface.flipV ? 1 : 0;

        const material = new BABYLON.StandardMaterial(`material-${key}`, scene);
        material.diffuseTexture = texture;
        material.emissiveColor = BABYLON.Color3.FromHexString(surface.color).scale(0.2);
        material.specularColor = BABYLON.Color3.Black();
        material.backFaceCulling = true;
        return material;
    }

    const materials = Object.fromEntries(
        Object.keys(SURFACES).map((key) => [key, createLabelMaterial(key)])
    );
    const edgeMaterial = new BABYLON.StandardMaterial("edge-material", scene);
    edgeMaterial.diffuseColor = new BABYLON.Color3(0.13, 0.16, 0.21);
    edgeMaterial.emissiveColor = new BABYLON.Color3(0.02, 0.025, 0.035);
    edgeMaterial.specularColor = BABYLON.Color3.Black();

    function createBox(name, options, faceKeys, parent) {
        const box = BABYLON.MeshBuilder.CreateBox(name, options, scene);
        const multi = new BABYLON.MultiMaterial(`${name}-multi`, scene);
        // Face-slot order is fixed and explicit: +Z, -Z, +X, -X, +Y, -Y.
        multi.subMaterials = faceKeys.map((key) => key ? materials[key] : edgeMaterial);
        box.material = multi;
        box.parent = parent;
        return box;
    }

    const root = new BABYLON.TransformNode("flatpack-root", scene);
    const fixedAssembly = new BABYLON.TransformNode("fixed-assembly", scene);
    fixedAssembly.parent = root;

    // Fixed back: +Z is the opened interior, -Z is the outside back.
    const fixedBackBody = createBox(
        "fixed-back-body",
        { width: WIDTH, height: HEIGHT, depth: BODY_DEPTH },
        ["insideRight", "back", null, null, null, null],
        fixedAssembly
    );

    // Fixed spine: +Z is the opened interior spine; -Z is the outer right.
    // Its right edge is x = 0 in the fully open reference pose.
    const fixedSpine = createBox(
        "fixed-spine",
        { width: SPINE_WIDTH, height: HEIGHT, depth: BODY_DEPTH },
        ["insideSpin", "right", null, null, null, null],
        fixedAssembly
    );
    fixedSpine.position.x = -HALF_WIDTH - SPINE_WIDTH / 2;

    // Closed-only casing edges. They are real small boxes, but are disabled
    // in both open poses and never participate in the unfolding geometry.
    const topShell = createBox(
        "closed-top",
        { width: WIDTH + SPINE_WIDTH, height: EDGE_THICKNESS, depth: DEPTH },
        ["top", "top", "top", "top", "top", "top"],
        fixedAssembly
    );
    topShell.position.set(-SPINE_WIDTH / 2, HEIGHT / 2, 0);
    const bottomShell = createBox(
        "closed-bottom",
        { width: WIDTH + SPINE_WIDTH, height: EDGE_THICKNESS, depth: DEPTH },
        ["bottom", "bottom", "bottom", "bottom", "bottom", "bottom"],
        fixedAssembly
    );
    bottomShell.position.set(-SPINE_WIDTH / 2, -HEIGHT / 2, 0);
    const leftShell = createBox(
        "closed-left",
        { width: EDGE_THICKNESS, height: HEIGHT, depth: DEPTH },
        ["left", "left", "left", "left", "left", "left"],
        fixedAssembly
    );
    leftShell.position.set(HALF_WIDTH, 0, 0);
    const closedOnly = [topShell, bottomShell, leftShell];

    // Moving front cover. Its +Z side is front. Its -Z side is inside-left.
    // The hinge remains the sole animated node.
    const frontHinge = new BABYLON.TransformNode("front-hinge", scene);
    frontHinge.parent = root;
    const frontCover = createBox(
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
            label: "Geschlossen: front",
            fixedX: 0, hingeX: -HALF_WIDTH, hingeZ: closedHingeZ, angle: 0,
            alpha: Math.PI / 2, radius: 650, target: BABYLON.Vector3.Zero(), closed: true
        },
        "closed-back": {
            label: "Geschlossen: back",
            fixedX: 0, hingeX: -HALF_WIDTH, hingeZ: closedHingeZ, angle: 0,
            alpha: -Math.PI / 2, radius: 650, target: BABYLON.Vector3.Zero(), closed: true
        },
        "closed-spine": {
            label: "Geschlossen: right (outer spine)",
            fixedX: 0, hingeX: -HALF_WIDTH, hingeZ: closedHingeZ, angle: 0,
            alpha: -Math.PI / 2, radius: 460,
            target: new BABYLON.Vector3(-HALF_WIDTH - SPINE_WIDTH / 2, 0, 0), closed: true
        },
        "half-open": {
            label: "Halb geoeffnet: front cover dreht allein",
            fixedX: HALF_WIDTH / 2, hingeX: -HALF_WIDTH / 2,
            hingeZ: (closedHingeZ + openHingeZ) / 2, angle: OPEN_ANGLE / 2,
            alpha: -Math.PI / 2, radius: 720, target: BABYLON.Vector3.Zero(), closed: false
        },
        "open-inner": {
            label: "Offen innen: inside-left | inside-spin | inside-right",
            fixedX: HALF_WIDTH, hingeX: 0, hingeZ: openHingeZ, angle: OPEN_ANGLE,
            alpha: Math.PI / 2, radius: 840, target: BABYLON.Vector3.Zero(), closed: false
        },
        "open-outer": {
            label: "Offen aussen: back | right | front",
            fixedX: HALF_WIDTH, hingeX: 0, hingeZ: openHingeZ, angle: OPEN_ANGLE,
            alpha: -Math.PI / 2, radius: 840, target: BABYLON.Vector3.Zero(), closed: false
        }
    };

    function setPose(name) {
        const pose = poses[name];
        if (!pose) return;
        fixedAssembly.position.x = pose.fixedX;
        frontHinge.position.x = pose.hingeX;
        frontHinge.position.z = pose.hingeZ;
        frontHinge.rotation.y = pose.angle;
        closedOnly.forEach((edge) => edge.setEnabled(pose.closed));
        camera.alpha = pose.alpha;
        camera.beta = Math.PI / 2.25;
        camera.radius = pose.radius;
        camera.setTarget(pose.target);
        stateLabel.textContent = pose.label;
    }

    document.querySelectorAll("[data-pose]").forEach((button) => {
        button.addEventListener("click", () => setPose(button.dataset.pose));
    });

    setPose("closed-front");
    engine.runRenderLoop(() => scene.render());
    window.addEventListener("resize", () => engine.resize());
})();
