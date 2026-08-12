(() => {
    "use strict";

    const WIDTH = 222;
    const HEIGHT = 222;
    const DEPTH = 7;
    const COVER_DEPTH = 2;
    const BODY_DEPTH = DEPTH - COVER_DEPTH;
    const HALF_WIDTH = WIDTH / 2;
    const HALF_HEIGHT = HEIGHT / 2;
    const HALF_DEPTH = DEPTH / 2;
    // Flatpack acceptance pose: all three opened panels must be coplanar.
    // Wimmer's slightly perspective-open target is intentionally not used
    // for this geometry test.
    const OPEN_ANGLE = Math.PI;
    const GAP = 0.08;
    const FLAT_FACE_OFFSET = 0.1;
    // The supplied inner scans already form one continuous spread. Their
    // widths are kept proportional to the source images, so the pictures are
    // not stretched with UV scaling when they replace the three outer parts.
    const OUTER_SPREAD_WIDTH = WIDTH * 2 + DEPTH;
    const INSIDE_LEFT_PIXELS = 2660;
    const INSIDE_RIGHT_PIXELS = 2661;
    const INSIDE_TOTAL_PIXELS = INSIDE_LEFT_PIXELS + INSIDE_RIGHT_PIXELS;
    const INSIDE_LEFT_WIDTH = OUTER_SPREAD_WIDTH * INSIDE_LEFT_PIXELS / INSIDE_TOTAL_PIXELS;
    const INSIDE_RIGHT_WIDTH = OUTER_SPREAD_WIDTH - INSIDE_LEFT_WIDTH;
    const TEXTURE_BASE = "../../../../assets/textures/7cities_of_gold_c64/";
    const TEXTURES = {
        front: { file: "front.webp", flipU: true },
        back: { file: "back.webp", flipU: true },
        left: { file: "left.webp", flipU: true },
        top: { file: "top.webp", flipU: true, rotation: Math.PI / 2 },
        bottom: { file: "bottom.webp", flipU: true, rotation: -Math.PI / 2 },
        "right / spine outside": { file: "right.webp", flipU: false, flipV: true },
        "inside-left": { file: "inside_left.webp", flipU: true },
        "inside-right": { file: "inside_right.webp", flipU: true }
    };

    const canvas = document.getElementById("viewer");
    const engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true });
    const scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color4(0.025, 0.045, 0.075, 1);
    const camera = new BABYLON.ArcRotateCamera("camera", Math.PI / 2, Math.PI / 2.35, 560, BABYLON.Vector3.Zero(), scene);
    camera.lowerRadiusLimit = 260;
    camera.upperRadiusLimit = 1000;
    camera.wheelDeltaPercentage = 0.012;
    camera.panningSensibility = 0;
    camera.attachControl(canvas, true);
    new BABYLON.HemisphericLight("hemi", new BABYLON.Vector3(0, 1, 0), scene).intensity = 1.25;

    const root = new BABYLON.TransformNode("debugRoot", scene);
    const fixedBody = new BABYLON.TransformNode("fixedBody", scene);
    fixedBody.parent = root;
    fixedBody.position.z = -COVER_DEPTH / 2;
    const spine = new BABYLON.TransformNode("spine", scene);
    spine.parent = fixedBody;
    spine.position.set(HALF_WIDTH, 0, COVER_DEPTH / 2);
    const frontHinge = new BABYLON.TransformNode("frontHinge", scene);
    frontHinge.parent = root;
    frontHinge.position.set(HALF_WIDTH, 0, HALF_DEPTH - COVER_DEPTH / 2);
    const frontCover = new BABYLON.TransformNode("frontCover", scene);
    frontCover.parent = frontHinge;
    frontCover.position.x = -HALF_WIDTH;

    const colors = {
        front: "#d12fcf", back: "#e67e22", right: "#f2cf28", insideLeft: "#27b85c",
        insideRight: "#3270dc", left: "#8657d7", top: "#20b8d5", bottom: "#9a6a31"
    };
    const surfaces = {};

    function material(name, color) {
        const mat = new BABYLON.StandardMaterial(`material-${name}`, scene);
        const config = TEXTURES[name];
        if (config) {
            const texture = new BABYLON.Texture(`${TEXTURE_BASE}${config.file}`, scene);
            texture.uScale = config.flipU ? -1 : 1;
            texture.uOffset = config.flipU ? 1 : 0;
            texture.vScale = config.flipV ? -1 : 1;
            texture.vOffset = config.flipV ? 1 : 0;
            texture.wAng = config.rotation || 0;
            texture.anisotropicFilteringLevel = 16;
            texture.gammaSpace = true;
            texture.updateSamplingMode(BABYLON.Texture.TRILINEAR_SAMPLINGMODE);
            mat.diffuseTexture = texture;
            mat.ambientColor = new BABYLON.Color3(0.42, 0.42, 0.42);
            mat.specularColor = new BABYLON.Color3(0.22, 0.22, 0.22);
            mat.specularPower = 140;
            mat.emissiveColor = new BABYLON.Color3(0.12, 0.12, 0.12);
        } else {
            mat.diffuseColor = BABYLON.Color3.FromHexString(color);
            mat.emissiveColor = BABYLON.Color3.FromHexString(color).scale(0.18);
            mat.specularColor = BABYLON.Color3.Black();
        }
        mat.backFaceCulling = false;
        return mat;
    }

    function label(name, color, parent, position) {
        const plane = BABYLON.MeshBuilder.CreatePlane(`label-${name}`, { width: 56, height: 20 }, scene);
        const texture = new BABYLON.DynamicTexture(`label-texture-${name}`, { width: 1024, height: 256 }, scene, true);
        texture.hasAlpha = true;
        // Labels identify a surface but must never become a second, oversized
        // coloured plane that hides the narrow spine beneath it.
        texture.drawText(name, null, 154, "bold 104px Arial", "#111111", null, true, true);
        const mat = new BABYLON.StandardMaterial(`label-material-${name}`, scene);
        mat.diffuseTexture = texture;
        mat.emissiveTexture = texture;
        mat.opacityTexture = texture;
        mat.backFaceCulling = false;
        plane.material = mat;
        plane.parent = parent;
        plane.position.copyFrom(position);
        plane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
        return plane;
    }

    function surface(name, color, parent, dimensions, position, rotation, labelOffset) {
        const mesh = BABYLON.MeshBuilder.CreatePlane(`surface-${name}`, dimensions, scene);
        mesh.parent = parent;
        mesh.position.copyFrom(position);
        mesh.rotation.copyFrom(rotation);
        mesh.material = material(name, color);
        const text = label(name, color, parent, position.add(labelOffset));
        surfaces[name] = { mesh, label: text, color, labelOffset: labelOffset.clone() };
    }

    // Fixed body: exterior back, inner right, and closed-only package edges.
    surface("back", colors.back, fixedBody, { width: WIDTH, height: HEIGHT }, new BABYLON.Vector3(0, 0, -BODY_DEPTH / 2 - GAP), new BABYLON.Vector3(0, Math.PI, 0), new BABYLON.Vector3(0, 0, -3));
    surface("inside-right", colors.insideRight, fixedBody, { width: INSIDE_RIGHT_WIDTH, height: HEIGHT }, new BABYLON.Vector3(0, 0, BODY_DEPTH / 2 + GAP), BABYLON.Vector3.Zero(), new BABYLON.Vector3(0, 0, 3));
    surface("left", colors.left, fixedBody, { width: DEPTH, height: HEIGHT }, new BABYLON.Vector3(-HALF_WIDTH, 0, COVER_DEPTH / 2), new BABYLON.Vector3(0, -Math.PI / 2, 0), new BABYLON.Vector3(-3, 0, 0));
    surface("top", colors.top, fixedBody, { width: WIDTH, height: DEPTH }, new BABYLON.Vector3(0, HALF_HEIGHT, COVER_DEPTH / 2), new BABYLON.Vector3(Math.PI / 2, 0, 0), new BABYLON.Vector3(0, 3, 0));
    surface("bottom", colors.bottom, fixedBody, { width: WIDTH, height: DEPTH }, new BABYLON.Vector3(0, -HALF_HEIGHT, COVER_DEPTH / 2), new BABYLON.Vector3(Math.PI / 2, 0, 0), new BABYLON.Vector3(0, -3, 0));

    // right.webp is not an independently rotating door. It is a flexible
    // exterior ribbon whose two long edges are permanently attached to back
    // and front. Its dynamic geometry is created below.
    // The two physical sides of the rotating front board.
    surface("front", colors.front, frontCover, { width: WIDTH, height: HEIGHT }, new BABYLON.Vector3(0, 0, COVER_DEPTH / 2 + GAP), BABYLON.Vector3.Zero(), new BABYLON.Vector3(0, 0, 3));
    surface("inside-left", colors.insideLeft, frontCover, { width: INSIDE_LEFT_WIDTH, height: HEIGHT }, new BABYLON.Vector3(0, 0, -COVER_DEPTH / 2 - GAP), new BABYLON.Vector3(0, Math.PI, 0), new BABYLON.Vector3(0, 0, -3));

    const RIBBON_SEGMENTS = 10;
    const spineRibbon = new BABYLON.Mesh("surface-right-spine-outside", scene);
    spineRibbon.material = material("right / spine outside", colors.right);
    spineRibbon.material.backFaceCulling = false;
    const ribbonPositions = new Array((RIBBON_SEGMENTS + 1) * 2 * 3).fill(0);
    const ribbonNormals = new Array((RIBBON_SEGMENTS + 1) * 2 * 3).fill(0);
    const ribbonUVs = [];
    const ribbonIndices = [];
    for (let index = 0; index <= RIBBON_SEGMENTS; index += 1) {
        const t = index / RIBBON_SEGMENTS;
        ribbonUVs.push(t, 0, t, 1);
        if (index < RIBBON_SEGMENTS) {
            const top = index * 2;
            const nextTop = top + 2;
            ribbonIndices.push(top, nextTop, top + 1, nextTop, nextTop + 1, top + 1);
        }
    }
    const ribbonData = new BABYLON.VertexData();
    ribbonData.positions = ribbonPositions;
    ribbonData.normals = ribbonNormals;
    ribbonData.uvs = ribbonUVs;
    ribbonData.indices = ribbonIndices;
    ribbonData.applyToMesh(spineRibbon, true);
    const spineLabel = label("right / spine outside", colors.right, root, BABYLON.Vector3.Zero());
    surfaces["right / spine outside"] = {
        mesh: spineRibbon,
        label: spineLabel,
        color: colors.right,
        labelOffset: BABYLON.Vector3.Zero()
    };

    function axes(parent, name) {
        const x = BABYLON.MeshBuilder.CreateLines(`${name}-x`, { points: [BABYLON.Vector3.Zero(), new BABYLON.Vector3(24, 0, 0)], colors: [new BABYLON.Color4(1, 0.1, 0.1, 1), new BABYLON.Color4(1, 0.1, 0.1, 1)] }, scene);
        const y = BABYLON.MeshBuilder.CreateLines(`${name}-y`, { points: [BABYLON.Vector3.Zero(), new BABYLON.Vector3(0, 24, 0)], colors: [new BABYLON.Color4(0.1, 1, 0.2, 1), new BABYLON.Color4(0.1, 1, 0.2, 1)] }, scene);
        const z = BABYLON.MeshBuilder.CreateLines(`${name}-z`, { points: [BABYLON.Vector3.Zero(), new BABYLON.Vector3(0, 0, 24)], colors: [new BABYLON.Color4(0.15, 0.45, 1, 1), new BABYLON.Color4(0.15, 0.45, 1, 1)] }, scene);
        x.parent = parent; y.parent = parent; z.parent = parent;
    }
    axes(frontHinge, "hinge-axis");
    axes(spine, "spine-axis");

    const range = document.getElementById("open-range");
    const angle = document.getElementById("angle");
    const output = document.getElementById("coordinates-output");
    let progress = 0;

    function fmt(vector) { return `(${vector.x.toFixed(2)}, ${vector.y.toFixed(2)}, ${vector.z.toFixed(2)})`; }
    function setSurfaceDepth(name, z) {
        const item = surfaces[name];
        item.mesh.position.z = z;
        item.label.position.z = z + item.labelOffset.z;
    }
    function setSurfaceX(name, x) {
        const item = surfaces[name];
        item.mesh.position.x = x;
        item.label.position.x = x + item.labelOffset.x;
    }
    function updateSpineRibbon() {
        // The joining edges are taken from the actual transformed board
        // meshes, not from separately interpolated coordinates.
        surfaces.back.mesh.computeWorldMatrix(true);
        surfaces.front.mesh.computeWorldMatrix(true);
        const backEdge = BABYLON.Vector3.TransformCoordinates(
            new BABYLON.Vector3(-HALF_WIDTH, 0, 0),
            surfaces.back.mesh.getWorldMatrix()
        );
        const frontEdge = BABYLON.Vector3.TransformCoordinates(
            new BABYLON.Vector3(HALF_WIDTH, 0, 0),
            surfaces.front.mesh.getWorldMatrix()
        );
        const path = frontEdge.subtract(backEdge);
        const outward = new BABYLON.Vector3(path.z, 0, -path.x);
        if (outward.lengthSquared() > 0.0001) {
            outward.normalize();
        }
        const bend = DEPTH * 0.38 * (4 * progress * (1 - progress));
        const positions = [];
        for (let index = 0; index <= RIBBON_SEGMENTS; index += 1) {
            const t = index / RIBBON_SEGMENTS;
            const point = BABYLON.Vector3.Lerp(backEdge, frontEdge, t)
                .add(outward.scale(Math.sin(Math.PI * t) * bend));
            positions.push(point.x, HALF_HEIGHT, point.z);
            positions.push(point.x, -HALF_HEIGHT, point.z);
        }
        const normals = [];
        BABYLON.VertexData.ComputeNormals(positions, ribbonIndices, normals);
        spineRibbon.updateVerticesData(BABYLON.VertexBuffer.PositionKind, positions);
        spineRibbon.updateVerticesData(BABYLON.VertexBuffer.NormalKind, normals);
        spineLabel.position.copyFrom(BABYLON.Vector3.Lerp(backEdge, frontEdge, 0.5).add(outward.scale(bend + 4)));
    }
    function applyVisibility(item) {
        const isOpenFlatpack = progress >= 0.99;
        const isClosedOnlyEdge = item.name === "left" || item.name === "top" || item.name === "bottom";
        const visible = item.requestedVisible
            && !(isOpenFlatpack && isClosedOnlyEdge);
        item.mesh.setEnabled(visible);
        item.label.setEnabled(visible);
    }

    function setProgress(value) {
        progress = Number(value) / 100;
        // At 100 % reserve the physical spine width between the two outer
        // boards: back | right | front.  Without this offset, the narrow
        // right surface is exactly underneath both board edges and vanishes.
        fixedBody.position.x = -(HALF_WIDTH + DEPTH / 2) * progress;
        frontHinge.position.x = HALF_WIDTH * (1 - progress) + DEPTH / 2 * progress;
        frontHinge.rotation.y = OPEN_ANGLE * progress;

        // Collapse the old closed-box depth into two very close, parallel
        // layers. At 100 % the exterior is one flat spread and the interior
        // is the opposite, equally flat spread.
        fixedBody.position.z = -COVER_DEPTH / 2;
        frontHinge.position.z = BABYLON.Scalar.Lerp(HALF_DEPTH - COVER_DEPTH / 2, 0, progress);
        setSurfaceDepth("back", BABYLON.Scalar.Lerp(-BODY_DEPTH / 2 - GAP, COVER_DEPTH / 2 - FLAT_FACE_OFFSET, progress));
        setSurfaceDepth("inside-right", BABYLON.Scalar.Lerp(BODY_DEPTH / 2 + GAP, COVER_DEPTH / 2 + FLAT_FACE_OFFSET, progress));
        setSurfaceDepth("front", BABYLON.Scalar.Lerp(COVER_DEPTH / 2 + GAP, FLAT_FACE_OFFSET, progress));
        setSurfaceDepth("inside-left", BABYLON.Scalar.Lerp(-COVER_DEPTH / 2 - GAP, -FLAT_FACE_OFFSET, progress));

        // At the open pose the two scans meet exactly at one seam and span
        // the same total width as front + right + back. Only geometry widths
        // change; each texture keeps its native, undistorted UV mapping.
        const openInsideOffset = INSIDE_RIGHT_WIDTH / 2 - HALF_WIDTH;
        setSurfaceX("inside-right", BABYLON.Scalar.Lerp(0, openInsideOffset, progress));
        setSurfaceX("inside-left", BABYLON.Scalar.Lerp(0, openInsideOffset, progress));

        updateSpineRibbon();
        Object.values(surfaces).forEach(applyVisibility);
        angle.textContent = `${Math.round(OPEN_ANGLE * progress * 180 / Math.PI)}° / ${Math.round(progress * 100)} %`;
    }
    function pose(position, target) {
        camera.setPosition(position);
        camera.setTarget(target);
    }

    range.addEventListener("input", () => setProgress(range.value));
    document.querySelectorAll("[data-pose]").forEach((button) => button.addEventListener("click", () => {
        const poseName = button.dataset.pose;
        if (poseName === "closed-front") { setProgress(0); range.value = 0; pose(new BABYLON.Vector3(0, 30, 520), BABYLON.Vector3.Zero()); }
        if (poseName === "open-outside") { setProgress(100); range.value = 100; pose(new BABYLON.Vector3(0, 45, -650), new BABYLON.Vector3(0, 0, 0)); }
        if (poseName === "open-inside") { setProgress(100); range.value = 100; pose(new BABYLON.Vector3(0, 45, 650), new BABYLON.Vector3(0, 0, 0)); }
    }));

    const surfaceList = document.getElementById("surfaces");
    Object.entries(surfaces).forEach(([name, item]) => {
        item.name = name;
        item.requestedVisible = true;
        const label = document.createElement("label");
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = true;
        checkbox.addEventListener("change", () => {
            item.requestedVisible = checkbox.checked;
            applyVisibility(item);
        });
        const swatch = document.createElement("span");
        swatch.className = "swatch";
        swatch.style.background = item.color;
        label.append(checkbox, swatch, document.createTextNode(name));
        surfaceList.append(label);
    });

    scene.onBeforeRenderObservable.add(() => {
        const nodes = { fixedBody, spine, frontHinge, frontCover };
        output.textContent = Object.entries(nodes).map(([name, node]) => {
            const position = node.getAbsolutePosition();
            return `${name}\npos ${fmt(position)}\nrot ${fmt(node.rotation)}`;
        }).join("\n\n");
    });

    setProgress(0);
    engine.runRenderLoop(() => scene.render());
    window.addEventListener("resize", () => engine.resize());
})();
