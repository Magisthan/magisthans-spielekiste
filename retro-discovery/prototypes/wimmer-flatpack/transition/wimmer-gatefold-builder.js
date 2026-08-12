/*
 * One permanent Babylon gatefold model.
 *
 * Closed pose deliberately matches PackageBuilder.buildClosed():
 * front +Z, back -Z, left -X, right +X, top +Y, bottom -Y.
 * No display model is replaced while opening. Only frontHinge rotates.
 */
(function () {
    "use strict";

    const EPSILON = 0.03;

    function addPlane(scene, name, parent, material, dimensions, position, rotation) {
        const mesh = BABYLON.MeshBuilder.CreatePlane(name, dimensions, scene);
        mesh.parent = parent;
        mesh.material = material;
        mesh.position.copyFrom(position);
        mesh.rotation.copyFrom(rotation);
        return mesh;
    }

    window.WimmerGatefoldBuilder = {
        build(scene, presentationRoot, game, images, surfaceOptions = {}) {
            const coverDepth = Math.max(0.5, Math.min(game.depth * 0.28, game.depth - 0.5));
            const bodyDepth = game.depth - coverDepth;
            const halfWidth = game.width / 2;
            const halfHeight = game.height / 2;
            const halfDepth = game.depth / 2;
            const halfCoverDepth = coverDepth / 2;
            const root = new BABYLON.TransformNode("wimmerGatefoldRoot", scene);
            root.parent = presentationRoot;

            const materials = PackageMaterials.createGatefold(scene, images, surfaceOptions);
            // Every outside/inside artwork is a separate physical face. Culling
            // prevents a closed interior from leaking through the front cover.
            Object.values(materials).forEach((material) => {
                if (material) material.backFaceCulling = true;
            });

            const fixedBody = new BABYLON.TransformNode("wimmerFixedBody", scene);
            fixedBody.parent = root;
            // In the closed reference pose this reduced body ends directly
            // behind the front cover: bodyDepth + coverDepth = game.depth.
            fixedBody.position.z = -coverDepth / 2;

            const back = addPlane(scene, "wimmer-back", fixedBody, materials.backExterior,
                { width: game.width, height: game.height },
                new BABYLON.Vector3(0, 0, -bodyDepth / 2 - EPSILON),
                new BABYLON.Vector3(0, Math.PI, 0));
            const insideRight = addPlane(scene, "wimmer-inside-right", fixedBody, materials.insideRight,
                { width: game.width, height: game.height },
                new BABYLON.Vector3(0, 0, bodyDepth / 2 + EPSILON),
                BABYLON.Vector3.Zero());
            const left = addPlane(scene, "wimmer-left", fixedBody, materials.fixedLeft,
                { width: game.depth, height: game.height },
                new BABYLON.Vector3(-halfWidth, 0, coverDepth / 2),
                new BABYLON.Vector3(0, -Math.PI / 2, 0));
            const top = addPlane(scene, "wimmer-top", fixedBody, materials.fixedTop,
                { width: game.width, height: game.depth },
                new BABYLON.Vector3(0, halfHeight, coverDepth / 2),
                new BABYLON.Vector3(Math.PI / 2, 0, 0));
            const bottom = addPlane(scene, "wimmer-bottom", fixedBody, materials.fixedBottom,
                { width: game.width, height: game.depth },
                new BABYLON.Vector3(0, -halfHeight, coverDepth / 2),
                new BABYLON.Vector3(Math.PI / 2, 0, 0));

            // The spine is fixed to the body. In the closed pose it occupies
            // the front's right edge; after centring it remains between panels.
            const spine = new BABYLON.TransformNode("wimmerFixedSpine", scene);
            spine.parent = fixedBody;
            spine.position.set(halfWidth, 0, coverDepth / 2);
            const outerSpine = addPlane(scene, "wimmer-outer-spine", spine, materials.outerSpine,
                { width: game.depth, height: game.height },
                new BABYLON.Vector3(0, 0, halfDepth + EPSILON),
                new BABYLON.Vector3(0, -Math.PI / 2, 0));
            const insideSpine = images.insideSpin
                ? addPlane(scene, "wimmer-inside-spine", spine, materials.insideSpin,
                    { width: Math.max(0.8, game.depth), height: game.height },
                    new BABYLON.Vector3(0, 0, bodyDepth / 2 + EPSILON * 2),
                    BABYLON.Vector3.Zero())
                : null;

            // Wimmer rule: transform at the real front/spine edge, child centre
            // one half front width to the left. The front begins exactly at
            // PackageBuilder's closed-front position (+game.depth / 2).
            const frontHinge = new BABYLON.TransformNode("wimmerFrontHinge", scene);
            frontHinge.parent = root;
            frontHinge.position.set(halfWidth, 0, halfDepth - halfCoverDepth);
            const frontCover = new BABYLON.TransformNode("wimmerFrontCover", scene);
            frontCover.parent = frontHinge;
            frontCover.position.x = -halfWidth;
            const front = addPlane(scene, "wimmer-front", frontCover, materials.frontExterior,
                { width: game.width, height: game.height },
                new BABYLON.Vector3(0, 0, halfCoverDepth + EPSILON),
                BABYLON.Vector3.Zero());
            const insideLeft = addPlane(scene, "wimmer-inside-left", frontCover, materials.insideLeft,
                { width: game.width, height: game.height },
                new BABYLON.Vector3(0, 0, -halfCoverDepth - EPSILON),
                new BABYLON.Vector3(0, Math.PI, 0));

            return {
                root, materials, fixedBody, spine, frontHinge, frontCover,
                dimensions: { coverDepth, bodyDepth, halfWidth },
                meshes: { back, insideRight, left, top, bottom, outerSpine, insideSpine, front, insideLeft },
                closedReference: {
                    frontZ: halfDepth,
                    backZ: -halfDepth,
                    leftX: -halfWidth,
                    topY: halfHeight,
                    bottomY: -halfHeight
                }
            };
        },

        dispose(gatefold) {
            if (!gatefold) return;
            gatefold.root?.dispose();
            PackageMaterials.dispose(gatefold.materials);
        }
    };
}());
