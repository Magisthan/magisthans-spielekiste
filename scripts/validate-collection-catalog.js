const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname,"..");
const catalogPath = path.join(root,"data","collection-catalog.js");
const reportPath = path.join(root,"reports","collection-catalog-validation.txt");
const source = fs.readFileSync(catalogPath,"utf8");
const sandbox = { window:{} };
vm.runInNewContext(source,sandbox,{ filename:catalogPath });

const catalog = sandbox.window.COLLECTION_CATALOG;
const allowedCollections = new Set(["c64","amiga","pc"]);
const allowedPlatforms = {
    c64:new Set(["Commodore 64","Commodore 16","Apple II","Atari","Atari ST","Atari XL","Atari 8-bit","ZX Spectrum"]),
    amiga:new Set(["Amiga","Amiga CD32","Amiga CDTV"]),
    pc:new Set(["PC","MS-DOS","PC/Mac"])
};
const errors = [];
const warnings = [];
const ids = new Set();
const currentYear = new Date().getFullYear() + 1;

function normalize(value){
    return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g,"")
        .replace(/&/g," and ")
        .replace(/[^a-zA-Z0-9]+/g," ")
        .trim()
        .toLowerCase();
}

function systemFamily(system){
    const value = normalize(system);
    if(/commodore 64|\bc64\b|commodore 16/.test(value)) return "c64";
    if(/amiga|cd32|cdtv/.test(value)) return "amiga";
    if(/\bpc\b|dos|windows/.test(value)) return "pc";
    return "";
}

if(!Array.isArray(catalog)) errors.push("COLLECTION_CATALOG ist kein Array.");
else catalog.forEach((entry,index)=>{
    const label = `Eintrag ${index + 1}`;
    if(!entry?.id) errors.push(`${label}: ID fehlt.`);
    else if(ids.has(entry.id)) errors.push(`${label}: doppelte ID ${entry.id}.`);
    else ids.add(entry.id);
    if(!String(entry?.title || "").trim()) errors.push(`${label}: Titel fehlt.`);
    if(!allowedCollections.has(entry?.collection)) errors.push(`${label}: unbekannte Sammlung ${entry?.collection}.`);
    if(entry?.platform && !allowedPlatforms[entry.collection]?.has(entry.platform)){
        warnings.push(`${entry.id}: unbekanntes System ${entry.platform}.`);
    }
    if(entry?.year === null){
        warnings.push(`${entry.id}: Jahr fehlt oder wurde beim Import verworfen.`);
    }else if(!Number.isInteger(entry.year) || entry.year < 1970 || entry.year > currentYear){
        errors.push(`${entry.id}: ungültiges Jahr ${entry.year}.`);
    }
});

const counts = Object.fromEntries([...allowedCollections].map(collection=>[
    collection,
    Array.isArray(catalog) ? catalog.filter(entry=>entry.collection === collection).length : 0
]));
const gamePath = path.join(root,"assets","js","game.js");
const gameSandbox = {};
vm.runInNewContext(
    `${fs.readFileSync(gamePath,"utf8")}\n;globalThis.__GAMES = GAMES;`,
    gameSandbox,
    { filename:gamePath }
);
const pageIndex = new Set(gameSandbox.__GAMES
    .filter(game=>game?.page && game?.title && systemFamily(game.system))
    .map(game=>`${systemFamily(game.system)}:${normalize(game.title)}`));
const linkedEntries = Array.isArray(catalog)
    ? catalog.filter(entry=>pageIndex.has(`${entry.collection}:${normalize(entry.title)}`)).length
    : 0;
const lines = [
    "COLLECTION CATALOG VALIDATION",
    `Generated: ${new Date().toISOString()}`,
    "",
    `Entries: ${Array.isArray(catalog) ? catalog.length : 0}`,
    `C64: ${counts.c64}`,
    `Amiga: ${counts.amiga}`,
    `PC: ${counts.pc}`,
    `Entries linked to game pages: ${linkedEntries}`,
    `Errors: ${errors.length}`,
    `Warnings: ${warnings.length}`,
    "",
    ...errors.map(message=>`ERROR: ${message}`),
    ...warnings.map(message=>`WARNING: ${message}`)
];
fs.mkdirSync(path.dirname(reportPath),{ recursive:true });
fs.writeFileSync(reportPath,lines.join("\n") + "\n","utf8");
console.log(lines.slice(0,10).join("\n"));
console.log(`Detailed report: ${path.relative(root,reportPath)}`);
if(errors.length) process.exitCode = 1;
