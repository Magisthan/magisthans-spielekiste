(() => {
    "use strict";

    const requestedGame = new URLSearchParams(window.location.search).get("game");
    const PROTOTYPE_GAME = requestedGame === "hard_hat_mack"
        ? { folder: "hard_hat_mack", title: "Hard Hat Mack", crop: 0.029 }
        : {
            folder: "one_on_one_erving_vs_bird",
            title: "One on One: Erving vs. Bird",
            crop: 0.029
        };
    const TEXTURE_ROOT = `../../../assets/textures/${PROTOTYPE_GAME.folder}`;
    const GAME_DATA = {
        folder: PROTOTYPE_GAME.folder,
        hasInside: true,
        dimensions: { width: 222, height: 222, depth: 7 },
        package: {
            type: "flatpack",
            spineTexture: "right"
        }
    };

    // Retro Discovery converts the scan dimensions to Babylon world units
    // before passing them to Package.create(). Keeping this scale is crucial:
    // FlatpackBuilder's 0.001/0.0014 surface offsets are calibrated for it.
    const SCALE = 0.014;

    // Same presentation directions used by retro-discovery/js/viewer.js.
    // These values match retro-discovery/js/viewer.js.
    const HERO_ROTATION_X = BABYLON.Tools.ToRadians(-2);
    const HERO_ROTATION_Y = Math.PI - BABYLON.Tools.ToRadians(28);
    const HERO_ROTATION_Z = 0;
    const CAMERA_ALPHA = -Math.PI / 2;
    const CAMERA_BETA = Math.PI / 2.5;
    const CAMERA_RADIUS = 7.5;

    const canvas = document.getElementById("viewer");
    const status = document.getElementById("state");
    const toggleButton = document.getElementById("primary-toggle");
    const extensionButton = document.getElementById("extension-toggle");
    const extensionHotspot = document.getElementById("extension-hotspot");
    const hotspotLabel = document.getElementById("hotspot-label");
    const diagnosticButton = document.getElementById("diagnostic-toggle");
    const resetButton = document.getElementById("reset-view");
    const progressRange = document.getElementById("primary-progress");
    const progressOutput = document.getElementById("primary-output");
    const extensionRange = document.getElementById("extension-progress");
    const extensionOutput = document.getElementById("extension-output");
    const cropRange = document.getElementById("crop-progress");
    const cropOutput = document.getElementById("crop-output");

    const engine = new BABYLON.Engine(canvas, true, {
        preserveDrawingBuffer: true,
        stencil: true
    });
    const scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color4(0.027, 0.055, 0.09, 1);

    const camera = new BABYLON.ArcRotateCamera(
        "camera",
        CAMERA_ALPHA,
        CAMERA_BETA,
        CAMERA_RADIUS,
        BABYLON.Vector3.Zero(),
        scene
    );
    camera.lowerRadiusLimit = 3.8;
    camera.upperRadiusLimit = 12;
    camera.wheelDeltaPercentage = 0.012;
    camera.panningSensibility = 0;
    camera.attachControl(canvas, true);

    const hemi = new BABYLON.HemisphericLight("hemi", new BABYLON.Vector3(0.1, 1, 0.2), scene);
    hemi.intensity = 1.1;
    hemi.groundColor = new BABYLON.Color3(0.08, 0.1, 0.14);
    const key = new BABYLON.DirectionalLight("key", new BABYLON.Vector3(-0.35, -0.55, -0.7), scene);
    key.position = new BABYLON.Vector3(3.2, 4.2, 5.3);
    key.intensity = 1.2;

    const pivot = new BABYLON.TransformNode("pivot", scene);
    pivot.rotation.set(HERO_ROTATION_X, HERO_ROTATION_Y, HERO_ROTATION_Z);
    pivot.scaling.set(0.85, 0.85, 0.85);

    function loadImage(name) {
        return new Promise((resolve, reject) => {
            const image = new Image();
            image.onload = () => resolve(image);
            image.onerror = () => reject(new Error(`Textur konnte nicht geladen werden: ${name}.webp`));
            image.src = `${TEXTURE_ROOT}/${name}.webp`;
        });
    }

    async function loadPrototypeGame() {
        const [front, back, left, right, top, bottom, insideLeft, insideRight, insideMiddle, insideRightRight, extendedTop, extendedBottom, foldSpine] = await Promise.all([
            loadImage("front"),
            loadImage("back"),
            loadImage("left"),
            loadImage("right"),
            loadImage("top"),
            loadImage("bottom"),
            loadImage("inside_left"),
            loadImage("inside_right"),
            loadImage("inside_middle"),
            loadImage("inside_right_right"),
            loadImage("extended-top"),
            loadImage("extended-bottom"),
            loadImage("extended-fold-spine")
        ]);

        return {
            game: {
                images: { front, back, left, right, top, bottom, insideLeft, insideRight },
                width: GAME_DATA.dimensions.width * SCALE,
                height: GAME_DATA.dimensions.height * SCALE,
                depth: GAME_DATA.dimensions.depth * SCALE,
                hasInside: true
            },
            extensionImages: {
                insideMiddle,
                insideRight,
                insideRightRight,
                extendedTop,
                extendedBottom,
                foldSpine
            }
        };
    }

    let pkg = null;
    let extension = null;
    let diagnosticsVisible = false;

    function configureOutsideOnlySpine(flatpack) {
        const ribbon = flatpack?.spineRibbon;
        if (!ribbon?.material) return false;

        // PackageMaterials.right is also used by the closed box. Clone it so
        // this prototype changes only the animated flatpack ribbon.
        const outsideMaterial = ribbon.material.clone(
            "prototype-flatpack-spine-outside-material"
        );
        outsideMaterial.backFaceCulling = true;
        outsideMaterial.twoSidedLighting = false;
        ribbon.material = outsideMaterial;

        // The bend helper in FlatpackBuilder uses (path.z, 0, -path.x), but
        // that side is the inside of the fully opened presentation. The
        // visible exterior is the opposite normal.
        const positions = ribbon.getVerticesData(BABYLON.VertexBuffer.PositionKind);
        const indices = ribbon.getIndices();
        if (!positions?.length || !indices?.length) return true;

        const firstTop = BABYLON.Vector3.FromArray(positions, 0);
        const nextTop = BABYLON.Vector3.FromArray(positions, 6);
        const path = nextTop.subtract(firstTop);
        const expectedOutside = new BABYLON.Vector3(-path.z, 0, path.x);
        if (expectedOutside.lengthSquared() <= 0.000001) return true;
        expectedOutside.normalize();

        const a = BABYLON.Vector3.FromArray(positions, indices[0] * 3);
        const b = BABYLON.Vector3.FromArray(positions, indices[1] * 3);
        const c = BABYLON.Vector3.FromArray(positions, indices[2] * 3);
        const currentNormal = BABYLON.Vector3.Cross(
            b.subtract(a),
            c.subtract(a)
        ).normalize();

        if (BABYLON.Vector3.Dot(currentNormal, expectedOutside) < 0) {
            const outwardIndices = indices.slice();
            for (let index = 0; index < outwardIndices.length; index += 3) {
                const second = outwardIndices[index + 1];
                outwardIndices[index + 1] = outwardIndices[index + 2];
                outwardIndices[index + 2] = second;
            }
            ribbon.setIndices(outwardIndices);
            const outwardNormals = [];
            BABYLON.VertexData.ComputeNormals(positions, outwardIndices, outwardNormals);
            ribbon.updateVerticesData(
                BABYLON.VertexBuffer.NormalKind,
                outwardNormals
            );
        }
        return true;
    }

    function updateControls() {
        const amount = pkg?.openAmount || 0;
        progressRange.value = String(amount);
        progressOutput.value = `${Math.round(amount * 100)} %`;
        toggleButton.textContent = amount > 0.5 ? "Box schließen" : "Box öffnen";
        const primaryOpen = amount > 0.999;
        const extensionAmount = extension?.openAmount || 0;
        extensionRange.value = String(extensionAmount);
        extensionOutput.value = `${Math.round(extensionAmount * 100)} %`;
        const cropPercent = (extension?.cropLeft || 0) * 100;
        cropRange.value = String(extension?.cropLeft || 0);
        cropOutput.value = `${cropPercent.toFixed(1)} %`;
        extensionButton.textContent = extensionAmount > 0.5 ? "Zusatzflügel schließen" : "Zusatzflügel öffnen";
        hotspotLabel.textContent = extensionAmount > 0.5 ? "Zusatzflügel schließen" : "Weiter aufklappen";
        extensionHotspot.setAttribute("aria-label", hotspotLabel.textContent);
        const extensionAvailable = primaryOpen && !pkg?.isAnimating && !extension?.isAnimating;
        extensionButton.disabled = !extensionAvailable;
        extensionRange.disabled = !extensionAvailable;
        extensionHotspot.hidden = !extensionAvailable;
        diagnosticButton.disabled = !primaryOpen;
        ExtendedFlatpackAddon.setDiagnostics(extension, diagnosticsVisible && primaryOpen);

        status.textContent = amount < 0.001
            ? "Geschlossen – PackageBuilder.buildClosed()"
            : primaryOpen && extensionAmount > 0.999
                ? "Voll geöffnet – inside_left | inside_middle | inside_right_right"
                : primaryOpen && extensionAmount > 0.001
                    ? `Zusatzflügel: ${Math.round(extensionAmount * 100)} %`
                    : primaryOpen
                        ? "Primär geöffnet – inside_left | inside_right"
                : `Öffnung: ${Math.round(amount * 100)} %`;
    }

    function setManualProgress(amount) {
        if (!pkg || pkg.isAnimating) return;
        const progress = BABYLON.Scalar.Clamp(amount, 0, 1);
        if (progress <= 0.0001) {
            ExtendedFlatpackAddon.setPrimaryOpen(extension, false);
            FlatpackBuilder.setOpenProgress(pkg, 0);
            pkg.root.setEnabled(false);
            pkg.closed.root.setEnabled(true);
        } else {
            pkg.closed.root.setEnabled(false);
            pkg.root.setEnabled(true);
            FlatpackBuilder.setOpenProgress(pkg, progress);
            ExtendedFlatpackAddon.setPrimaryOpen(extension, progress > 0.999);
        }
        updateControls();
    }

    function runPrimaryToggle() {
        if (!pkg || pkg.isAnimating) return;
        const closing = pkg.openAmount > 0.5;
        if (closing) ExtendedFlatpackAddon.setPrimaryOpen(extension, false);
        toggleButton.disabled = true;
        progressRange.disabled = true;
        Package.toggle(scene, pkg, () => {
            ExtendedFlatpackAddon.setPrimaryOpen(extension, pkg.openAmount > 0.999);
            toggleButton.disabled = false;
            progressRange.disabled = false;
            updateControls();
        });
    }

    function togglePackage() {
        if (!pkg || pkg.isAnimating || extension?.isAnimating) return;
        if (pkg.openAmount > 0.5 && extension.openAmount > 0.001) {
            ExtendedFlatpackAddon.animateTo(extension, 0, runPrimaryToggle);
            return;
        }
        runPrimaryToggle();
    }

    function toggleExtension() {
        if (!extension || pkg.openAmount < 0.999 || pkg.isAnimating || extension.isAnimating) return;
        ExtendedFlatpackAddon.toggle(extension, updateControls);
        updateControls();
    }

    function toggleDiagnostics() {
        if (!extension || pkg.openAmount < 0.999) return;
        diagnosticsVisible = !diagnosticsVisible;
        diagnosticButton.setAttribute("aria-pressed", String(diagnosticsVisible));
        diagnosticButton.textContent = diagnosticsVisible ? "Scharnier ausblenden" : "Scharnier zeigen";
        ExtendedFlatpackAddon.setDiagnostics(extension, diagnosticsVisible);
    }

    function resetView() {
        camera.alpha = CAMERA_ALPHA;
        camera.beta = CAMERA_BETA;
        camera.radius = CAMERA_RADIUS;
        camera.target.set(0, 0, 0);
        pivot.rotation.set(HERO_ROTATION_X, HERO_ROTATION_Y, HERO_ROTATION_Z);
    }

    async function initialise() {
        try {
            document.title = `${PROTOTYPE_GAME.title} – Extended Flatpack Test`;
            document.getElementById("test-title").textContent =
                `${PROTOTYPE_GAME.title} – Extended Flatpack mit 7-mm-Falz`;
            cropRange.value = String(PROTOTYPE_GAME.crop);
            status.textContent = `Lade ${PROTOTYPE_GAME.title}-Texturen …`;
            const loaded = await loadPrototypeGame();
            const game = loaded.game;
            const current = { gameData: GAME_DATA, game };

            // This is the exact production entry point also used by Seven Cities.
            pkg = Package.create(scene, pivot, current);
            configureOutsideOnlySpine(pkg);
            extension = ExtendedFlatpackAddon.create(scene, pkg, loaded.extensionImages);
            ExtendedFlatpackAddon.setInsideRightCrop(extension, PROTOTYPE_GAME.crop);
            updateControls();
            toggleButton.disabled = false;
            progressRange.disabled = false;
        } catch (error) {
            console.error(error);
            status.textContent = error.message;
        }
    }

    toggleButton.disabled = true;
    progressRange.disabled = true;
    extensionButton.disabled = true;
    extensionRange.disabled = true;
    diagnosticButton.disabled = true;
    toggleButton.addEventListener("click", togglePackage);
    extensionButton.addEventListener("click", toggleExtension);
    extensionHotspot.addEventListener("click", toggleExtension);
    diagnosticButton.addEventListener("click", toggleDiagnostics);
    progressRange.addEventListener("input", () => setManualProgress(Number(progressRange.value)));
    extensionRange.addEventListener("input", () => {
        if (!extension || extension.isAnimating || pkg.openAmount < 0.999) return;
        const amount = Number(extensionRange.value);
        ExtendedFlatpackAddon.setExtensionActive(extension, amount > 0.0001);
        ExtendedFlatpackAddon.setOpenProgress(extension, amount);
        updateControls();
    });
    cropRange.addEventListener("input", () => {
        if (!extension) return;
        ExtendedFlatpackAddon.setInsideRightCrop(extension, Number(cropRange.value));
        updateControls();
    });
    resetButton.addEventListener("click", resetView);
    canvas.addEventListener("dblclick", () => {
        if (pkg?.openAmount > 0.999) toggleExtension();
        else togglePackage();
    });

    scene.onBeforeRenderObservable.add(() => {
        if (pkg?.isAnimating || extension?.isAnimating) updateControls();
    });
    engine.runRenderLoop(() => scene.render());
    window.addEventListener("resize", () => engine.resize());
    initialise();
})();
