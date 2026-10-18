/* Second folding stage for packages declared as type: "extended-flatpack". */
window.ExtendedFlatpackBuilder = {
    create(scene, pkg, images, options = {}) {
        if (!scene || !pkg || (pkg.type !== "flatpack" && pkg.type !== "extended-flatpack")) {
            throw new Error("ExtendedFlatpackAddon benötigt eine produktive Flatpack-Box.");
        }

        const d = pkg.dimensions;
        const baseInsideRight = pkg.meshes["flatpack-inside-right"];
        const panelWidth = d.insideRightWidth;
        const panelZ = d.coverDepth / 2 + d.faceOffset;
        const insideOffset = panelWidth / 2 - d.halfWidth;
        const surfaceGap = 0.0025;

        const middleMaterial = PackageMaterials.createMaterial(
            scene,
            "extended-flatpack-inside-middle",
            images.insideMiddle,
            // The mesh itself is turned to face the viewer below; applying the
            // standard flatpack U flip as well would mirror inside_middle.
            { flipU: false, backFaceCulling: true }
        );
        const rightRightMaterial = PackageMaterials.createMaterial(
            scene,
            "extended-flatpack-inside-right-right",
            images.insideRightRight,
            // The leaf itself supplies the 180-degree turn. A further U flip
            // would mirror the opened artwork.
            { flipU: false, backFaceCulling: true }
        );
        const insideRightMaterial = PackageMaterials.createMaterial(
            scene,
            "extended-flatpack-inside-right",
            images.insideRight,
            { flipU: true, backFaceCulling: false }
        );
        // Keep precisely the production flatpack UV/orientation. The former
        // 180-degree mesh correction changed the artwork orientation at the
        // instant the second folding stage began.
        insideRightMaterial.backFaceCulling = false;
        insideRightMaterial.twoSidedLighting = true;

        const middle = BABYLON.MeshBuilder.CreatePlane(
            "extended-flatpack-inside-middle",
            { width: panelWidth, height: d.height },
            scene
        );
        middle.parent = pkg.fixedBody;
        middle.material = middleMaterial;
        middle.position.set(insideOffset, 0, panelZ);
        // Babylon's one-sided plane faces away in this slot. Turn only the
        // fixed artwork surface so inside_middle covers the outer back panel.
        middle.rotation.y = Math.PI;
        middle.metadata = { packageSurface: "inside-middle" };

        const hinge = new BABYLON.TransformNode("extended-flatpack-hinge", scene);
        hinge.parent = pkg.fixedBody;
        hinge.position.set(insideOffset, 0, panelZ + surfaceGap * 2);

        const leaf = new BABYLON.TransformNode("extended-flatpack-leaf", scene);
        leaf.parent = hinge;
        leaf.position.x = 0;

        const insideRight = BABYLON.MeshBuilder.CreatePlane(
            "extended-flatpack-inside-right",
            { width: panelWidth, height: d.height },
            scene
        );
        insideRight.parent = leaf;
        insideRight.material = insideRightMaterial;
        insideRight.position.z = surfaceGap;
        insideRight.metadata = { packageSurface: "inside-right-extension-front" };

        const insideRightRight = BABYLON.MeshBuilder.CreatePlane(
            "extended-flatpack-inside-right-right",
            { width: panelWidth, height: d.height },
            scene
        );
        insideRightRight.parent = leaf;
        insideRightRight.material = rightRightMaterial;
        insideRightRight.position.z = -surfaceGap;
        insideRightRight.metadata = { packageSurface: "inside-right-extension-reverse" };

        const diagnosticRoot = new BABYLON.TransformNode("extended-flatpack-diagnostics", scene);
        diagnosticRoot.parent = pkg.fixedBody;
        const outerMarker = BABYLON.MeshBuilder.CreateSphere(
            "extended-flatpack-outer-edge-marker",
            { diameter: Math.max(d.depth * 1.8, 0.045), segments: 16 },
            scene
        );
        outerMarker.parent = diagnosticRoot;
        const markerMaterial = new BABYLON.StandardMaterial("extended-flatpack-marker-material", scene);
        markerMaterial.diffuseColor = new BABYLON.Color3(0.94, 0.66, 0.12);
        markerMaterial.emissiveColor = new BABYLON.Color3(0.55, 0.28, 0.02);
        outerMarker.material = markerMaterial;
        const hingeAxis = BABYLON.MeshBuilder.CreateLines(
            "extended-flatpack-hinge-axis",
            {
                points: [
                    new BABYLON.Vector3(0, -d.halfHeight, 0),
                    new BABYLON.Vector3(0, d.halfHeight, 0)
                ]
            },
            scene
        );
        hingeAxis.parent = diagnosticRoot;
        hingeAxis.color = new BABYLON.Color3(1, 0.78, 0.22);
        diagnosticRoot.setEnabled(false);

        const extension = {
            scene,
            pkg,
            baseInsideRight,
            middle,
            hinge,
            leaf,
            insideRight,
            insideRightRight,
            materials: { middleMaterial, rightRightMaterial, insideRightMaterial },
            diagnosticRoot,
            outerMarker,
            hingeAxis,
            markerMaterial,
            panelWidth,
            leafWidth: panelWidth,
            insideOffset,
            hingeX: insideOffset,
            cropLeft: 0,
            rotationSign: 1,
            isCalibrated: false,
            isExtensionActive: false,
            openAmount: 0,
            isAnimating: false,
            observer: null
        };

        this.setPrimaryOpen(extension, false);
        this.setInsideRightCrop(extension, options.insideRightCropLeft ?? 0);
        this.setOpenProgress(extension, 0);
        return extension;
    },

    setPrimaryOpen(extension, isOpen) {
        if (!extension) return;
        const enabled = Boolean(isOpen);
        if (enabled) this.calibrateHinge(extension);
        // The completed primary opening must remain byte-for-byte the normal
        // production flatpack presentation. Do not replace inside_right here.
        // The extension geometry becomes active only on the second action.
        this.setExtensionActive(extension, false);
        if (!enabled) this.setOpenProgress(extension, 0);
    },

    setExtensionActive(extension, active) {
        if (!extension) return;
        const enabled = Boolean(active);
        extension.isExtensionActive = enabled;
        extension.baseInsideRight.setEnabled(!enabled);
        extension.middle.setEnabled(enabled);
        extension.hinge.setEnabled(enabled);
    },

    calibrateHinge(extension) {
        if (!extension || extension.isCalibrated) return false;
        const { scene, baseInsideRight, pkg, panelWidth, insideOffset } = extension;
        const camera = scene.activeCamera;
        if (!camera) return false;

        scene.updateTransformMatrix(true);
        baseInsideRight.computeWorldMatrix(true);
        const viewport = camera.viewport.toGlobal(
            scene.getEngine().getRenderWidth(),
            scene.getEngine().getRenderHeight()
        );
        const candidates = [-panelWidth / 2, panelWidth / 2].map((localX) => {
            const world = BABYLON.Vector3.TransformCoordinates(
                new BABYLON.Vector3(localX, 0, 0),
                baseInsideRight.getWorldMatrix()
            );
            const screen = BABYLON.Vector3.Project(
                world,
                BABYLON.Matrix.Identity(),
                scene.getTransformMatrix(),
                viewport
            );
            return { localX, screenX: screen.x };
        });

        // The greater projected X coordinate is the right-hand edge the
        // visitor actually sees, regardless of the mirrored hero pivot.
        const outer = candidates[0].screenX > candidates[1].screenX
            ? candidates[0]
            : candidates[1];
        extension.hingeX = insideOffset + outer.localX;
        extension.hinge.position.x = extension.hingeX;
        this.setInsideRightCrop(extension, extension.cropLeft);

        // Choose the arc which initially moves the leaf towards the viewer,
        // preventing it from travelling through the fixed middle panel.
        pkg.fixedBody.computeWorldMatrix(true);
        const testAngle = Math.PI / 3;
        const distanceForSign = (sign) => {
            const relative = BABYLON.Vector3.TransformCoordinates(
                new BABYLON.Vector3(extension.leaf.position.x, 0, 0),
                BABYLON.Matrix.RotationY(sign * testAngle)
            );
            const fixedLocal = new BABYLON.Vector3(
                extension.hingeX + relative.x,
                0,
                extension.hinge.position.z + relative.z
            );
            const world = BABYLON.Vector3.TransformCoordinates(
                fixedLocal,
                pkg.fixedBody.getWorldMatrix()
            );
            return BABYLON.Vector3.DistanceSquared(world, camera.position);
        };
        extension.rotationSign = distanceForSign(1) <= distanceForSign(-1) ? 1 : -1;

        extension.diagnosticRoot.position.set(
            extension.hingeX,
            0,
            extension.hinge.position.z + 0.012
        );
        extension.isCalibrated = true;
        this.setOpenProgress(extension, 0);
        return true;
    },

    setDiagnostics(extension, visible) {
        if (!extension) return;
        extension.diagnosticRoot.setEnabled(Boolean(visible) && extension.pkg.openAmount > 0.999);
    },

    setInsideRightCrop(extension, amount) {
        if (!extension) return false;
        const crop = BABYLON.Scalar.Clamp(amount, 0, 0.05);
        const texture = extension.materials.insideRightMaterial.diffuseTexture;

        // The folded leaf is observed from the reverse side. With the
        // production flipU calibration, displayed-left maps to source-left.
        // Reducing the negative U range removes that source edge without
        // modifying the archival scan.
        texture.uScale = -(1 - crop);
        texture.uOffset = 1;

        extension.cropLeft = crop;
        extension.leafWidth = extension.panelWidth * (1 - crop);
        const widthScale = extension.leafWidth / extension.panelWidth;
        extension.insideRight.scaling.x = widthScale;
        extension.insideRightRight.scaling.x = widthScale;

        // Keep the calibrated outer hinge fixed. Only the opposite edge moves
        // inward as the physical leaf becomes shorter.
        const foldedDirection = Math.sign(extension.insideOffset - extension.hingeX) || 1;
        extension.leaf.position.x = foldedDirection * extension.leafWidth / 2;
        return true;
    },

    setOpenProgress(extension, amount) {
        if (!extension) return false;
        const progress = BABYLON.Scalar.Clamp(amount, 0, 1);
        extension.hinge.rotation.y = extension.rotationSign * Math.PI * progress;

        // Re-centre the complete three-panel exhibit gradually. The existing
        // production flatpack remains untouched; only its prototype root moves.
        const extensionDirection = Math.sign(extension.hingeX - extension.insideOffset) || 1;
        extension.pkg.root.position.x = -extensionDirection * (extension.leafWidth / 2) * progress;
        extension.openAmount = progress;
        return true;
    },

    animateTo(extension, amount, onComplete) {
        if (!extension || extension.isAnimating) return false;
        const from = extension.openAmount;
        const to = BABYLON.Scalar.Clamp(amount, 0, 1);
        const opening = to > from;
        if (opening) this.setExtensionActive(extension, true);
        const startedAt = performance.now();
        const duration = 680;
        extension.isAnimating = true;
        extension.observer = extension.scene.onBeforeRenderObservable.add(() => {
            const t = Math.min((performance.now() - startedAt) / duration, 1);
            const eased = t * t * (3 - 2 * t);
            this.setOpenProgress(extension, BABYLON.Scalar.Lerp(from, to, eased));
            if (t >= 1) {
                extension.scene.onBeforeRenderObservable.remove(extension.observer);
                extension.observer = null;
                extension.isAnimating = false;
                this.setOpenProgress(extension, to);
                if (to <= 0.0001) this.setExtensionActive(extension, false);
                onComplete?.(extension);
            }
        });
        return true;
    },

    toggle(extension, onComplete) {
        return this.animateTo(extension, extension.openAmount > 0.5 ? 0 : 1, onComplete);
    },

    dispose(extension) {
        if (!extension) return;
        if (extension.observer) extension.scene.onBeforeRenderObservable.remove(extension.observer);
        extension.insideRight?.dispose();
        extension.insideRightRight?.dispose();
        extension.middle?.dispose();
        extension.outerMarker?.dispose();
        extension.hingeAxis?.dispose();
        extension.diagnosticRoot?.dispose();
        extension.leaf?.dispose();
        extension.hinge?.dispose();
        extension.markerMaterial?.dispose();
        PackageMaterials.dispose(extension.materials);
    }
};
