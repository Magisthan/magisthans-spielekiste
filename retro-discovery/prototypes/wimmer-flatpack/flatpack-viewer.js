/*
 * Wimmer-style isolated gatefold prototype.
 * One fixed reduced-depth body plus one real, permanently present front-cover box.
 */
(() => {
    "use strict";

    const PROTOTYPE_BUILD = "2026-08-10.2030";
    const TEXTURE_ROOT = "../../../assets/textures/7cities_of_gold_c64";
    const GAME = { width: 222, height: 222, depth: 7 };
    const COVER_DEPTH = 1;
    const BODY_DEPTH = GAME.depth - COVER_DEPTH;
    const SPINE_WIDTH = GAME.depth;
    const OPEN_ANGLE = Math.PI - 0.5;
    const HALF_WIDTH = GAME.width / 2;
    const HALF_HEIGHT = GAME.height / 2;
    const SURFACE_GAP = 0.01;

    const textureNames = {
        front: "front.webp", back: "back.webp", right: "right.webp", left: "left.webp",
        top: "top.webp", bottom: "bottom.webp", insideLeft: "inside_left.webp",
        insideSpine: "inside_spin.webp", insideRight: "inside_right.webp"
    };
    const uv = {
        // Box UVs are not the same as the former plane UVs. Front and back
        // require a complete 180° texture turn (U and V) on the Babylon box.
        front: { flipU: false, flipV: false }, back: { flipU: false, flipV: false },
        left: { flipU: false, flipV: false }, right: { flipU: false, flipV: false },
        top: { flipU: false, flipV: false, rotation: 0 }, bottom: { flipU: false, flipV: false, rotation: 0 },
        insideLeft: { flipU: false, flipV: false },
        insideSpine: { flipU: false, flipV: false },
        insideRight: { flipU: false, flipV: false }
    };

    const canvas = document.getElementById("viewer");
    const status = document.getElementById("state");
    const engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true });
    const scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color4(0.035, 0.075, 0.13, 1);

    // Canonical orientation: camera on +Z, therefore the visible closed side is front.webp.
    const camera = new BABYLON.ArcRotateCamera(
        "camera", Math.PI / 2, Math.PI / 2.35, 560, BABYLON.Vector3.Zero(), scene
    );
    camera.lowerRadiusLimit = 330;
    camera.upperRadiusLimit = 820;
    camera.wheelDeltaPercentage = 0.015;
    camera.panningSensibility = 0;
    camera.attachControl(canvas, true);
    const hemi = new BABYLON.HemisphericLight("hemi", new BABYLON.Vector3(0, 1, 0), scene);
    hemi.intensity = 1.15;
    hemi.groundColor = new BABYLON.Color3(0.08, 0.1, 0.13);
    const key = new BABYLON.DirectionalLight("key", new BABYLON.Vector3(-0.35, -0.8, -0.4), scene);
    key.position = new BABYLON.Vector3(180, 280, 240);
    key.intensity = 1.3;

    const materials = {};
    function makeMaterial(name) {
        const material = new BABYLON.StandardMaterial(`material-${name}`, scene);
        const texture = new BABYLON.Texture(`${TEXTURE_ROOT}/${textureNames[name]}`, scene);
        texture.uScale = uv[name].flipU ? -1 : 1;
        texture.uOffset = uv[name].flipU ? 1 : 0;
        texture.vScale = uv[name].flipV ? -1 : 1;
        texture.vOffset = uv[name].flipV ? 1 : 0;
        texture.wAng = uv[name].rotation || 0;
        texture.anisotropicFilteringLevel = 16;
        texture.updateSamplingMode(BABYLON.Texture.TRILINEAR_SAMPLINGMODE);
        material.diffuseTexture = texture;
        material.ambientColor = new BABYLON.Color3(0.48, 0.48, 0.48);
        material.specularColor = new BABYLON.Color3(0.14, 0.14, 0.14);
        material.specularPower = 96;
        material.backFaceCulling = true;
        materials[name] = material;
    }
    Object.keys(textureNames).forEach(makeMaterial);

    function makeNeutralMaterial(name) {
        const material = new BABYLON.StandardMaterial(name, scene);
        material.diffuseColor = new BABYLON.Color3(0.12, 0.12, 0.11);
        material.specularColor = new BABYLON.Color3(0.08, 0.08, 0.08);
        return material;
    }
    const neutral = makeNeutralMaterial("material-neutral-edge");

    // Babylon boxes use six submeshes. A MultiMaterial gives every physical side
    // one definitive material; no duplicate planes are created or toggled.
    function makeBox(name, parent, width, height, depth, faceMaterials) {
        const box = BABYLON.MeshBuilder.CreateBox(name, { width, height, depth }, scene);
        box.parent = parent;
        const multi = new BABYLON.MultiMaterial(`${name}-multi`, scene);
        multi.subMaterials.push(...faceMaterials);
        box.material = multi;
        box.subMeshes = [];
        const vertices = box.getTotalVertices();
        for (let face = 0; face < 6; face += 1) {
            new BABYLON.SubMesh(face, 0, vertices, face * 6, 6, box);
        }
        return box;
    }

    const presentationRoot = new BABYLON.TransformNode("presentationRoot", scene);
    const fixedBody = new BABYLON.TransformNode("fixedBody", scene);
    fixedBody.parent = presentationRoot;
    // The body is reduced by the cover depth exactly as in Wimmer's bigbox.js.
    const fixedBox = makeBox(
        "fixed-body-box", fixedBody, GAME.width, GAME.height, BODY_DEPTH,
        // Babylon order: front, back, right, left, top, bottom.
        [materials.insideRight, materials.back, neutral, materials.left, materials.top, materials.bottom]
    );
    // Wimmer's permanent mesh stays at the origin; X is centred during opening.
    fixedBox.position.z = 0;

    // The interior spine is a narrow print panel on the actual hinge axis.
    // right.webp is not a broad parallel panel: it is the -X edge of the real
    // cover box, so it follows the cover during the animation.
    const spineHinge = new BABYLON.TransformNode("spineHinge", scene);
    spineHinge.parent = presentationRoot;
    spineHinge.position.set(-HALF_WIDTH, 0, 0);
    const innerSpine = makeBox(
        "inner-spine-box", spineHinge, SPINE_WIDTH, GAME.height, SURFACE_GAP * 2,
        [materials.insideSpine, neutral, neutral, neutral, neutral, neutral]
    );
    innerSpine.position.z = BODY_DEPTH / 2 + SURFACE_GAP * 2;

    // The hinge is directly on the real left cover edge. The child is half a cover
    // width to the right, so only the parent rotation controls the opening path.
    const frontCoverHinge = new BABYLON.TransformNode("frontCoverHinge", scene);
    frontCoverHinge.parent = presentationRoot;
    frontCoverHinge.position.set(-HALF_WIDTH, 0, BODY_DEPTH / 2 + COVER_DEPTH / 2);
    const frontCover = makeBox(
        "front-cover-box", frontCoverHinge, GAME.width - 0.02, GAME.height - 0.02, COVER_DEPTH,
        // Slot 3 is Babylon's -X face: the physical hinge-side cover edge.
        [materials.front, materials.insideLeft, neutral, materials.right, neutral, neutral]
    );
    frontCover.position.x = HALF_WIDTH;

    let openTarget = 0;
    let openProgress = 0;
    const closedCoverZ = BODY_DEPTH / 2 + COVER_DEPTH / 2;
    const openCoverZ = BODY_DEPTH / 2;

    function approach(current, target, factor = 0.1) {
        return current + (target - current) * factor;
    }

    function applyPresentation(progress) {
        status.textContent = progress < 0.001
            ? `Geschlossen – fester Korpus + Frontdeckel (${PROTOTYPE_BUILD})`
            : progress > 0.999
                ? "Offen – Gatefold-Deckel am echten Scharnier"
                : `Öffnung: ${Math.round(progress * 100)} %`;
    }
    function setTarget(target) {
        openTarget = target === 0.5 ? 0.5 : target > 0.5 ? 1 : 0;
    }

    // Direct Babylon equivalent of Wimmer's coupled render-loop transforms.
    scene.onBeforeRenderObservable.add(() => {
        const targetAngle = -OPEN_ANGLE * openTarget;
        const groupPosX = -HALF_WIDTH * openTarget;
        const fixedTargetX = -groupPosX;
        const hingeTargetX = -groupPosX - HALF_WIDTH;
        const hingeTargetZ = openTarget > 0.5 ? openCoverZ : closedCoverZ;

        frontCoverHinge.rotation.y = approach(frontCoverHinge.rotation.y, targetAngle);
        fixedBody.position.x = approach(fixedBody.position.x, fixedTargetX);
        frontCoverHinge.position.x = approach(frontCoverHinge.position.x, hingeTargetX);
        frontCoverHinge.position.z = approach(frontCoverHinge.position.z, hingeTargetZ);
        spineHinge.position.x = approach(spineHinge.position.x, hingeTargetX);
        openProgress = approach(openProgress, openTarget);
        if (Math.abs(targetAngle - frontCoverHinge.rotation.y) < 0.0002) {
            frontCoverHinge.rotation.y = targetAngle;
        }
        if (Math.abs(fixedTargetX - fixedBody.position.x) < 0.0002) fixedBody.position.x = fixedTargetX;
        if (Math.abs(hingeTargetX - frontCoverHinge.position.x) < 0.0002) frontCoverHinge.position.x = hingeTargetX;
        if (Math.abs(hingeTargetZ - frontCoverHinge.position.z) < 0.0002) frontCoverHinge.position.z = hingeTargetZ;
        if (Math.abs(hingeTargetX - spineHinge.position.x) < 0.0002) spineHinge.position.x = hingeTargetX;
        if (Math.abs(openTarget - openProgress) < 0.0002) openProgress = openTarget;
        applyPresentation(openProgress);
    });

    document.querySelectorAll("[data-state]").forEach((button) => {
        button.addEventListener("click", () => setTarget(Number(button.dataset.state)));
    });
    document.getElementById("toggle").addEventListener("click", () => setTarget(openTarget > 0.5 ? 0 : 1));
    window.addEventListener("keydown", (event) => {
        if (event.code === "Space") {
            event.preventDefault();
            setTarget(openTarget > 0.5 ? 0 : 1);
        }
    });

    applyPresentation(0);
    engine.runRenderLoop(() => scene.render());
    window.addEventListener("resize", () => engine.resize());
})();
