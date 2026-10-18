const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname,"..");
const read = relativePath => fs.readFileSync(path.join(root,relativePath),"utf8");
const errors = [];
const expect = (condition,message) => { if(!condition) errors.push(message); };

const app = read("retro-discovery/js/app.js");
const navigation = read("retro-discovery/js/navigation.js");
const renderer = read("retro-discovery/js/slotrenderer.js");
const carouselCss = read("retro-discovery/css/carousel.css");
const responsiveCss = read("retro-discovery/css/responsive.css");

const shuffleMatch = app.match(/function shuffleDiscoveryPool[\s\S]*?\r?\n}\r?\n\r?\nfunction finalizeDiscoveryResultGroup/);
expect(Boolean(shuffleMatch),"shuffleDiscoveryPool helper is missing");

if(shuffleMatch){
    const shuffleSource = `${shuffleMatch[0].replace(/\r?\n\r?\nfunction finalizeDiscoveryResultGroup$/,"\n")}\nthis.shuffleDiscoveryPool = shuffleDiscoveryPool;`;
    const shuffleContext = { Math };
    vm.createContext(shuffleContext);
    vm.runInContext(shuffleSource,shuffleContext);

    const sourceGames = Array.from({ length:8 },(_,index)=>({ id:index + 1 }));
    const sourceOrder = sourceGames.map(game=>game.id).join(",");
    const values = [0.11,0.78,0.32,0.94,0.27,0.61,0.45];
    let valueIndex = 0;
    const shuffled = shuffleContext.shuffleDiscoveryPool(sourceGames,()=>values[valueIndex++ % values.length]);

    expect(sourceGames.map(game=>game.id).join(",") === sourceOrder,"Shuffling must not mutate the filtered session pool");
    expect(shuffled.map(game=>game.id).join(",") !== sourceOrder,"Every spin must use a freshly shuffled order");
    expect(new Set(shuffled.map(game=>game.id)).size === sourceGames.length,"Shuffling must retain every eligible game exactly once");
}

const helperMatch = app.match(/function buildDiscoveryResultGroup[\s\S]*?\r?\n}\r?\n\r?\nfunction finalizeDiscoveryResultGroup/);
expect(Boolean(helperMatch),"buildDiscoveryResultGroup helper is missing");

if(helperMatch){
    const helperSource = `${helperMatch[0].replace(/\r?\n\r?\nfunction finalizeDiscoveryResultGroup$/,"\n")}\nthis.buildDiscoveryResultGroup = buildDiscoveryResultGroup;`;
    const context = {};
    vm.createContext(context);
    vm.runInContext(helperSource,context);

    const games = Array.from({ length:12 },(_,index)=>({ id:index + 1,title:`Game ${index + 1}` }));
    const winnerIndex = 7;
    const deck = context.buildDiscoveryResultGroup(games,winnerIndex);

    expect(deck[2] === games[winnerIndex],"The independently selected spin winner must remain centered in the five-game group");
    expect(deck.length === 5,"A spin must expose exactly five games");
    expect(new Set(deck.map(game=>game.id)).size === 5,"The five-game group must not contain duplicates");
    expect(deck.every(game=>games.includes(game)),"The five-game group may only contain filtered games");

    const wrappedDeck = context.buildDiscoveryResultGroup(games,0);
    expect(wrappedDeck.map(game=>game.id).join(",") === "11,12,1,2,3","The visible group must wrap cleanly at the spin-pool boundary");
}

const spinSource = app.slice(app.indexOf("function spinDiscovery()"),app.indexOf("Discovery Filter",app.indexOf("function spinDiscovery()")));
expect(
    spinSource.indexOf("const selectedGame = selectDiscoveryGame()") < spinSource.indexOf("visibleGames = shuffleDiscoveryPool(discoverySession.games)"),
    "The fair random winner must be selected from the filtered pool before spinning"
);
expect(app.includes("visibleGames = shuffleDiscoveryPool(discoverySession.games)"),"The complete filtered pool must be shuffled before every spin");
expect(navigation.includes("finalizeDiscoveryResultGroup(targetIndex)"),"The five-game group must be created only after the reel locks");
expect(navigation.includes("setDiscoveryBrowseEnabled(false)"),"A new spin must disable browse navigation");
expect(navigation.includes("setDiscoveryBrowseEnabled(true)"),"A completed spin must enable browse navigation");
expect(navigation.includes("Math.max(-2,Math.min(2"),"Neighbour selection must be limited to two positions");
expect(navigation.includes("wrapVisibleGameIndex(currentGameIndex + steps)"),"Browse navigation must cycle inside the five-game group");
expect(!navigation.includes("Math.max(0,Math.min(visibleGames.length - 1"),"Browse navigation must not stop at the five-game group boundaries");
expect(navigation.includes('document.addEventListener("reelnavigate"'),"Arrow navigation event is not connected");
expect(navigation.includes('document.addEventListener("reelslotactivate"'),"Clickable neighbour event is not connected");
expect(renderer.includes("createBrowseControls()"),"SlotRenderer browse controls are missing");
expect(renderer.includes('slot.position === CENTER_SLOT - 1 || slot.position === CENTER_SLOT + 1'),"Mobile must expose only its two visible neighbours");
expect(carouselCss.includes(".rd-reel-nav"),"Desktop browse-control styling is missing");
expect(responsiveCss.includes("#mobile-spin-frame .rd-reel-nav"),"Mobile browse-control styling is missing");

if(errors.length){
    console.error(`Discovery navigation test failed (${errors.length}):`);
    errors.forEach(error=>console.error(`- ${error}`));
    process.exit(1);
}

console.log("Discovery navigation test passed.");
