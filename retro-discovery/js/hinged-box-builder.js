/* ==========================================
   Retro Discovery - hinged box package builder

   The complete box body retains its depth. Only the front cover moves:
   front.webp is its exterior and inside_left.webp its interior. The fixed
   body's front opening displays inside_right.webp. Both side textures remain
   physical outside walls and never become a spine between the inner panels.
========================================== */

window.HingedBoxBuilder = {

    create(game, scene, pivot, closedMaterials, insideMaterials, packageOptions = {}) {
        const width = game.width;
        const height = game.height;
        const depth = game.depth;
        const halfWidth = width / 2;
        const halfHeight = height / 2;
        const halfDepth = depth / 2;
        const gap = 0.01;
        const meshes = {};

        const closed = PackageBuilder.buildClosed(scene, pivot, game, closedMaterials, packageOptions);

        const root = new BABYLON.TransformNode("hingedBoxRoot", scene);
        root.parent = pivot;
        root.setEnabled(false);

        const fixedBody = new BABYLON.TransformNode("hingedBoxFixedBody", scene);
        fixedBody.parent = root;

        // hingeSide describes the side to which the cover is presented after
        // opening. The shared viewer pivot mirrors local X on screen.
        const openDirection = packageOptions.hingeSide === "right" ? -1 : 1;
        const frontHinge = new BABYLON.TransformNode("hingedBoxFrontHinge", scene);
        frontHinge.parent = root;
        frontHinge.position.set(openDirection * halfWidth, 0, halfDepth + gap);

        const frontCover = new BABYLON.TransformNode("hingedBoxFrontCover", scene);
        frontCover.parent = frontHinge;
        frontCover.position.set(-openDirection * halfWidth, 0, 0);

        const addPlane = (name, parent, material, dimensions, position, rotation) => {
            const mesh = BABYLON.MeshBuilder.CreatePlane(`hinged-box-${name}`, dimensions, scene);
            mesh.parent = parent;
            mesh.material = material;
            mesh.position.copyFrom(position);
            mesh.rotation.copyFrom(rotation);
            mesh.metadata = { packageSurface: name };
            meshes[name] = mesh;
            return mesh;
        };

        addPlane("back", fixedBody, closedMaterials.back,
            { width, height }, new BABYLON.Vector3(0, 0, -halfDepth), new BABYLON.Vector3(0, Math.PI, 0));
        addPlane("inside-right", fixedBody, insideMaterials.insideRight,
            { width, height }, new BABYLON.Vector3(0, 0, halfDepth - gap), new BABYLON.Vector3(0, Math.PI, 0));
        addPlane("left", fixedBody, closedMaterials.left,
            { width: depth, height }, new BABYLON.Vector3(-halfWidth, 0, 0), new BABYLON.Vector3(0, -Math.PI / 2, 0));
        addPlane("right", fixedBody, closedMaterials.right,
            { width: depth, height }, new BABYLON.Vector3(halfWidth, 0, 0), new BABYLON.Vector3(0, Math.PI / 2, 0));
        addPlane("top", fixedBody, closedMaterials.top,
            { width, height: depth }, new BABYLON.Vector3(0, halfHeight, 0), new BABYLON.Vector3(Math.PI / 2, 0, 0));
        addPlane("bottom", fixedBody, closedMaterials.bottom,
            { width, height: depth }, new BABYLON.Vector3(0, -halfHeight, 0), new BABYLON.Vector3(Math.PI / 2, 0, 0));

        addPlane("front", frontCover, closedMaterials.front,
            { width, height }, BABYLON.Vector3.Zero(), BABYLON.Vector3.Zero());
        addPlane("inside-left", frontCover, insideMaterials.insideLeft,
            { width, height }, new BABYLON.Vector3(0, 0, -gap), new BABYLON.Vector3(0, Math.PI, 0));

        return {
            type: "hinged-box",
            root,
            closed,
            fixedBody,
            frontHinge,
            frontCover,
            meshes: { ...closed.meshes, ...meshes },
            materials: { ...closedMaterials, ...insideMaterials },
            openAngle: openDirection * Math.PI,
            openAmount: 0,
            isOpenable: true,
            isAnimating: false
        };
    },

    setOpenProgress(pkg, amount) {
        if (!pkg) return false;
        const progress = BABYLON.Scalar.Clamp(amount, 0, 1);
        pkg.frontHinge.rotation.y = pkg.openAngle * progress;
        pkg.openAmount = progress;
        return true;
    },

    animateTo(scene, pkg, amount, onComplete) {
        if (!scene || !pkg || pkg.isAnimating) return false;

        const from = pkg.openAmount;
        const to = BABYLON.Scalar.Clamp(amount, 0, 1);
        const opening = to > from;
        const startedAt = performance.now();
        const duration = 560;

        if (opening) {
            pkg.closed.root.setEnabled(false);
            pkg.root.setEnabled(true);
        }

        pkg.isAnimating = true;
        const observer = scene.onBeforeRenderObservable.add(() => {
            const t = Math.min((performance.now() - startedAt) / duration, 1);
            const eased = t * t * (3 - 2 * t);
            this.setOpenProgress(pkg, BABYLON.Scalar.Lerp(from, to, eased));

            if (t === 1) {
                scene.onBeforeRenderObservable.remove(observer);
                pkg.isAnimating = false;

                if (to === 0) {
                    pkg.root.setEnabled(false);
                    pkg.closed.root.setEnabled(true);
                }

                onComplete?.(pkg);
            }
        });

        return true;
    },

    dispose(pkg) {
        if (!pkg) return;
        Object.values(pkg.meshes || {}).forEach((mesh) => mesh?.dispose());
        pkg.frontCover?.dispose();
        pkg.frontHinge?.dispose();
        pkg.fixedBody?.dispose();
        pkg.root?.dispose();
        pkg.closed?.root?.dispose();
    }
};
