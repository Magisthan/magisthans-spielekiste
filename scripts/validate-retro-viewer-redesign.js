const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname,"..");
const read = relativePath => fs.readFileSync(path.join(root,relativePath),"utf8");
const exists = relativePath => fs.existsSync(path.join(root,relativePath));
const errors = [];

function expect(condition,message){
    if(!condition) errors.push(message);
}

function count(source,needle){
    return source.split(needle).length - 1;
}

const index = read("retro-discovery/index.html");
const viewer = read("retro-discovery/js/viewer.js");
const controller = read("retro-discovery/js/viewer-ui-controller.js");
const content = read("retro-discovery/js/viewer-content.js");
const contribution = read("retro-discovery/js/community.js");
const app = read("retro-discovery/js/app.js");
const redesignCss = read("retro-discovery/css/viewer-redesign.css");
const responsiveCss = read("retro-discovery/css/responsive.css");
const viewerCss = read("retro-discovery/css/viewer.css");

const requiredIds = [
    "viewer-stage",
    "viewer3d",
    "viewer-redesign-shell",
    "viewer-redesign-interactions",
    "viewer-contents-button",
    "viewer-compact-info-button",
    "viewer-contribute-button",
    "viewer-redesign-overlay",
    "viewer-overlay-close",
    "viewer-game-title",
    "fullscreen-btn",
    "scan-contribution-dialog",
    "editorial-dialog"
];

for(const id of requiredIds){
    expect(count(index,`id="${id}"`) === 1,`Expected exactly one #${id}`);
}

const retiredIds = [
    "community-panel",
    "viewer-info-panel",
    "viewer-actions",
    "viewer-mobile-panels",
    "viewer-info-btn",
    "rating-modal"
];

for(const id of retiredIds){
    expect(!index.includes(`id="${id}"`),`Retired element #${id} is still present`);
}

const requiredAssets = [
    "retro-discovery/css/viewer-redesign.css",
    "retro-discovery/css/scan-dialog.css",
    "retro-discovery/js/viewer-ui-controller.js",
    "retro-discovery/js/viewer-content.js",
    "retro-discovery/js/community.js"
];

for(const asset of requiredAssets){
    expect(exists(asset),`Missing ${asset}`);
}

expect(!index.includes("css/community.css"),"Retired community.css is still loaded");
expect(!index.includes("js/rating-dialog.js"),"Retired rating-dialog.js is still loaded");

const activeSources = [viewer,controller,content,contribution].join("\n");
for(const symbol of ["hideCommunity(","showCommunity(","addCommunityRating("]){
    expect(!activeSources.includes(symbol),`Retired call ${symbol} remains in active JavaScript`);
}

expect(controller.includes('state.enabled = true'),"Viewer redesign is not enabled");
expect(controller.includes('openOverlay("info")'),"INFO overlay trigger is not wired");
expect(controller.includes("ScanContributionDialog?.open"),"Contribution dialog API is not wired");
expect(content.includes('setPresentationMode("contents")'),"Contents presentation is not wired");
expect(content.includes('document.getElementById("viewer-redesign-shell")'),"Contents outside-click handler is missing");
expect(viewer.includes("requestFullscreen"),"Fullscreen entry is not wired");
expect(viewer.includes("updateFullscreenButtonState"),"Fullscreen state synchronization is missing");
expect(!viewer.includes('container:document.getElementById("viewer-stage")'),"Visible zoom buttons are still requested by the Retro Discovery viewer");
expect(app.includes('"Atari 800"'),"Atari 800 is missing from the Atari discovery filter group");
expect(redesignCss.includes("#viewer-stage:fullscreen"),"Fullscreen layout rules are missing");
expect(redesignCss.includes("@media (max-width:768px)"),"Mobile viewer rules are missing");
expect(
    /--viewer-info-offset-y:\s*\d+(?:\.\d+)?px/.test(redesignCss),
    "Manual INFO vertical offset is missing"
);
expect(
    redesignCss.includes('.viewer-redesign-shell[data-presentation-mode="contents"]'),
    "Contents mode does not hide the compact viewer controls"
);
expect(responsiveCss.includes("aspect-ratio:2100 / 1140"),"Expanded desktop viewer ratio is missing");
expect(!viewerCss.includes("border-image-slice"),"Obsolete nine-slice chassis rendering is still active");
expect(responsiveCss.includes("bottom:20.2%"),"Viewer canvas is not aligned to the new chassis opening");

for(const file of [
    "retro-discovery/css/viewer.css",
    "retro-discovery/css/responsive.css",
    "retro-discovery/css/viewer-redesign.css",
    "retro-discovery/css/scan-dialog.css"
]){
    const css = read(file);
    expect(count(css,"{") === count(css,"}"),`Unbalanced braces in ${file}`);
}

console.log("RETRO VIEWER REDESIGN REGRESSION AUDIT");
console.log(`Required UI targets: ${requiredIds.length}`);
console.log(`Retired UI targets checked: ${retiredIds.length}`);
console.log(`Errors: ${errors.length}`);

if(errors.length){
    for(const error of errors) console.error(`- ${error}`);
    process.exitCode = 1;
}else{
    console.log("Result: PASS");
}
