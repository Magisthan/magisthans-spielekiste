/* ==========================================
   Retro Discovery – Flatpack package builder
   Production version of the approved geometry debugger.
========================================== */

window.FlatpackBuilder = {

    create(game, scene, pivot, materials) {
        const width = game.width;
        const height = game.height;
        const depth = game.depth;
        const coverDepth = depth * (2 / 7);
        const bodyDepth = depth - coverDepth;
        const halfWidth = width / 2;
        const halfHeight = height / 2;
        const halfDepth = depth / 2;
        const gap = 0.001;
        const faceOffset = 0.0014;
        const insideLeftRatio = game.images.insideLeft.naturalWidth /
            (game.images.insideLeft.naturalWidth + game.images.insideRight.naturalWidth);
        const openSpreadWidth = width * 2 + depth;
        const insideLeftWidth = openSpreadWidth * insideLeftRatio;
        const insideRightWidth = openSpreadWidth - insideLeftWidth;
        const meshes = {};

        // This root is disabled while the proven standard closed package is
        // shown. Its pose at 0% matches that same closed package.
        const root = new BABYLON.TransformNode("flatpackRoot", scene);
        root.parent = pivot;
        root.setEnabled(false);

        const fixedBody = new BABYLON.TransformNode("flatpackFixedBody", scene);
        fixedBody.parent = root;
        fixedBody.position.z = -coverDepth / 2;

        const frontHinge = new BABYLON.TransformNode("flatpackFrontHinge", scene);
        frontHinge.parent = root;
        frontHinge.position.set(halfWidth, 0, halfDepth - coverDepth / 2);

        const frontCover = new BABYLON.TransformNode("flatpackFrontCover", scene);
        frontCover.parent = frontHinge;
        frontCover.position.x = -halfWidth;

        const addPlane = (name, parent, material, dimensions, position, rotation) => {
            const mesh = BABYLON.MeshBuilder.CreatePlane(`flatpack-${name}`, dimensions, scene);
            mesh.parent = parent;
            mesh.material = material;
            mesh.position.copyFrom(position);
            mesh.rotation.copyFrom(rotation);
            mesh.metadata = { packageSurface: name };
            meshes[name] = mesh;
            return mesh;
        };

        // Fixed body and closed-only edges.
        addPlane("flatpack-back", fixedBody, materials.back,
            { width, height }, new BABYLON.Vector3(0, 0, -bodyDepth / 2 - gap), new BABYLON.Vector3(0, Math.PI, 0));
        addPlane("flatpack-inside-right", fixedBody, materials.insideRight,
            { width: insideRightWidth, height }, new BABYLON.Vector3(0, 0, bodyDepth / 2 + gap), BABYLON.Vector3.Zero());
        addPlane("flatpack-left", fixedBody, materials.left,
            { width: depth, height }, new BABYLON.Vector3(-halfWidth, 0, coverDepth / 2), new BABYLON.Vector3(0, -Math.PI / 2, 0));
        addPlane("flatpack-top", fixedBody, materials.top,
            { width, height: depth }, new BABYLON.Vector3(0, halfHeight, coverDepth / 2), new BABYLON.Vector3(Math.PI / 2, 0, 0));
        addPlane("flatpack-bottom", fixedBody, materials.bottom,
            { width, height: depth }, new BABYLON.Vector3(0, -halfHeight, coverDepth / 2), new BABYLON.Vector3(Math.PI / 2, 0, 0));

        // The two physical sides of the moving front cover.
        addPlane("flatpack-front", frontCover, materials.front,
            { width, height }, new BABYLON.Vector3(0, 0, coverDepth / 2 + gap), BABYLON.Vector3.Zero());
        addPlane("flatpack-inside-left", frontCover, materials.insideLeft,
            { width: insideLeftWidth, height }, new BABYLON.Vector3(0, 0, -coverDepth / 2 - gap), new BABYLON.Vector3(0, Math.PI, 0));

        // Dynamic outside spine: a ribbon whose edges follow back and front.
        const segmentCount = 10;
        const spineRibbon = new BABYLON.Mesh("flatpack-right-spine", scene);
        spineRibbon.material = materials.right;
        spineRibbon.material.backFaceCulling = false;
        const positions = new Array((segmentCount + 1) * 2 * 3).fill(0);
        const normals = new Array((segmentCount + 1) * 2 * 3).fill(0);
        const uvs = [];
        const indices = [];
        for (let index = 0; index <= segmentCount; index += 1) {
            const t = index / segmentCount;
            uvs.push(t, 0, t, 1);
            if (index < segmentCount) {
                const top = index * 2;
                const nextTop = top + 2;
                indices.push(top, nextTop, top + 1, nextTop, nextTop + 1, top + 1);
            }
        }
        const data = new BABYLON.VertexData();
        data.positions = positions;
        data.normals = normals;
        data.uvs = uvs;
        data.indices = indices;
        data.applyToMesh(spineRibbon, true);
        spineRibbon.parent = root;
        spineRibbon.metadata = { packageSurface: "flatpack-right-spine" };
        meshes["flatpack-right-spine"] = spineRibbon;

        const pkg = {
            type: "flatpack",
            root,
            closed: null,
            fixedBody,
            frontHinge,
            frontCover,
            spineRibbon,
            meshes,
            materials,
            dimensions: { width, height, depth, coverDepth, bodyDepth, halfWidth, halfHeight, halfDepth, faceOffset, gap, insideRightWidth },
            openAmount: 0,
            isOpenable: true,
            isAnimating: false
        };

        this.setOpenProgress(pkg, 0);
        return pkg;
    },

    setOpenProgress(pkg, amount) {
        if (!pkg) return false;
        const progress = BABYLON.Scalar.Clamp(amount, 0, 1);
        const d = pkg.dimensions;
        const back = pkg.meshes["flatpack-back"];
        const front = pkg.meshes["flatpack-front"];
        const insideRight = pkg.meshes["flatpack-inside-right"];
        const insideLeft = pkg.meshes["flatpack-inside-left"];

        pkg.fixedBody.position.x = -(d.halfWidth + d.depth / 2) * progress;
        pkg.frontHinge.position.x = d.halfWidth * (1 - progress) + d.depth / 2 * progress;
        pkg.frontHinge.position.z = BABYLON.Scalar.Lerp(d.halfDepth - d.coverDepth / 2, 0, progress);
        pkg.frontHinge.rotation.y = Math.PI * progress;

        back.position.z = BABYLON.Scalar.Lerp(-d.bodyDepth / 2 - d.gap, d.coverDepth / 2 - d.faceOffset, progress);
        insideRight.position.z = BABYLON.Scalar.Lerp(d.bodyDepth / 2 + d.gap, d.coverDepth / 2 + d.faceOffset, progress);
        front.position.z = BABYLON.Scalar.Lerp(d.coverDepth / 2 + d.gap, d.faceOffset, progress);
        insideLeft.position.z = BABYLON.Scalar.Lerp(-d.coverDepth / 2 - d.gap, -d.faceOffset, progress);

        const insideOffset = d.insideRightWidth / 2 - d.halfWidth;
        insideRight.position.x = BABYLON.Scalar.Lerp(0, insideOffset, progress);
        insideLeft.position.x = BABYLON.Scalar.Lerp(0, insideOffset, progress);

        // Flatpacks have no top/bottom/left shell in their fully open pose.
        const hideClosedEdges = progress >= 0.995;
        ["flatpack-left", "flatpack-top", "flatpack-bottom"].forEach((name) => pkg.meshes[name].setEnabled(!hideClosedEdges));

        this.updateSpineRibbon(pkg, progress);
        pkg.openAmount = progress;
        return true;
    },

    updateSpineRibbon(pkg, progress) {
        const d = pkg.dimensions;
        const back = pkg.meshes["flatpack-back"];
        const front = pkg.meshes["flatpack-front"];
        back.computeWorldMatrix(true);
        front.computeWorldMatrix(true);

        const backEdgeWorld = BABYLON.Vector3.TransformCoordinates(new BABYLON.Vector3(-d.halfWidth, 0, 0), back.getWorldMatrix());
        const frontEdgeWorld = BABYLON.Vector3.TransformCoordinates(new BABYLON.Vector3(d.halfWidth, 0, 0), front.getWorldMatrix());
        pkg.root.computeWorldMatrix(true);
        const rootInverse = pkg.root.getWorldMatrix().clone().invert();
        const backEdge = BABYLON.Vector3.TransformCoordinates(backEdgeWorld, rootInverse);
        const frontEdge = BABYLON.Vector3.TransformCoordinates(frontEdgeWorld, rootInverse);
        const path = frontEdge.subtract(backEdge);
        const outward = new BABYLON.Vector3(path.z, 0, -path.x);
        if (outward.lengthSquared() > 0.000001) outward.normalize();
        const bend = d.depth * 0.38 * (4 * progress * (1 - progress));
        const positions = [];
        const segmentCount = 10;
        for (let index = 0; index <= segmentCount; index += 1) {
            const t = index / segmentCount;
            const point = BABYLON.Vector3.Lerp(backEdge, frontEdge, t)
                .add(outward.scale(Math.sin(Math.PI * t) * bend));
            positions.push(point.x, d.halfHeight, point.z, point.x, -d.halfHeight, point.z);
        }
        const normals = [];
        const indices = pkg.spineRibbon.getIndices();
        BABYLON.VertexData.ComputeNormals(positions, indices, normals);
        pkg.spineRibbon.updateVerticesData(BABYLON.VertexBuffer.PositionKind, positions);
        pkg.spineRibbon.updateVerticesData(BABYLON.VertexBuffer.NormalKind, normals);
    },

    animateTo(scene, pkg, amount, onComplete) {
        if (!scene || !pkg || pkg.isAnimating) return false;
        const from = pkg.openAmount;
        const to = BABYLON.Scalar.Clamp(amount, 0, 1);
        const startedAt = performance.now();
        const duration = 560;
        pkg.isAnimating = true;
        const observer = scene.onBeforeRenderObservable.add(() => {
            const t = Math.min((performance.now() - startedAt) / duration, 1);
            const eased = t * t * (3 - 2 * t);
            this.setOpenProgress(pkg, BABYLON.Scalar.Lerp(from, to, eased));
            if (t === 1) {
                scene.onBeforeRenderObservable.remove(observer);
                pkg.isAnimating = false;
                onComplete?.(pkg);
            }
        });
        return true;
    },

    open(scene, pkg, onComplete) {
        return this.animateTo(scene, pkg, 1, onComplete);
    },

    close(scene, pkg, onComplete) {
        return this.animateTo(scene, pkg, 0, onComplete);
    },

    dispose(pkg) {
        if (!pkg) return;
        Object.values(pkg.meshes || {}).forEach((mesh) => mesh?.dispose());
        pkg.frontCover?.dispose();
        pkg.frontHinge?.dispose();
        pkg.fixedBody?.dispose();
        pkg.root?.dispose();
    }
};
