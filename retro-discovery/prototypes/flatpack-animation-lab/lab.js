(() => {
    "use strict";

    const SCALE = 0.014;
    const PRIMARY_DURATION = 920;
    const EXTENSION_DURATION = 1020;
    const HANDOFF_PAUSE = 70;
    const REFERENCES = {
        "7cities_of_gold_c64": { title: "Seven Cities of Gold", extended: false },
        hard_hat_mack: { title: "Hard Hat Mack", extended: true, legacy: true },
        one_on_one_erving_vs_bird: { title: "One on One: Erving vs. Bird", extended: true },
        the_standing_stones: { title: "The Standing Stones", extended: true }
    };
    const $ = (selector) => document.querySelector(selector);
    const canvas = $("#viewer");
    const engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
    const scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color4(0.025, 0.052, 0.08, 1);
    const camera = new BABYLON.ArcRotateCamera("lab-camera", -Math.PI / 2, Math.PI / 2.45, 7.2, BABYLON.Vector3.Zero(), scene);
    camera.lowerRadiusLimit = 4;
    camera.upperRadiusLimit = 12;
    camera.wheelDeltaPercentage = 0.012;
    camera.panningSensibility = 0;
    camera.attachControl(canvas, true);
    const hemi = new BABYLON.HemisphericLight("lab-hemi", new BABYLON.Vector3(.2, 1, .25), scene);
    hemi.intensity = 1.15;
    hemi.groundColor = new BABYLON.Color3(.08, .11, .15);
    const key = new BABYLON.DirectionalLight("lab-key", new BABYLON.Vector3(-.35, -.55, -.7), scene);
    key.position = new BABYLON.Vector3(3, 5, 4);
    key.intensity = 1.15;

    let pivot = null;
    let pkg = null;
    let gameData = null;
    let mode = "experimental";
    let busy = false;
    let selectedState = "closed";

    const originalFlatpackCreate = FlatpackBuilder.create.bind(FlatpackBuilder);
    const originalFlatpackProgress = FlatpackBuilder.setOpenProgress.bind(FlatpackBuilder);
    const originalCalibrate = ExtendedFlatpackBuilder.calibrateHinge.bind(ExtendedFlatpackBuilder);
    const originalExtensionProgress = ExtendedFlatpackBuilder.setOpenProgress.bind(ExtendedFlatpackBuilder);

    function imageGeometryProxy(image, width) {
        return { src: image.src, naturalWidth: width, naturalHeight: 222 };
    }

    function updateDeterministicPrimaryRibbon(extension, side) {
        const { pkg: target, baseInsideRight, primaryEdgeAssembly } = extension;
        const back = target.meshes["flatpack-back"];
        scene.updateTransformMatrix(true);
        back.computeWorldMatrix(true);
        baseInsideRight.computeWorldMatrix(true);
        primaryEdgeAssembly.computeWorldMatrix(true);
        const inverse = primaryEdgeAssembly.getWorldMatrix().clone().invert();
        const localPoint = (mesh, x, y) => BABYLON.Vector3.TransformCoordinates(
            BABYLON.Vector3.TransformCoordinates(new BABYLON.Vector3(x, y, 0), mesh.getWorldMatrix()),
            inverse
        );
        const halfHeight = target.dimensions.halfHeight;
        const backX = side * target.dimensions.halfWidth;
        const insideX = side * extension.panelWidth / 2;
        const backTop = localPoint(back, backX, halfHeight);
        const backBottom = localPoint(back, backX, -halfHeight);
        const insideTop = localPoint(baseInsideRight, insideX, halfHeight);
        const insideBottom = localPoint(baseInsideRight, insideX, -halfHeight);
        const middleTop = BABYLON.Vector3.Lerp(backTop, insideTop, .5);
        const middleBottom = BABYLON.Vector3.Lerp(backBottom, insideBottom, .5);
        const positions = [
            ...backTop.asArray(), ...backBottom.asArray(),
            ...middleTop.asArray(), ...middleBottom.asArray(),
            ...insideTop.asArray(), ...insideBottom.asArray()
        ];
        const normals = [];
        BABYLON.VertexData.ComputeNormals(positions, extension.primaryFoldSpine.getIndices(), normals);
        extension.primaryFoldSpine.updateVerticesData(BABYLON.VertexBuffer.PositionKind, positions);
        extension.primaryFoldSpine.updateVerticesData(BABYLON.VertexBuffer.NormalKind, normals);
        extension.primaryFoldSpine.refreshBoundingInfo();
    }

    function ensureExplicitPrimarySpine(extension, side) {
        if (!extension.labPrimarySpine) {
            const mesh = BABYLON.MeshBuilder.CreatePlane(
                "lab-explicit-primary-fold-spine",
                { width: extension.foldWidth, height: extension.pkg.dimensions.height },
                extension.scene
            );
            mesh.parent = extension.primaryFoldHinge;
            mesh.rotation.y = side < 0 ? -Math.PI / 2 : Math.PI / 2;
            mesh.metadata = { packageSurface: "lab-explicit-extension-fold-spine" };

            const material = extension.materials.foldSpineMaterial.clone(
                "lab-explicit-primary-fold-spine-material"
            );
            material.backFaceCulling = false;
            material.twoSidedLighting = true;
            mesh.material = material;
            extension.materials.labExplicitPrimarySpineMaterial = material;
            extension.labPrimarySpine = mesh;
        }

        // primaryEdgeAssembly already supplies insideOffset and the centre of
        // the cassette depth. Only the physical outer X edge is required here.
        extension.labPrimarySpine.position.set(
            extension.hingeX - extension.insideOffset,
            0,
            0
        );
        extension.labPrimarySpine.rotation.y = side < 0 ? -Math.PI / 2 : Math.PI / 2;

        // The generic ribbon is useful for camera-derived production
        // calibration, but the lab's fixed construction uses the explicit
        // 7-mm wall above. Rendering both would cause z-fighting.
        extension.primaryFoldSpine.setEnabled(false);
    }

    function installLabRules() {
        FlatpackBuilder.create = function(game, targetScene, targetPivot, materials) {
            if (mode !== "experimental" || game.__labLegacy) return originalFlatpackCreate(game, targetScene, targetPivot, materials);
            const physicalInsideLeftWidth = game.width + game.depth;
            const physicalInsideRightWidth = game.width;
            const physical = {
                ...game,
                images: {
                    ...game.images,
                    insideLeft: imageGeometryProxy(game.images.insideLeft, physicalInsideLeftWidth),
                    insideRight: imageGeometryProxy(game.images.insideRight, physicalInsideRightWidth)
                }
            };
            const target = originalFlatpackCreate(physical, targetScene, targetPivot, materials);
            target.dimensions.labInsideLeftWidth = physicalInsideLeftWidth;
            target.dimensions.labInsideRightWidth = physicalInsideRightWidth;
            return target;
        };
        FlatpackBuilder.setOpenProgress = function(target, amount) {
            const result = originalFlatpackProgress(target, amount);
            if (mode !== "experimental" || !target) return result;
            const p = BABYLON.Scalar.Clamp(amount, 0, 1);
            // The productive builder historically applies the right-panel
            // offset to both inside planes. Once inside_left receives its
            // physical front+fold width, it needs its own half-width offset;
            // otherwise half of the 7-mm fold remains open at the main hinge.
            const insideLeft = target.meshes["flatpack-inside-left"];
            const insideLeftOffset =
                target.dimensions.labInsideLeftWidth / 2 - target.dimensions.halfWidth;
            insideLeft.position.x = BABYLON.Scalar.Lerp(0, insideLeftOffset, p);
            const visibility = 1 - BABYLON.Scalar.Clamp((p - .92) / .08, 0, 1);
            ["flatpack-left", "flatpack-top", "flatpack-bottom"].forEach((name) => {
                const mesh = target.meshes[name];
                mesh.setEnabled(true);
                mesh.visibility = visibility;
            });
            return result;
        };
        ExtendedFlatpackBuilder.calibrateHinge = function(extension) {
            if (mode !== "experimental" || extension.legacyFoldLayout) return originalCalibrate(extension);
            // The exhibit pivot presents the package with a roughly 152° Y
            // rotation. Consequently, the visitor's visible right-hand edge
            // is the negative local X edge of the package. Keep the semantic
            // option readable while translating it once into local geometry.
            const side = gameData?.package?.extendedFlatpack?.hingeSide === "left" ? 1 : -1;
            extension.outerDirection = side;
            extension.hingeX = extension.insideOffset + side * extension.panelWidth / 2;
            extension.hinge.position.x = extension.hingeX;
            // Anchor the inner hinge on the visible inside_middle surface.
            // Keeping the fold itself at an additional Z offset makes its
            // inner edge orbit around the seam during rotation and exposes a
            // temporary gap. Move the axis to that surface instead.
            extension.hinge.position.z =
                extension.cassetteBackZ + extension.surfaceGap;
            extension.closedFoldSign = -side;
            extension.rotationSign = gameData?.package?.extendedFlatpack?.openingDirection === "inward" ? -side : side;
            extension.outerHinge.position.x = 0;
            // create() initially lays out the leaf with outerDirection = +1.
            // Re-apply the calibrated crop after changing the direction so
            // inside_right, inside_right_right and the moving fold all hang
            // from the newly selected outer edge. Production calibration
            // performs the same second layout pass.
            ExtendedFlatpackBuilder.setInsideRightCrop(
                extension,
                extension.cropLeft,
                extension.textureCropLeft
            );
            // The visible inner artwork has one continuous hinge line:
            // inside_middle | inside_right_right. The fold artwork is not a
            // bridge between both panels; it belongs solely to the exterior
            // of the moving leaf and must therefore travel with that leaf.
            extension.outerHinge.position.x = 0;
            extension.foldSpine.parent = extension.leaf;
            extension.foldSpine.position.set(
                -extension.outerDirection * extension.visibleFoldWidth / 2,
                0,
                extension.surfaceGap * 2
            );
            extension.foldSpine.rotation.y = Math.PI;
            extension.foldSpine.material.backFaceCulling = true;
            extension.foldSpine.material.twoSidedLighting = false;
            extension.foldSpine.setEnabled(true);
            extension.labUsesInnerLeafEdge = true;
            updateDeterministicPrimaryRibbon(extension, side);
            ensureExplicitPrimarySpine(extension, side);
            extension.isCalibrated = true;
            return true;
        };
        ExtendedFlatpackBuilder.setOpenProgress = function(extension, amount) {
            const result = originalExtensionProgress(extension, amount);
            if (
                mode !== "experimental" ||
                !extension ||
                extension.legacyFoldLayout ||
                !extension.labUsesInnerLeafEdge
            ) {
                return result;
            }

            // The moving leaf rotates directly around the shared edge. It
            // must not receive a progressive translation: that translation
            // was the source of the temporary opening between the panels.
            extension.leaf.position.x = 0;
            return result;
        };
    }
    installLabRules();

    function loadImage(folder, name, optional = false) {
        return new Promise((resolve, reject) => {
            const image = new Image();
            image.onload = () => resolve(image);
            image.onerror = () => optional ? resolve(null) : reject(new Error(`${folder}/${name}.webp fehlt`));
            image.src = `../../../assets/textures/${folder}/${name}.webp`;
        });
    }

    async function loadGame(folder) {
        const source = GAMES.find((game) => game.folder === folder);
        if (!source) throw new Error(`Kein game.js-Eintrag für ${folder}`);
        const extended = source.package?.type === "extended-flatpack";
        const names = source.package?.extendedFlatpack || {};
        const [front, back, left, right, top, bottom, insideLeft, insideRight, insideMiddle, insideRightRight, extendedTop, extendedBottom, foldSpine] = await Promise.all([
            loadImage(folder, "front"), loadImage(folder, "back"), loadImage(folder, "left"),
            loadImage(folder, "right"), loadImage(folder, "top"), loadImage(folder, "bottom"),
            loadImage(folder, "inside_left"), loadImage(folder, "inside_right"),
            extended ? loadImage(folder, names.insideMiddleTexture || "inside_middle") : null,
            extended ? loadImage(folder, names.insideRightRightTexture || "inside_right_right") : null,
            extended ? loadImage(folder, names.extendedTopTexture || "extended-top", true) : null,
            extended ? loadImage(folder, names.extendedBottomTexture || "extended-bottom", true) : null,
            extended ? loadImage(folder, names.foldSpineTexture || "extended-fold-spine", true) : null
        ]);
        const dimensions = source.dimensions || { width: 222, height: 222, depth: 7 };
        return {
            source,
            game: {
                images: { front, back, left, right, top, bottom, insideLeft, insideRight, insideMiddle, insideRightRight, extendedTop, extendedBottom, foldSpine },
                width: dimensions.width * SCALE,
                height: dimensions.height * SCALE,
                depth: dimensions.depth * SCALE,
                hasInside: true,
                __labLegacy: source.package?.extendedFlatpack?.legacyFoldLayout === true
            }
        };
    }

    function resetView() {
        camera.alpha = -Math.PI / 2;
        camera.beta = Math.PI / 2.45;
        camera.radius = 7.2;
        if (pivot) pivot.rotation.set(BABYLON.Tools.ToRadians(-2), Math.PI - BABYLON.Tools.ToRadians(28), 0);
    }

    const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));
    const wait = (duration) => new Promise((resolve) => setTimeout(resolve, duration));
    const smootherStep = (t) => {
        const value = BABYLON.Scalar.Clamp(t, 0, 1);
        return value * value * value * (value * (value * 6 - 15) + 10);
    };
    const primaryMotion = (t) => {
        if (t < .14) return .04 * smootherStep(t / .14);
        if (t < .82) return .04 + .90 * smootherStep((t - .14) / .68);
        return .94 + .06 * smootherStep((t - .82) / .18);
    };
    const extensionMotion = (t) => {
        if (t < .16) return .055 * smootherStep(t / .16);
        if (t < .86) return .055 + .90 * smootherStep((t - .16) / .70);
        return .955 + .045 * smootherStep((t - .86) / .14);
    };
    const centeringMotion = (t) => t < .18 ? 0 : smootherStep((t - .18) / .82);

    async function buildSelected() {
        busy = true;
        $("#warning").hidden = true;
        if (pkg) Package.dispose(pkg);
        pivot?.dispose();
        pivot = new BABYLON.TransformNode("lab-pivot", scene);
        pivot.scaling.set(.86, .86, .86);
        resetView();
        mode = $("#mode-select").value;
        const folder = $("#game-select").value;
        try {
            const loaded = await loadGame(folder);
            gameData = structuredClone(loaded.source);
            if (mode === "experimental" && gameData.package?.type === "extended-flatpack" && !gameData.package.extendedFlatpack?.legacyFoldLayout) {
                Object.assign(gameData.package.extendedFlatpack, { foldWidth: 7, hingeSide: "right", openingDirection: "outward" });
            }
            pkg = Package.create(scene, pivot, { gameData, game: loaded.game });
            pkg.closed.root.setEnabled(true);
            pkg.root.setEnabled(false);
            $("#viewer-title").textContent = REFERENCES[folder].title;
            setState("closed", false);
        } catch (error) {
            $("#warning").textContent = error.message;
            $("#warning").hidden = false;
        } finally {
            busy = false;
        }
    }

    function preparePrimary() {
        pkg.closed.root.setEnabled(false);
        pkg.root.setEnabled(true);
    }

    async function preparePrimaryHandoff() {
        FlatpackBuilder.setOpenProgress(pkg, 0);
        pkg.root.setEnabled(true);
        pkg.root.computeWorldMatrix(true);
        pkg.closed.root.computeWorldMatrix(true);
        // Pre-warm the opening model while the proven closed model still owns
        // the visible frame. The actual ownership swap happens together in
        // the following render frame.
        pkg.root.setEnabled(false);
        await nextFrame();
        pkg.closed.root.setEnabled(false);
        pkg.root.setEnabled(true);
        await nextFrame();
    }

    async function prepareExtensionHandoff() {
        ExtendedFlatpackBuilder.setPrimaryOpen(pkg.extension, true);
        ExtendedFlatpackBuilder.setOpenProgress(pkg.extension, 0);
        pkg.root.computeWorldMatrix(true);
        pkg.extension.leaf.computeWorldMatrix(true);
        pkg.extension.baseInsideRight.computeWorldMatrix(true);
        await nextFrame();
        // Static inside_right and its moving counterpart exchange ownership
        // in a single frame. Rotation starts only after a short visual rest.
        ExtendedFlatpackBuilder.setExtensionActive(pkg.extension, true);
        await nextFrame();
        await wait(HANDOFF_PAUSE);
    }

    function applyProgress(primary, extension = 0) {
        if (!pkg) return;
        if (primary <= 0) {
            FlatpackBuilder.setOpenProgress(pkg, 0);
            pkg.root.setEnabled(false);
            pkg.closed.root.setEnabled(true);
            if (pkg.extension) ExtendedFlatpackBuilder.setPrimaryOpen(pkg.extension, false);
        } else {
            preparePrimary();
            FlatpackBuilder.setOpenProgress(pkg, primary);
            if (pkg.extension) {
                ExtendedFlatpackBuilder.setPrimaryOpen(pkg.extension, primary >= .999);
                if (primary >= .999 && extension > 0) {
                    ExtendedFlatpackBuilder.setOpenProgress(pkg.extension, 0);
                    pkg.root.computeWorldMatrix(true);
                    pkg.extension.leaf.computeWorldMatrix(true);
                    ExtendedFlatpackBuilder.setExtensionActive(pkg.extension, true);
                    ExtendedFlatpackBuilder.setOpenProgress(pkg.extension, extension);
                }
            }
        }
        syncControls(primary, extension);
    }

    function setState(state, mark = true) {
        if (!pkg || busy) return;
        selectedState = state;
        const values = {
            closed: [0, 0], "primary-start": [.03, 0], "primary-half": [.5, 0],
            "primary-open": [1, 0], "extension-half": [1, .5], extended: [1, 1]
        }[state];
        if (!pkg.extension && values[1] > 0) {
            $("#warning").textContent = "Seven Cities besitzt keinen zweiten Zusatzflügel.";
            $("#warning").hidden = false;
            return;
        }
        applyProgress(values[0], values[1]);
        if (mark) document.querySelectorAll("[data-state]").forEach((button) => button.classList.toggle("active", button.dataset.state === state));
    }

    function syncControls(primary, extension) {
        $("#primary-progress").value = primary;
        $("#primary-output").value = `${Math.round(primary * 100)} %`;
        $("#extension-progress").disabled = !pkg?.extension || primary < .999;
        $("#extension-progress").value = extension;
        $("#extension-output").value = `${Math.round(extension * 100)} %`;
        const label = primary <= 0 ? "Geschlossen" : primary < 1 ? "Erste Öffnung" : extension <= 0 ? "Erste Öffnung abgeschlossen" : extension < 1 ? "Zusatzflügel öffnet" : "Vollständig geöffnet";
        $("#viewer-state").textContent = `${label} · ${mode === "experimental" ? "Experimentell" : "Produktion"}`;
        updateDiagnostics(primary, extension);
    }

    function updateDiagnostics(primary, extension) {
        const ext = pkg?.extension;
        const rows = {
            "Primärfortschritt": primary.toFixed(2), "Zusatzfortschritt": extension.toFixed(2),
            "Boxwurzel X": pkg?.root?.position.x.toFixed(4) ?? "–",
            "Scharnier X": ext?.hingeX?.toFixed(4) ?? "–",
            "Scharnierseite": ext ? `${gameData?.package?.extendedFlatpack?.hingeSide || "rechts"} (lokal ${ext.outerDirection > 0 ? "+X" : "−X"})` : "–",
            "Öffnungsrichtung": ext ? `${gameData?.package?.extendedFlatpack?.openingDirection || "außen"} (${ext.rotationSign > 0 ? "+Y" : "−Y"})` : "–",
            "Statisches inside_right": pkg?.meshes?.["flatpack-inside-right"]?.isEnabled() ? "sichtbar" : "aus",
            "Beweglicher Flügel": ext?.hinge?.isEnabled() ? "sichtbar" : "aus",
            "Kanten-Sichtbarkeit": (pkg?.meshes?.["flatpack-top"]?.visibility ?? 0).toFixed(2)
        };
        $("#diagnostic-values").innerHTML = Object.entries(rows).map(([key, value]) => `<dt>${key}</dt><dd>${value}</dd>`).join("");
    }

    function animateTimeline(duration, update) {
        return new Promise((resolve) => {
            const start = performance.now();
            const frame = (now) => {
                const t = Math.min((now - start) / duration, 1);
                update(t);
                if (t < 1) requestAnimationFrame(frame); else resolve();
            };
            requestAnimationFrame(frame);
        });
    }

    function packageAction(action) {
        return new Promise((resolve) => {
            const started = action(resolve);
            if (started === false) resolve();
        });
    }

    async function playProductionOpen() {
        await packageAction((done) => Package.open(scene, pkg, done));
        if (pkg.extension) {
            await packageAction((done) => Package.toggleExtension(scene, pkg, done));
        }
        syncControls(1, pkg.extension?.openAmount || 0);
    }

    async function playProductionClose() {
        await packageAction((done) => Package.close(scene, pkg, done));
        syncControls(0, 0);
    }

    async function playOpen() {
        if (!pkg || busy) return;
        busy = true;
        if (mode === "production" || pkg.extension?.legacyFoldLayout) {
            await playProductionOpen();
            busy = false;
            return;
        }

        const primaryFrom = pkg.openAmount;
        const primaryCameraFrom = camera.radius;
        if (primaryFrom <= .001) await preparePrimaryHandoff(); else preparePrimary();
        await animateTimeline(PRIMARY_DURATION * Math.max(1 - primaryFrom, .25), (time) => {
            const motion = primaryMotion(time);
            const value = BABYLON.Scalar.Lerp(primaryFrom, 1, motion);
            FlatpackBuilder.setOpenProgress(pkg, value);
            camera.radius = BABYLON.Scalar.Lerp(primaryCameraFrom, 8.05, smootherStep(time));
            syncControls(value, 0);
        });
        if (pkg.extension) {
            await prepareExtensionHandoff();
            let targetRootX = 0;
            ExtendedFlatpackBuilder.setOpenProgress(pkg.extension, 1);
            targetRootX = pkg.root.position.x;
            ExtendedFlatpackBuilder.setOpenProgress(pkg.extension, 0);
            pkg.root.position.x = 0;
            const extensionCameraFrom = camera.radius;
            await animateTimeline(EXTENSION_DURATION, (time) => {
                const value = extensionMotion(time);
                ExtendedFlatpackBuilder.setOpenProgress(pkg.extension, value);
                pkg.root.position.x = BABYLON.Scalar.Lerp(0, targetRootX, centeringMotion(time));
                camera.radius = BABYLON.Scalar.Lerp(extensionCameraFrom, 8.45, smootherStep(time));
                syncControls(1, value);
            });
        }
        busy = false;
    }

    async function playClose() {
        if (!pkg || busy) return;
        busy = true;
        if (mode === "production" || pkg.extension?.legacyFoldLayout) {
            await playProductionClose();
            busy = false;
            return;
        }

        if (pkg.extension?.openAmount > 0) {
            const extensionFrom = pkg.extension.openAmount;
            const rootFrom = pkg.root.position.x;
            const extensionCameraFrom = camera.radius;
            await animateTimeline(EXTENSION_DURATION * Math.max(extensionFrom, .25), (time) => {
                const motion = extensionMotion(time);
                const value = BABYLON.Scalar.Lerp(extensionFrom, 0, motion);
                ExtendedFlatpackBuilder.setOpenProgress(pkg.extension, value);
                pkg.root.position.x = BABYLON.Scalar.Lerp(rootFrom, 0, centeringMotion(time));
                camera.radius = BABYLON.Scalar.Lerp(extensionCameraFrom, 8.05, smootherStep(time));
                syncControls(1, value);
            });
            pkg.extension.leaf.computeWorldMatrix(true);
            pkg.extension.baseInsideRight.computeWorldMatrix(true);
            await nextFrame();
            ExtendedFlatpackBuilder.setExtensionActive(pkg.extension, false);
            await nextFrame();
            await wait(HANDOFF_PAUSE);
        }
        const primaryFrom = pkg.openAmount;
        const primaryCameraFrom = camera.radius;
        await animateTimeline(PRIMARY_DURATION * Math.max(primaryFrom, .25), (time) => {
            const motion = primaryMotion(time);
            const value = BABYLON.Scalar.Lerp(primaryFrom, 0, motion);
            FlatpackBuilder.setOpenProgress(pkg, value);
            camera.radius = BABYLON.Scalar.Lerp(primaryCameraFrom, 7.2, smootherStep(time));
            syncControls(value, 0);
        });
        await nextFrame();
        pkg.root.setEnabled(false);
        pkg.closed.root.setEnabled(true);
        await nextFrame();
        busy = false;
    }

    $("#game-select").addEventListener("change", buildSelected);
    $("#mode-select").addEventListener("change", buildSelected);
    $("#state-buttons").addEventListener("click", (event) => event.target.dataset.state && setState(event.target.dataset.state));
    $("#primary-progress").addEventListener("input", (event) => applyProgress(Number(event.target.value), 0));
    $("#extension-progress").addEventListener("input", (event) => applyProgress(1, Number(event.target.value)));
    $("#play-open").addEventListener("click", playOpen);
    $("#play-close").addEventListener("click", playClose);
    $("#reset-view").addEventListener("click", resetView);
    $("#save-frame").addEventListener("click", () => {
        const link = document.createElement("a");
        link.download = `${gameData?.folder || "flatpack"}-${selectedState}-${mode}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
    });
    window.addEventListener("resize", () => engine.resize());
    engine.runRenderLoop(() => scene.render());
    buildSelected();
})();
