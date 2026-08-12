window.PackageMaterials = {

    createMaterial(scene, name, image, options = {}) {
        const material = new BABYLON.StandardMaterial(`package-${name}`, scene);
        const texture = new BABYLON.Texture(image.src, scene);

        texture.uScale = options.flipU === false ? 1 : -1;
        texture.uOffset = options.flipU === false ? 0 : 1;
        texture.vScale = options.flipV ? -1 : 1;
        texture.vOffset = options.flipV ? 1 : 0;
        texture.wAng = options.rotation || 0;
        texture.anisotropicFilteringLevel = 16;
        texture.gammaSpace = true;
        texture.level = 1.18;
        texture.updateSamplingMode(BABYLON.Texture.TRILINEAR_SAMPLINGMODE);

        material.diffuseTexture = texture;
        material.ambientColor = new BABYLON.Color3(0.42, 0.42, 0.42);
        material.specularColor = new BABYLON.Color3(0.22, 0.22, 0.22);
        material.specularPower = 140;
        material.emissiveColor = new BABYLON.Color3(0.12, 0.12, 0.12);
        material.backFaceCulling = options.backFaceCulling ?? false;

        return material;
    },

    createClosed(scene, images, surfaceOptions = {}) {
        const closedSurface = (name, image, fallback = {}) => this.createMaterial(
            scene,
            `closed-${name}`,
            image,
            {
                flipU: true,
                backFaceCulling: false,
                ...fallback,
                ...(surfaceOptions[name] || {})
            }
        );

        return {
            front: closedSurface("front", images.front),
            back: closedSurface("back", images.back),
            left: closedSurface("left", images.left),
            right: closedSurface("right", images.right),
            top: closedSurface("top", images.top, { rotation: Math.PI / 2 }),
            bottom: closedSurface("bottom", images.bottom, { rotation: -Math.PI / 2 })
        };
    },

    createGatefold(scene, images, surfaceOptions = {}) {
        const gatefoldSurface = (name, image, fallback = {}) => this.createMaterial(
            scene,
            `gatefold-${name}`,
            image,
            {
                backFaceCulling: false,
                ...fallback,
                ...(surfaceOptions[name] || {})
            }
        );

        return {
            frontExterior: gatefoldSurface("frontExterior", images.front, { flipU: true }),
            backExterior: gatefoldSurface("backExterior", images.back, { flipU: true }),
            outerSpine: gatefoldSurface("outerSpine", images.right, { flipU: true }),
            fixedLeft: gatefoldSurface("fixedLeft", images.left, { flipU: true }),
            fixedTop: gatefoldSurface("fixedTop", images.top, { flipU: true, rotation: Math.PI / 2 }),
            fixedBottom: gatefoldSurface("fixedBottom", images.bottom, { flipU: true, rotation: -Math.PI / 2 }),
            insideSpin: images.insideSpin
                ? gatefoldSurface("insideSpin", images.insideSpin, { flipU: false })
                : null,
            insideLeft: gatefoldSurface("insideLeft", images.insideLeft, { flipU: true }),
            insideRight: gatefoldSurface("insideRight", images.insideRight, { flipU: false })
        };
    },

    createFlatpack(scene, images, surfaceOptions = {}) {
        const option = (name, defaults) => ({
            ...defaults,
            ...(surfaceOptions[name] || {})
        });

        // These values are the approved UV calibration from the geometry
        // prototype. Flatpacks deliberately do not create an inside-spin.
        return {
            front: this.createMaterial(scene, "flatpack-front", images.front, option("front", { flipU: true })),
            back: this.createMaterial(scene, "flatpack-back", images.back, option("back", { flipU: true })),
            left: this.createMaterial(scene, "flatpack-left", images.left, option("left", { flipU: true })),
            top: this.createMaterial(scene, "flatpack-top", images.top, option("top", { flipU: true, rotation: Math.PI / 2 })),
            bottom: this.createMaterial(scene, "flatpack-bottom", images.bottom, option("bottom", { flipU: true, rotation: -Math.PI / 2 })),
            right: this.createMaterial(scene, "flatpack-right", images.right, option("right", { flipU: false, flipV: true })),
            insideLeft: this.createMaterial(scene, "flatpack-inside-left", images.insideLeft, option("insideLeft", { flipU: true })),
            insideRight: this.createMaterial(scene, "flatpack-inside-right", images.insideRight, option("insideRight", { flipU: true }))
        };
    },

    dispose(materials) {
        Object.values(materials || {}).forEach((material) => material?.dispose());
    }
};
