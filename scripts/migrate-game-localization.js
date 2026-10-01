const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const projectRoot = path.resolve(__dirname,"..");
const gameFile = path.join(projectRoot,"assets/js/game.js");
const source = fs.readFileSync(gameFile,"utf8");

function structuralMask(text){
    const chars = [...text];
    let state = "code";
    let escaped = false;
    for(let index=0; index<chars.length; index+=1){
        const char = chars[index];
        const next = chars[index+1];
        if(state === "line-comment"){
            if(char === "\n") state = "code";
            else chars[index] = " ";
            continue;
        }
        if(state === "block-comment"){
            if(char === "*" && next === "/"){
                chars[index] = chars[index+1] = " ";
                index+=1;
                state = "code";
            }else if(char !== "\n" && char !== "\r") chars[index] = " ";
            continue;
        }
        if(state !== "code"){
            if(escaped) escaped = false;
            else if(char === "\\") escaped = true;
            else if((state === "single" && char === "'") || (state === "double" && char === '"') || (state === "template" && char === "`")) state = "code";
            if(char !== "\n" && char !== "\r") chars[index] = " ";
            continue;
        }
        if(char === "/" && next === "/"){
            chars[index] = chars[index+1] = " "; index+=1; state = "line-comment";
        }else if(char === "/" && next === "*"){
            chars[index] = chars[index+1] = " "; index+=1; state = "block-comment";
        }else if(char === "'"){
            chars[index] = " "; state = "single";
        }else if(char === '"'){
            chars[index] = " "; state = "double";
        }else if(char === "`"){
            chars[index] = " "; state = "template";
        }else if(!"{}[](),;".includes(char) && char !== "\n" && char !== "\r") chars[index] = " ";
    }
    return chars.join("");
}

function gameObjectRanges(text){
    const mask = structuralMask(text);
    const declaration = text.indexOf("const GAMES");
    const arrayStart = mask.indexOf("[",declaration);
    const ranges = [];
    let squareDepth = 0;
    let braceDepth = 0;
    let objectStart = -1;
    for(let index=arrayStart; index<mask.length; index+=1){
        const char = mask[index];
        if(char === "[") squareDepth+=1;
        else if(char === "]"){
            squareDepth-=1;
            if(squareDepth === 0) break;
        }else if(char === "{"){
            if(squareDepth === 1 && braceDepth === 0) objectStart = index;
            braceDepth+=1;
        }else if(char === "}"){
            braceDepth-=1;
            if(squareDepth === 1 && braceDepth === 0 && objectStart >= 0){
                ranges.push({ start:objectStart, end:index+1 });
                objectStart = -1;
            }
        }
    }
    return ranges;
}

function serializeTranslation(game){
    const german = {};
    ["description","history","review","trivia","worthPlaying"].forEach(field=>{
        if(Object.prototype.hasOwnProperty.call(game,field)) german[field] = game[field];
    });
    if(Array.isArray(game.screenshots) && game.screenshots.length){
        german.screenshotCaptions = Object.fromEntries(
            game.screenshots.filter(item=>item && item.file).map(item=>[item.file,item.caption ?? ""])
        );
    }
    const json = JSON.stringify({ de:german, en:{} },null,4);
    return json.split("\n").map((line,index)=>index ? `        ${line}` : line).join("\n");
}

const context = {};
vm.createContext(context);
vm.runInContext(`${source}\n;globalThis.__GAMES__ = GAMES;`,context,{ filename:"assets/js/game.js" });
const games = context.__GAMES__;
const ranges = gameObjectRanges(source);
if(ranges.length !== games.length) throw new Error(`Found ${ranges.length} object blocks, but game.js contains ${games.length} games.`);

const insertions = [];
games.forEach((game,index)=>{
    if(game.translations) return;
    insertions.push({ position:ranges[index].start+1, block:`\n        translations: ${serializeTranslation(game)},` });
});

let migrated = source;
insertions.sort((a,b)=>b.position-a.position).forEach(({ position,block })=>{
    migrated = migrated.slice(0,position)+block+migrated.slice(position);
});
fs.writeFileSync(gameFile,migrated,"utf8");
console.log(`Prepared translations.de and translations.en for ${insertions.length} games.`);

