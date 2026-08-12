/*
 * Adapter for the production closed-package builder.
 *
 * It deliberately contains no geometry of its own: the test harness uses the
 * exact PackageBuilder.buildClosed() implementation that Retro Discovery uses
 * for an ordinary, closed package.
 */
(function () {
    "use strict";

    window.ClosedPackageAdapter = {
        build(scene, presentationRoot, game, images, surfaceOptions) {
            const materials = PackageMaterials.createClosed(scene, images, surfaceOptions);
            const closed = PackageBuilder.buildClosed(
                scene,
                presentationRoot,
                game,
                materials,
                { spineTexture: "right" }
            );

            return { ...closed, materials };
        },

        dispose(reference) {
            if (!reference) return;
            reference.root?.dispose();
            PackageMaterials.dispose(reference.materials);
        }
    };
}());
