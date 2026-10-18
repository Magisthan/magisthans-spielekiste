const fs = require("fs");
const vm = require("vm");

const read = (file) => fs.readFileSync(file, "utf8");
const assert = (condition, message) => {
    if (!condition) throw new Error(message);
};

const games = read("assets/js/game.js");
const pkg = read("retro-discovery/js/package.js");
const builder = read("retro-discovery/js/extended-flatpack-builder.js");
const retroViewer = read("retro-discovery/js/viewer.js");
const detailViewer = read("assets/js/game-detail-viewer.js");
const previewViewer = read("assets/js/preview.js");
const gameboxViewer = read("assets/js/gamebox.js");

const extendedTextureNames = [
    "inside_middle.webp",
    "inside_right_right.webp",
    "extended-top.webp",
    "extended-bottom.webp",
    "extended-fold-spine.webp"
];
const assertExtendedTextures = (folder) => {
    for (const texture of extendedTextureNames) {
        assert(
            fs.existsSync(`assets/textures/${folder}/${texture}`),
            `Missing extended-flatpack texture: ${folder}/${texture}`
        );
    }
};

assert(/folder:\s*["']hard_hat_mack["'][\s\S]*?type:\s*["']extended-flatpack["']/.test(games),
    "Hard Hat Mack is not configured as extended-flatpack");
assert(/insideRightCropLeft:\s*0\.029/.test(games), "Hard Hat Mack crop must be 0.029");
assert(
    /folder:\s*["']hard_hat_mack["'][\s\S]*?legacyFoldLayout:\s*true/.test(games),
    "Hard Hat Mack must retain the approved legacy fold layout"
);
assert(/folder:\s*["']one_on_one_erving_vs_bird["'][\s\S]*?type:\s*["']extended-flatpack["']/.test(games),
    "One on One is not configured as extended-flatpack");
assert(/folder:\s*["']one_on_one_erving_vs_bird["'][\s\S]{0,5000}?insideRightTextureCropLeft:\s*0\.038/.test(games),
    "One on One lacks its calibrated texture-only crop");
assert(/folder:\s*["']bill_budge_pinball_construction_set["'][\s\S]{0,5000}?insideRightTextureCropLeft:\s*0\.043/.test(games),
    "Bill Budge lacks its calibrated texture-only crop");
const oneOnOneBlock = games.match(
    /folder:\s*["']one_on_one_erving_vs_bird["'][\s\S]*?(?=\n\s*\},\s*\n\s*\];)/
)?.[0] || "";
assert(!oneOnOneBlock.includes("legacyFoldLayout: true"),
    "One on One must use the corrected default fold layout");
for (const option of ["extendedTopTexture", "extendedBottomTexture", "foldSpineTexture"]) {
    const occurrences = games.match(new RegExp(`${option}:`, "g")) || [];
    assert(occurrences.length >= 2, `${option} must be configured for both extended flatpacks`);
}
assertExtendedTextures("hard_hat_mack");
assertExtendedTextures("one_on_one_erving_vs_bird");
assert(/folder:\s*["']7cities_of_gold_c64["'][\s\S]*?type:\s*["']flatpack["']/.test(games),
    "Seven Cities must remain a normal flatpack");
assert(pkg.includes('packageOptions.type === "extended-flatpack"'), "Package factory lacks extended-flatpack");
assert(pkg.includes("toggleExtension"), "Package API lacks toggleExtension");
assert(builder.includes("setInsideRightCrop"), "Extended builder lacks crop support");
assert(builder.includes("setExtensionActive(extension, false)"), "Primary-open state is not preserved");
assert(builder.includes("cassetteFrontZ"), "Extended builder lacks the 7-mm cassette geometry");
assert(builder.includes("closedFoldSign"), "Extended builder does not separate closed and opening rotations");
assert(builder.includes("updatePrimaryFoldRibbon"), "Extended builder lacks the attached fold spine");
assert(builder.includes("legacyFoldLayout"), "Extended builder lacks the Hard Hat Mack compatibility mode");
assert(builder.includes("insideRightRight.scaling.x = 1"),
    "Default fold layout still crops the complete inside_right_right artwork");
assert(builder.includes("configureOutsideOnlyPrimarySpine"),
    "Default fold layout does not hide the primary spine from the inside");
for (const [name, source] of [
    ["Retro Discovery", retroViewer],
    ["game detail", detailViewer],
    ["preview", previewViewer],
    ["gamebox", gameboxViewer]
]) {
    for (const image of ["insideRightRight", "extendedTop", "extendedBottom", "foldSpine"]) {
        assert(source.includes(image), `${name} viewer does not load ${image}`);
    }
}
assert(retroViewer.includes("package-extension-hint"), "Retro Discovery lacks extension control");
assert(detailViewer.includes("game-detail-viewer-extension"), "Game detail viewer lacks extension control");

const htmlFiles = [];
const collectHtml = (folder) => {
    for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
        const file = `${folder}/${entry.name}`;
        if (entry.isDirectory()) {
            if (!file.includes("/prototypes")) collectHtml(file);
        } else if (entry.name.endsWith(".html")) {
            htmlFiles.push(file);
        }
    }
};
collectHtml("spiele");
for (const file of htmlFiles) {
    const html = read(file);
    if (!html.includes("flatpack-builder.js")) continue;
    assert(html.includes("extended-flatpack-builder.js"), `${file} lacks the extended builder`);
    assert(
        html.indexOf("extended-flatpack-builder.js") < html.indexOf("package.js"),
        `${file} loads the extended builder after package.js`
    );
}

// Exercise the real production factory as well as the static wiring above.
// This catches type guards or constructor failures that otherwise only appear
// after an extended flatpack is selected in a browser.
const BABYLON = require("../assets/libs/babylon.js");
const runtime = {
    BABYLON,
    console,
    setTimeout,
    clearTimeout,
    addEventListener() {},
    removeEventListener() {}
};
runtime.window = runtime;
vm.createContext(runtime);
for (const file of [
    "retro-discovery/js/package-materials.js",
    "retro-discovery/js/package-builder.js",
    "retro-discovery/js/flatpack-builder.js",
    "retro-discovery/js/extended-flatpack-builder.js",
    "retro-discovery/js/package.js"
]) {
    vm.runInContext(read(file), runtime, { filename: file });
}

const engine = new BABYLON.NullEngine();
const scene = new BABYLON.Scene(engine);
const pixel = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL9WQAAAABJRU5ErkJggg==";
const runtimeImages = Object.fromEntries([
    "front", "back", "left", "right", "top", "bottom",
    "insideLeft", "insideRight", "insideMiddle", "insideRightRight",
    "extendedTop", "extendedBottom", "foldSpine"
].map((name) => [name, { src: pixel, naturalWidth: 100, naturalHeight: 100 }]));
const pivot = new BABYLON.TransformNode("extended-flatpack-test-pivot", scene);
const runtimePackage = runtime.Package.create(scene, pivot, {
    gameData: {
        package: {
            type: "extended-flatpack",
            spineTexture: "right",
            extendedFlatpack: {
                insideRightCropLeft: 0.029,
                insideRightTextureCropLeft: 0.043
            }
        }
    },
    game: {
        hasInside: true,
        width: 222,
        height: 222,
        depth: 7,
        images: runtimeImages
    }
});
assert(runtimePackage?.type === "extended-flatpack", "Production factory cannot construct an extended flatpack");
assert(runtimePackage?.extension, "Constructed extended flatpack lacks its extension geometry");
runtime.FlatpackBuilder.setOpenProgress(runtimePackage, 1);
runtimePackage.root.setEnabled(true);
runtime.ExtendedFlatpackBuilder.setPrimaryOpen(runtimePackage.extension, true);
assert(runtimePackage.extension.middle.isEnabled(),
    "Corrected layout does not keep inside_middle behind inside_right");
assert(runtimePackage.spineRibbon.material.backFaceCulling === true,
    "Corrected layout still renders the primary spine from both sides");
runtime.ExtendedFlatpackBuilder.setOpenProgress(runtimePackage.extension, 1);
assert(runtimePackage.extension.openAmount === 1, "Second opening cannot reach its fully extended state");
assert(runtimePackage.extension.insideRightRight.scaling.x === 1,
    "Corrected layout must retain the full inside_right_right width");
assert(runtimePackage.extension.cropLeft === 0.029,
    "Physical fold crop changed while applying a texture-only crop");
assert(runtimePackage.extension.textureCropLeft === 0.043,
    "Texture-only crop is not passed separately to the builder");

const legacyPivot = new BABYLON.TransformNode("legacy-extended-flatpack-test-pivot", scene);
const legacyPackage = runtime.Package.create(scene, legacyPivot, {
    gameData: {
        package: {
            type: "extended-flatpack",
            spineTexture: "right",
            extendedFlatpack: {
                insideRightCropLeft: 0.029,
                legacyFoldLayout: true
            }
        }
    },
    game: {
        hasInside: true,
        width: 222,
        height: 222,
        depth: 7,
        images: runtimeImages
    }
});
assert(legacyPackage.extension.legacyFoldLayout === true,
    "Hard Hat Mack compatibility mode is not passed to the builder");
assert(legacyPackage.extension.insideRightRight.scaling.x < 1,
    `Legacy layout no longer preserves its approved cropped reverse face (${legacyPackage.extension.insideRightRight.scaling.x})`);
runtime.FlatpackBuilder.setOpenProgress(legacyPackage, 1);
legacyPackage.root.setEnabled(true);
runtime.ExtendedFlatpackBuilder.setPrimaryOpen(legacyPackage.extension, true);
assert(!legacyPackage.extension.middle.isEnabled(),
    "Hard Hat Mack no longer preserves its approved first-open visibility");
assert(legacyPackage.spineRibbon.material.backFaceCulling === false,
    "Hard Hat Mack no longer preserves its approved two-sided primary spine");

console.log("Extended flatpack regression: OK");
