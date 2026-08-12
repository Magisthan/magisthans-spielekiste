window.PackageBuilder = {

    addPlane(scene, meshes, name, parent, material, dimensions, position, rotation) {
        const mesh = BABYLON.MeshBuilder.CreatePlane(`package-${name}`, dimensions, scene);
        mesh.parent = parent;
        mesh.material = material;
        mesh.position.copyFrom(position);
        mesh.rotation.copyFrom(rotation);
        mesh.metadata = { packageSurface: name };
        meshes[name] = mesh;
        return mesh;
    },

    buildClosed(scene, pivot, game, materials, packageOptions = {}) {
        const halfWidth = game.width / 2;
        const halfHeight = game.height / 2;
        const halfDepth = game.depth / 2;
        const meshes = {};
        const root = new BABYLON.TransformNode("closedPackageRoot", scene);
        root.parent = pivot;

        const spineTexture = packageOptions.spineTexture;
        // The viewer's hero rotation reverses the local screen direction. The
        // spine therefore belongs on the opposite local edge of the closed box.
        const leftMaterial = spineTexture === "right" ? materials.left : materials.right;
        const rightMaterial = spineTexture === "right" ? materials.right : materials.left;

        this.addPlane(scene, meshes, "closed-back", root, materials.back,
            { width: game.width, height: game.height },
            new BABYLON.Vector3(0, 0, -halfDepth), new BABYLON.Vector3(0, Math.PI, 0));
        this.addPlane(scene, meshes, "closed-front", root, materials.front,
            { width: game.width, height: game.height },
            new BABYLON.Vector3(0, 0, halfDepth), BABYLON.Vector3.Zero());
        this.addPlane(scene, meshes, "closed-left", root, leftMaterial,
            { width: game.depth, height: game.height },
            new BABYLON.Vector3(-halfWidth, 0, 0), new BABYLON.Vector3(0, -Math.PI / 2, 0));
        this.addPlane(scene, meshes, "closed-right", root, rightMaterial,
            { width: game.depth, height: game.height },
            new BABYLON.Vector3(halfWidth, 0, 0), new BABYLON.Vector3(0, Math.PI / 2, 0));
        this.addPlane(scene, meshes, "closed-top", root, materials.top,
            { width: game.width, height: game.depth },
            new BABYLON.Vector3(0, halfHeight, 0), new BABYLON.Vector3(Math.PI / 2, 0, 0));
        this.addPlane(scene, meshes, "closed-bottom", root, materials.bottom,
            { width: game.width, height: game.depth },
            new BABYLON.Vector3(0, -halfHeight, 0), new BABYLON.Vector3(Math.PI / 2, 0, 0));

        return { root, meshes };
    },

    buildGatefold(scene, pivot, game, materials, packageOptions = {}) {
        const halfWidth = game.width / 2;
        const halfHeight = game.height / 2;
        const halfDepth = game.depth / 2;
        const surfaceGap = 0.01;
        const isFlatpack = packageOptions.type === "flatpack";
        const meshes = {};
        const root = new BABYLON.TransformNode("openingAssembly", scene);
        root.parent = pivot;
        root.setEnabled(false);

        // The fixed back panel remains at the package origin. At full open it
        // is visible on screen right because the presentation pivot mirrors X.
        const fixedBody = new BABYLON.TransformNode("fixedBody", scene);
        fixedBody.parent = root;

        // The hinge shares the axis of the physical inner spine. Its child is
        // offset by -panelSpan, so at 0° it exactly overlaps closed-front.
        const frontHinge = new BABYLON.TransformNode("frontHinge", scene);
        frontHinge.parent = root;
        frontHinge.position.set(halfWidth, 0, halfDepth);

        const frontPanel = new BABYLON.TransformNode("movingFrontCover", scene);
        frontPanel.parent = frontHinge;
        frontPanel.position.set(-halfWidth, 0, 0);

        // The inner fold shares the physical hinge axis. It is independent
        // from the exterior right.webp spine and only exists when textured.
        this.addPlane(scene, meshes, "gatefold-back", fixedBody, materials.backExterior,
            { width: game.width, height: game.height },
            isFlatpack
                ? new BABYLON.Vector3(0, 0, halfDepth + surfaceGap)
                : new BABYLON.Vector3(0, 0, -halfDepth),
            isFlatpack ? BABYLON.Vector3.Zero() : new BABYLON.Vector3(0, Math.PI, 0));
        this.addPlane(scene, meshes, "gatefold-inside-right", fixedBody, materials.insideRight,
            { width: game.width, height: game.height },
            new BABYLON.Vector3(0, 0, halfDepth - surfaceGap), new BABYLON.Vector3(0, Math.PI, 0));
        if (!isFlatpack) {
            this.addPlane(scene, meshes, "gatefold-left", fixedBody, materials.fixedLeft,
                { width: game.depth, height: game.height },
                new BABYLON.Vector3(-halfWidth, 0, 0), new BABYLON.Vector3(0, -Math.PI / 2, 0));
        }
        if (!isFlatpack) {
            this.addPlane(scene, meshes, "gatefold-top", fixedBody, materials.fixedTop,
                { width: game.width, height: game.depth },
                new BABYLON.Vector3(0, halfHeight, 0), new BABYLON.Vector3(Math.PI / 2, 0, 0));
            this.addPlane(scene, meshes, "gatefold-bottom", fixedBody, materials.fixedBottom,
                { width: game.width, height: game.depth },
                new BABYLON.Vector3(0, -halfHeight, 0), new BABYLON.Vector3(Math.PI / 2, 0, 0));
        }
        this.addPlane(scene, meshes, "gatefold-outer-spine", root, materials.outerSpine,
            { width: game.depth, height: game.height },
            new BABYLON.Vector3(halfWidth, 0, halfDepth + surfaceGap), BABYLON.Vector3.Zero());
        if (materials.insideSpin) {
            this.addPlane(scene, meshes, "inside-spin", root, materials.insideSpin,
                { width: game.depth, height: game.height },
                new BABYLON.Vector3(halfWidth, 0, halfDepth - surfaceGap), new BABYLON.Vector3(0, Math.PI, 0));
        }
        this.addPlane(scene, meshes, "gatefold-front", frontPanel, materials.frontExterior,
            { width: game.width, height: game.height },
            BABYLON.Vector3.Zero(), BABYLON.Vector3.Zero());
        this.addPlane(scene, meshes, "gatefold-inside-left", frontPanel, materials.insideLeft,
            { width: game.width, height: game.height },
            new BABYLON.Vector3(0, 0, -surfaceGap), new BABYLON.Vector3(0, Math.PI, 0));

        return { root, fixedBody, frontHinge, frontPanel, meshes };
    },

    create(scene, pivot, current) {
        const packageOptions = current.gameData.package || {};
        const closed = this.buildClosed(scene, pivot, current.game, current.closedMaterials, packageOptions);

        if (!current.game.hasInside) {
            return {
                type: "closed",
                root: closed.root,
                meshes: closed.meshes,
                materials: current.closedMaterials,
                isOpenable: false
            };
        }

        const gatefold = this.buildGatefold(
            scene,
            pivot,
            current.game,
            current.gatefoldMaterials,
            packageOptions
        );

        return {
            type: "gatefold",
            closed,
            gatefold,
            root: closed.root,
            meshes: { ...closed.meshes, ...gatefold.meshes },
            materials: { ...current.closedMaterials, ...current.gatefoldMaterials },
            openAmount: 0,
            isOpenable: true,
            isAnimating: false
        };
    },

    dispose(pkg) {
        if (!pkg) return;
        Object.values(pkg.meshes || {}).forEach((mesh) => mesh?.dispose());
        pkg.gatefold?.frontPanel?.dispose();
        pkg.gatefold?.frontHinge?.dispose();
        pkg.gatefold?.fixedBody?.dispose();
        pkg.gatefold?.root?.dispose();
        if (pkg.closed?.root) {
            pkg.closed.root.dispose();
        } else {
            pkg.root?.dispose();
        }
    }
};
