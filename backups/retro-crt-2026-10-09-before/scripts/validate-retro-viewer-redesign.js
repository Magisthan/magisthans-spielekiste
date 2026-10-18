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
const reactions = read("retro-discovery/js/reaction-store.js");
const topDiscoveries = read("retro-discovery/js/top-discoveries.js");
const app = read("retro-discovery/js/app.js");
const redesignCss = read("retro-discovery/css/viewer-redesign.css");
const responsiveCss = read("retro-discovery/css/responsive.css");
const carouselCss = read("retro-discovery/css/carousel.css");
const viewerCss = read("retro-discovery/css/viewer.css");
const i18nDe = read("assets/js/i18n/ui.de.js");
const i18nEn = read("assets/js/i18n/ui.en.js");

const requiredIds = [
    "viewer-stage",
    "viewer3d",
    "viewer-scanlines-layer",
    "viewer-presentation-modes",
    "viewer-redesign-shell",
    "viewer-redesign-interactions",
    "viewer-contents-button",
    "viewer-compact-info-button",
    "viewer-contribute-button",
    "viewer-reaction-like-percent",
    "viewer-reaction-dislike-percent",
    "viewer-reaction-total",
    "viewer-redesign-overlay",
    "viewer-overlay-close",
    "viewer-game-title",
    "fullscreen-btn",
    "viewer-contribution-overlay",
    "editorial-dialog"
];

for(const id of requiredIds){
    expect(count(index,`id="${id}"`) === 1,`Expected exactly one #${id}`);
}

for(const className of ["viewer-reaction-options","viewer-reaction-results"]){
    expect(count(index,`class="${className}`) === 1,`Expected exactly one .${className}`);
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
    "retro-discovery/js/reaction-store.js",
    "retro-discovery/js/viewer-ui-controller.js",
    "retro-discovery/js/viewer-content.js",
    "retro-discovery/js/viewer-scanlines.js",
    "retro-discovery/js/viewer-presentation-modes.js",
    "retro-discovery/assets/icons/box-contents.svg",
    "retro-discovery/assets/icons/info.svg",
    "retro-discovery/assets/icons/contribute.svg"
];

for(const asset of requiredAssets){
    expect(exists(asset),`Missing ${asset}`);
}

expect(!index.includes("css/community.css"),"Retired community.css is still loaded");
expect(!index.includes("js/rating-dialog.js"),"Retired rating-dialog.js is still loaded");
expect(app.includes("buildDiscoveryResultGroup("),"Post-spin discovery result group is not wired");
expect(carouselCss.includes(".rd-reel-nav"),"Post-spin reel arrows are not styled");
expect(responsiveCss.includes("#mobile-spin-frame .rd-reel-nav"),"Mobile reel arrows are not styled");
expect(
    redesignCss.includes("#viewer-stage:fullscreen .viewer-redesign-overlay.is-open"),
    "Fullscreen overlays are not centered at content height"
);
expect(
    /#viewer-stage\.viewer-contents-active #viewer-container\s*\{[^}]*opacity:1/s.test(redesignCss),
    "The 3D box is hidden behind the contents presentation"
);
expect(controller.includes("REACTION_DISMISS_DELAY = 8000"),"Reaction results do not use the eight-second dismissal delay");
expect(controller.includes("scheduleReactionDismissAfterFlip"),"Reaction dismissal is not sequenced after the flip");
expect(redesignCss.includes(".viewer-reaction-panel.is-dismissed"),"Reaction panel has no non-collapsing dismissed state");
expect(redesignCss.includes(".viewer-scanlines-layer"),"Scanline layer styling is missing");
expect(index.includes('src="js/viewer-scanlines.js"'),"Scanline controller is not loaded");
expect(index.includes('role="group"'),"Accessible presentation mode group is missing");
expect(index.includes('data-viewer-mode="standard"'),"Standard presentation mode is missing");
expect(index.includes('data-viewer-mode="retro"'),"Retro presentation mode is missing");
expect(index.includes('data-viewer-mode="museum"'),"Museum presentation mode is missing");
expect(index.includes('src="js/viewer-presentation-modes.js"'),"Presentation mode controller is not loaded");
expect(viewer.includes("viewerLightingProfiles"),"Viewer lighting profiles are missing");
expect(viewer.includes('applyProfile:applyViewerLightingProfile'),"Viewer lighting profile API is missing");
expect(redesignCss.includes("#viewer-stage.viewer-museum-mode #viewer-background"),"Museum background styling is missing");

const activeSources = [viewer,controller,content,reactions,topDiscoveries].join("\n");
for(const symbol of ["hideCommunity(","showCommunity(","addCommunityRating("]){
    expect(!activeSources.includes(symbol),`Retired call ${symbol} remains in active JavaScript`);
}

