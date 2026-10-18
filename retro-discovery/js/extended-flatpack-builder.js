/* Production geometry for packages declared as type: "extended-flatpack". */
window.ExtendedFlatpackBuilder = {
    create(scene, pkg, images, options = {}) {
        if (
            !scene ||
            !pkg ||
            (pkg.type !== "flatpack" && pkg.type !== "extended-flatpack")
        ) {
            throw new Error("ExtendedFlatpackBuilder requires an existing flatpack package.");
        }

        const d = pkg.dimensions;
        const baseInsideRight = pkg.meshes["flatpack-inside-right"];
        const panelWidth = d.insideRightWidth;
        const cassetteBackZ = d.coverDepth / 2 - d.faceOffset;
        const insideOffset = panelWidth / 2 - d.halfWidth;
        const surfaceGap = 0.0025;
        const foldWidth = d.depth;
        const legacyFoldLayout = options.legacyFoldLayout === true;
        const cassetteFrontZ = cassetteBackZ + foldWidth;
        const cassetteCenterZ = (cassetteBackZ + cassetteFrontZ) / 2;
        const extendedTopImage = images.extendedTop || images.top;
        const extendedBottomImage = images.extendedBottom || images.bottom;
        const foldSpineImage = images.foldSpine || images.right;
        const primarySpineMaterial = legacyFoldLayout
            ? null
            : this.configureOutsideOnlyPrimarySpine(pkg);
        // Visibility hand-off only: keep inside_middle out of the depth buffer
        // until the moving inside_right leaf is clearly separated from it.
        // No transform or material geometry depends on this value.
        const middleRevealThreshold = 0.15;

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
        // Preserve the calibrated material orientation of the approved model.
        insideRightMaterial.backFaceCulling = false;
        insideRightMaterial.twoSidedLighting = true;
        const foldSpineMaterial = PackageMaterials.createMaterial(
            scene,
            "extended-flatpack-fold-spine",
            foldSpineImage,
            { flipU: false, backFaceCulling: !legacyFoldLayout }
        );
        foldSpineMaterial.backFaceCulling = !legacyFoldLayout;
        foldSpineMaterial.twoSidedLighting = legacyFoldLayout;
        const extendedTopMaterial = PackageMaterials.createMaterial(
            scene,
            "extended-flatpack-top",
            extendedTopImage,
            { flipU: false, rotation: Math.PI / 2, backFaceCulling: false }
        );
        const extendedBottomMaterial = PackageMaterials.createMaterial(
            scene,
            "extended-flatpack-bottom",
            extendedBottomImage,
            { flipU: true, rotation: -Math.PI / 2, backFaceCulling: false }
        );

        const middle = BABYLON.MeshBuilder.CreatePlane(
            "extended-flatpack-inside-middle",
            { width: panelWidth, height: d.height },
            scene
        );
        middle.parent = pkg.fixedBody;
        middle.material = middleMaterial;
        middle.position.set(insideOffset, 0, cassetteBackZ + surfaceGap);
        // Babylon's one-sided plane faces away in this slot. Turn only the
        // fixed artwork surface so inside_middle covers the outer back panel.
        middle.rotation.y = Math.PI;
        middle.metadata = { packageSurface: "inside-middle" };

        const hinge = new BABYLON.TransformNode("extended-flatpack-hinge", scene);
        hinge.parent = pkg.fixedBody;
        hinge.position.set(insideOffset, 0, cassetteBackZ);

        // Articulated 7-mm bridge between the fixed inside_middle panel and
        // the additional leaf. The leaf hangs from its second hinge.
        const foldSpine = BABYLON.MeshBuilder.CreatePlane(
            "extended-flatpack-fold-spine",
            { width: foldWidth, height: d.height },
            scene
        );
        foldSpine.parent = hinge;
        foldSpine.material = foldSpineMaterial;
        foldSpine.position.z = surfaceGap;
        foldSpine.metadata = { packageSurface: "extension-fold-spine" };

        const outerHinge = new BABYLON.TransformNode("extended-flatpack-outer-hinge", scene);
        outerHinge.parent = hinge;

        const leaf = new BABYLON.TransformNode("extended-flatpack-leaf", scene);
        leaf.parent = outerHinge;
        if (!legacyFoldLayout) {
            foldSpine.parent = leaf;
            foldSpine.position.z = surfaceGap * 2;
            foldSpine.rotation.y = Math.PI;
        }

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

        // Static counterpart for the first open state. The animated bridge is
        // enabled only when the second opening starts. Top and bottom belong
        // only to this first-open folded state.
        const primaryEdgeAssembly = new BABYLON.TransformNode(
            "extended-flatpack-primary-edge-assembly",
            scene
        );
        primaryEdgeAssembly.parent = pkg.fixedBody;
        primaryEdgeAssembly.position.set(insideOffset, 0, cassetteCenterZ);

        const primaryFoldHinge = new BABYLON.TransformNode("extended-flatpack-primary-fold-hinge", scene);
        primaryFoldHinge.parent = primaryEdgeAssembly;
        primaryFoldHinge.position.set(0, 0, 0);

        // Unlike a single rotated plane, this ribbon can attach each of its
        // long edges to a different physical surface: back and inside_right.
        const primaryFoldSpine = new BABYLON.Mesh(
            "extended-flatpack-primary-fold-spine",
            scene
        );
        primaryFoldSpine.parent = primaryFoldHinge;
        primaryFoldSpine.material = foldSpineMaterial;
        const primaryFoldData = new BABYLON.VertexData();
        primaryFoldData.positions = new Array(18).fill(0);
        primaryFoldData.normals = new Array(18).fill(0);
        primaryFoldData.uvs = [
            0, 1, 0, 0,
            0.5, 1, 0.5, 0,
            1, 1, 1, 0
        ];
        primaryFoldData.indices = [
            0, 2, 1, 2, 3, 1,
            2, 4, 3, 4, 5, 3
        ];
        primaryFoldData.applyToMesh(primaryFoldSpine, true);
        primaryFoldSpine.metadata = { packageSurface: "extension-fold-spine-primary" };

        const primaryEdges = new BABYLON.TransformNode("extended-flatpack-primary-edges", scene);
        primaryEdges.parent = primaryEdgeAssembly;
        primaryEdges.position.set(0, 0, 0);

        const primaryTop = BABYLON.MeshBuilder.CreatePlane(
            "extended-flatpack-primary-top",
            { width: panelWidth, height: foldWidth },
            scene
        );
        primaryTop.parent = primaryEdges;
        primaryTop.material = extendedTopMaterial;
        primaryTop.position.y = d.halfHeight;
        primaryTop.rotation.x = Math.PI / 2;
        primaryTop.metadata = { packageSurface: "extension-top-primary" };

        const primaryBottom = BABYLON.MeshBuilder.CreatePlane(
            "extended-flatpack-primary-bottom",
            { width: panelWidth, height: foldWidth },
            scene
        );
        primaryBottom.parent = primaryEdges;
        primaryBottom.material = extendedBottomMaterial;
        primaryBottom.position.y = -d.halfHeight;
        primaryBottom.rotation.x = -Math.PI / 2;
        primaryBottom.metadata = { packageSurface: "extension-bottom-primary" };

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
            foldSpine,
            outerHinge,
            leaf,
            insideRight,
            insideRightRight,
            primaryEdgeAssembly,
            primaryFoldHinge,
            primaryFoldSpine,
            primaryEdges,
            primaryTop,
            primaryBottom,
            materials: {
                middleMaterial,
                rightRightMaterial,
                insideRightMaterial,
                foldSpineMaterial,
                extendedTopMaterial,
                extendedBottomMaterial,
                primarySpineMaterial
            },
            diagnosticRoot,
            outerMarker,
            hingeAxis,
            markerMaterial,
            panelWidth,
            foldWidth,
            legacyFoldLayout,
            surfaceGap,
            cassetteBackZ,
            cassetteFrontZ,
            cassetteCenterZ,
            middleRevealThreshold,
            leafWidth: panelWidth,
            insideRightWidth: panelWidth,
            visibleFoldWidth: foldWidth,
            insideOffset,
            hingeX: insideOffset,
            outerDirection: 1,
            cropLeft: 0,
            textureCropLeft: 0,
            closedFoldSign: -1,
            rotationSign: 1,
            primaryOpen: false,
            isCalibrated: false,
            isExtensionActive: false,
            openAmount: 0,
            isAnimating: false,
            observer: null
        };

        this.setPrimaryOpen(extension, false);
        this.setInsideRightCrop(
            extension,
            options.insideRightCropLeft ?? 0,
            options.insideRightTextureCropLeft ?? options.insideRightCropLeft ?? 0
        );
        this.setOpenProgress(extension, 0);
        return extension;
    },

    setPrimaryOpen(extension, isOpen) {
        if (!extension) return;
        const enabled = Boolean(isOpen);
        extension.primaryOpen = enabled;
        this.setPrimaryCassette(extension, enabled);
        if (enabled) {
            extension.isCalibrated = false;
            this.calibrateHinge(extension);
        }
        this.setExtensionActive(extension, false);
        if (!enabled) this.setOpenProgress(extension, 0);
    },

    setPrimaryCassette(extension, enabled) {
        if (!extension) return;
        if (enabled) {
            extension.baseInsideRight.position.z =
                extension.cassetteFrontZ + extension.surfaceGap;
            return;
        }
        const d = extension.pkg.dimensions;
        extension.baseInsideRight.position.z = BABYLON.Scalar.Lerp(
            d.bodyDepth / 2 + d.gap,
            d.coverDepth / 2 + d.faceOffset,
            extension.pkg.openAmount
        );
    },

    setExtensionActive(extension, active) {
        if (!extension) return;
        const enabled = Boolean(active);
        extension.isExtensionActive = enabled;
        extension.baseInsideRight.setEnabled(!enabled);
        // At the start/end of the second fold, inside_right is almost
        // coplanar with inside_middle. Do not render both surfaces inside that
        // tiny overlap range, otherwise the depth buffer produces flicker.
        this.updateFoldVisibility(extension, extension.openAmount);
        extension.hinge.setEnabled(enabled);
        extension.primaryFoldHinge.setEnabled(extension.primaryOpen && !enabled);
        extension.primaryEdges.setEnabled(extension.primaryOpen && !enabled);
    },

    updateFoldVisibility(extension, progress) {
        if (!extension) return;
        const active = extension.isExtensionActive;
        extension.baseInsideRight.setEnabled(!active);
        extension.middle.setEnabled(extension.legacyFoldLayout
            ? active && progress >= extension.middleRevealThreshold
            : extension.primaryOpen
        );
    },

    configureOutsideOnlyPrimarySpine(pkg) {
        const ribbon = pkg?.spineRibbon;
        if (!ribbon?.material) return null;

        const material = ribbon.material.clone(
            "extended-flatpack-primary-spine-outside-material"
        );
        material.backFaceCulling = true;
        material.twoSidedLighting = false;
        ribbon.material = material;

        const positions = ribbon.getVerticesData(BABYLON.VertexBuffer.PositionKind);
        const indices = ribbon.getIndices();
        if (!positions?.length || !indices?.length) return material;

        const firstTop = BABYLON.Vector3.FromArray(positions, 0);
        const nextTop = BABYLON.Vector3.FromArray(positions, 6);
        const path = nextTop.subtract(firstTop);
        const expectedOutside = new BABYLON.Vector3(-path.z, 0, path.x);
        if (expectedOutside.lengthSquared() <= 0.000001) return material;
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
            const normals = [];
            BABYLON.VertexData.ComputeNormals(positions, outwardIndices, normals);
            ribbon.updateVerticesData(BABYLON.VertexBuffer.NormalKind, normals);
        }
        return material;
    },

    updatePrimaryFoldRibbon(extension, insideLocalX) {
        if (!extension) return false;
        const { scene, pkg, baseInsideRight, primaryEdgeAssembly } = extension;
        const back = pkg.meshes["flatpack-back"];
        const camera = scene.activeCamera;
        if (!back || !camera) return false;

        scene.updateTransformMatrix(true);
        back.computeWorldMatrix(true);
        baseInsideRight.computeWorldMatrix(true);
        primaryEdgeAssembly.computeWorldMatrix(true);

        const viewport = camera.viewport.toGlobal(
            scene.getEngine().getRenderWidth(),
            scene.getEngine().getRenderHeight()
        );
        const backHalfWidth = pkg.dimensions.width / 2;
        const backCandidates = [-backHalfWidth, backHalfWidth].map((localX) => {
            const world = BABYLON.Vector3.TransformCoordinates(
                new BABYLON.Vector3(localX, 0, 0),
                back.getWorldMatrix()
            );
            const screen = BABYLON.Vector3.Project(
                world,
                BABYLON.Matrix.Identity(),
                scene.getTransformMatrix(),
                viewport
            );
            return { localX, screenX: screen.x };
        });
        const backOuter = backCandidates[0].screenX > backCandidates[1].screenX
            ? backCandidates[0]
            : backCandidates[1];

        const assemblyInverse = primaryEdgeAssembly.getWorldMatrix().clone().invert();
        const toAssemblyLocal = (mesh, localX, localY) => {
            const world = BABYLON.Vector3.TransformCoordinates(
                new BABYLON.Vector3(localX, localY, 0),
                mesh.getWorldMatrix()
            );
            return BABYLON.Vector3.TransformCoordinates(world, assemblyInverse);
        };
        const halfHeight = pkg.dimensions.halfHeight;
        const backTop = toAssemblyLocal(back, backOuter.localX, halfHeight);
        const backBottom = toAssemblyLocal(back, backOuter.localX, -halfHeight);
        const insideTop = toAssemblyLocal(baseInsideRight, insideLocalX, halfHeight);
        const insideBottom = toAssemblyLocal(baseInsideRight, insideLocalX, -halfHeight);
        // The extended right-hand cassette gives these two attachment edges
        // the full physical box depth. The midpoint remains linear: the fold
        // is now a real side wall rather than an artificial outward bulge.
        const middleTop = BABYLON.Vector3.Lerp(backTop, insideTop, 0.5);
        const middleBottom = BABYLON.Vector3.Lerp(backBottom, insideBottom, 0.5);
        const positions = [
            backTop.x, backTop.y, backTop.z,
            backBottom.x, backBottom.y, backBottom.z,
            middleTop.x, middleTop.y, middleTop.z,
            middleBottom.x, middleBottom.y, middleBottom.z,
            insideTop.x, insideTop.y, insideTop.z,
            insideBottom.x, insideBottom.y, insideBottom.z
        ];
        const indices = extension.primaryFoldSpine.getIndices();
        const normals = [];
        BABYLON.VertexData.ComputeNormals(positions, indices, normals);
        extension.primaryFoldSpine.updateVerticesData(
            BABYLON.VertexBuffer.PositionKind,
            positions
        );
        extension.primaryFoldSpine.updateVerticesData(
            BABYLON.VertexBuffer.NormalKind,
            normals
        );
        extension.primaryFoldSpine.refreshBoundingInfo();
        return true;
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
        extension.outerDirection = Math.sign(outer.localX) || 1;
        extension.hinge.position.x = extension.hingeX;
        this.updatePrimaryFoldRibbon(extension, outer.localX);
        this.setInsideRightCrop(
            extension,
            extension.cropLeft,
            extension.textureCropLeft
        );

        // The closed bridge orientation and the opening direction solve two
        // different problems. Keep the bridge attached to the 7-mm cassette,
        // but choose the later swing direction from the free camera-facing
        // side, as in the approved opening animation.
        extension.closedFoldSign = -extension.outerDirection;
        pkg.fixedBody.computeWorldMatrix(true);
        const testAngle = Math.PI / 3;
        const distanceForSign = (sign) => {
            const relative = BABYLON.Vector3.TransformCoordinates(
                new BABYLON.Vector3(
                    -extension.outerDirection * extension.leafWidth / 2,
                    0,
                    0
                ),
                BABYLON.Matrix.RotationY(sign * testAngle)
            );
            const fixedLocal = new BABYLON.Vector3(
                extension.hingeX + relative.x,
                0,
                extension.cassetteFrontZ + relative.z
            );
            const world = BABYLON.Vector3.TransformCoordinates(
                fixedLocal,
                pkg.fixedBody.getWorldMatrix()
            );
            return BABYLON.Vector3.DistanceSquared(world, camera.position);
        };
        extension.rotationSign = distanceForSign(1) <= distanceForSign(-1) ? 1 : -1;
        if (extension.legacyFoldLayout) {
            extension.foldSpine.position.x =
                extension.outerDirection * extension.foldWidth / 2;
            extension.outerHinge.position.x =
                extension.outerDirection * extension.foldWidth;
        } else {
            extension.outerHinge.position.x = 0;
            extension.foldSpine.position.x =
                -extension.outerDirection * extension.visibleFoldWidth / 2;
        }

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

    setInsideRightCrop(extension, amount, textureAmount = amount) {
        if (!extension) return false;
        const crop = BABYLON.Scalar.Clamp(amount, 0, 0.05);
        const textureCrop = BABYLON.Scalar.Clamp(textureAmount, 0, 0.08);
        const texture = extension.materials.insideRightMaterial.diffuseTexture;

        // The folded leaf is observed from the reverse side. With the
        // production flipU calibration, displayed-left maps to source-left.
        // Reducing the negative U range removes that source edge without
        // modifying the archival scan.
        texture.uScale = -(1 - textureCrop);
        texture.uOffset = 1;

        extension.cropLeft = crop;
        extension.textureCropLeft = textureCrop;
        if (extension.legacyFoldLayout) {
            extension.leafWidth = extension.panelWidth * (1 - crop);
            const widthScale = extension.leafWidth / extension.panelWidth;
            extension.insideRight.scaling.x = widthScale;
            extension.insideRightRight.scaling.x = widthScale;
            const leafCenter = -extension.outerDirection * extension.leafWidth / 2;
            extension.insideRight.position.x = leafCenter;
            extension.insideRightRight.position.x = leafCenter;
            return true;
        }

        extension.leafWidth = extension.panelWidth;
        extension.insideRightWidth = extension.panelWidth * (1 - crop);
        extension.visibleFoldWidth = extension.panelWidth - extension.insideRightWidth;
        extension.insideRight.scaling.x =
            extension.insideRightWidth / extension.panelWidth;
        extension.insideRightRight.scaling.x = 1;
        extension.foldSpine.scaling.x = extension.foldWidth > 0
            ? extension.visibleFoldWidth / extension.foldWidth
            : 1;

        const innerCenter = -extension.outerDirection * extension.leafWidth / 2;
        const outsideCenter = -extension.outerDirection * (
            extension.visibleFoldWidth + extension.insideRightWidth / 2
        );
        extension.insideRightRight.position.x = innerCenter;
        extension.insideRight.position.x = outsideCenter;
        extension.foldSpine.position.x =
            -extension.outerDirection * extension.visibleFoldWidth / 2;
        return true;
    },

    setOpenProgress(extension, amount) {
        if (!extension) return false;
        const progress = BABYLON.Scalar.Clamp(amount, 0, 1);
        // 0% follows the physical cassette depth; 100% follows the separately
        // calibrated outward swing direction. This keeps the first-open pose
        // exact without sacrificing the proven second-opening motion.
        const closedHingeAngle = extension.closedFoldSign * Math.PI / 2;
        const closedOuterAngle = -extension.closedFoldSign * Math.PI / 2;
        const openedOuterAngle = extension.rotationSign * Math.PI;
        extension.hinge.rotation.y = closedHingeAngle * (1 - progress);
        extension.outerHinge.rotation.y = BABYLON.Scalar.Lerp(
            closedOuterAngle,
            openedOuterAngle,
            progress
        );
        this.updateFoldVisibility(extension, progress);

        // Re-centre the complete three-panel exhibit gradually. The existing
        // production flatpack remains untouched; only its package root moves.
        const extensionDirection = Math.sign(extension.hingeX - extension.insideOffset) || 1;
        const presentationWidth = extension.legacyFoldLayout
            ? extension.foldWidth + extension.leafWidth
            : extension.leafWidth;
        extension.pkg.root.position.x =
            -extensionDirection * (presentationWidth / 2) * progress;
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
        extension.foldSpine?.dispose();
        extension.primaryFoldSpine?.dispose();
        extension.primaryTop?.dispose();
        extension.primaryBottom?.dispose();
        extension.outerMarker?.dispose();
        extension.hingeAxis?.dispose();
        extension.diagnosticRoot?.dispose();
        extension.leaf?.dispose();
        extension.outerHinge?.dispose();
        extension.hinge?.dispose();
        extension.primaryFoldHinge?.dispose();
        extension.primaryEdges?.dispose();
        extension.primaryEdgeAssembly?.dispose();
        extension.markerMaterial?.dispose();
        PackageMaterials.dispose(extension.materials);
    }
};