expect(controller.includes('state.enabled = true'),"Viewer redesign is not enabled");
expect(controller.includes('openOverlay("info")'),"INFO overlay trigger is not wired");
expect(controller.includes('openOverlay("contribute")'),"Contribution overlay trigger is not wired");
expect(
    controller.includes('document.getElementById("viewer-contribution-email")'),
    "Contribution email link is not wired"
);
expect(content.includes('setPresentationMode("contents")'),"Contents presentation is not wired");
expect(!content.includes("button.textContent = inContents"),"Contents state update still removes the button icon");
expect(content.includes('button.querySelector("span")'),"Contents button label is not updated independently of its icon");
expect(index.includes('class="viewer-compact-action-icon"'),"Inline fallback for the contents icon is missing");
expect(index.indexOf("js/reaction-store.js") < index.indexOf("js/viewer-ui-controller.js"),"ReactionStore must load before the viewer controller");
expect(controller.includes("ReactionStore?.vote"),"Viewer reactions are not connected to ReactionStore");
expect(controller.includes('style.setProperty("--like-share"'),"Reaction distribution bar is not connected to the vote percentages");
expect(controller.includes("if(previous) return getSnapshot()"),"Viewer reaction UI does not lock after the first vote");
expect(reactions.includes("if(previousReaction) return normalize(record)"),"ReactionStore does not reject later vote changes");
expect(!index.includes('<button type="button" data-result-reaction='),"Reaction results are still interactive buttons");
expect(redesignCss.includes("rotateX(180deg)"),"Reaction result flip animation is missing");
expect(index.includes('class="viewer-reaction-card"'),"Reaction card wrapper is missing");
expect(index.includes('viewer-reaction-face viewer-reaction-front'),"Reaction front face is missing");
expect(index.includes('viewer-reaction-face viewer-reaction-back'),"Reaction back face is missing");
expect(redesignCss.includes(".viewer-reaction-panel[data-view=\"results\"] .viewer-reaction-card"),"The complete reaction card is not flipped");
expect(redesignCss.includes("perspective:1800px"),"Reaction flip does not use the Player Card perspective");
expect(redesignCss.includes("clip-path:inset(0 round 20px)"),"Reaction flip scene is not clipped to its rounded outline");
expect(redesignCss.includes("transition:transform .8s cubic-bezier(.23,.92,.32,1)"),"Reaction flip does not match the Player Card timing");
expect(redesignCss.includes(".viewer-reaction-front{\n    grid-template-columns:minmax(0,1fr) auto;\n    pointer-events:auto"),"Reaction front face does not accept pointer input");
expect(redesignCss.includes(".viewer-reaction-back{\n    transform:rotateX(180deg);\n    pointer-events:none"),"Hidden reaction back face can block the vote buttons");
expect(redesignCss.includes("viewer-thumb-wow-clone 1450ms"),"Independent thumb WOW animation is missing or too short");
expect(controller.includes('clone.classList.add("viewer-reaction-wow-clone")'),"Thumb WOW layer is not created independently from the locked button");
expect(controller.includes("pauseAfterAnimation = 420"),"Pause between thumb animation and result flip is missing");
expect(controller.includes('clone.addEventListener("animationend",completeAnimation'),"Result flip is not synchronized with the real animation end");
expect(topDiscoveries.includes("wilsonScore"),"Top Discoveries does not use Wilson ranking");
expect(topDiscoveries.includes("MIN_RANKING_VOTES = 5"),"Top Discoveries minimum vote threshold is missing");
expect(!topDiscoveries.includes("averageBoxdesign"),"Legacy averageBoxdesign is still active");
expect(!topDiscoveries.includes("recordRatingByFolder"),"Legacy rating recorder is still active");
expect(i18nDe.includes('"viewer.totalVotes"'),"German reaction total translation is missing");
expect(i18nEn.includes('"viewer.totalVotes"'),"English reaction total translation is missing");
expect(i18nDe.includes('"top.vote"') && i18nDe.includes('"top.votes"'),"German Top Discoveries vote translations are missing");
expect(i18nEn.includes('"top.vote"') && i18nEn.includes('"top.votes"'),"English Top Discoveries vote translations are missing");
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
expect(!index.includes("css/scan-dialog.css"),"Retired scan-dialog.css is still loaded");
expect(!index.includes("js/community.js"),"Retired community.js is still loaded");
expect(!redesignCss.includes("scan-dialog-open"),"Retired body scroll lock is still active");
expect(!exists("retro-discovery/css/scan-dialog.css"),"Retired scan-dialog.css still exists");
expect(!exists("retro-discovery/js/community.js"),"Retired community.js still exists");

for(const file of [
    "retro-discovery/css/viewer.css",
    "retro-discovery/css/responsive.css",
    "retro-discovery/css/viewer-redesign.css"
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
