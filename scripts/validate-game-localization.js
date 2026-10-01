const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const projectRoot = path.resolve(__dirname,"..");
const gameSource = fs.readFileSync(path.join(projectRoot,"assets/js/game.js"),"utf8");
const localizationSource = fs.readFileSync(
    path.join(projectRoot,"assets/js/game-localization.js"),
    "utf8"
);

const context = {
    console,
    window:{},
    document:{
        documentElement:{ lang:"de" },
        addEventListener:()=>{}
    }
};
context.window.window = context.window;

vm.createContext(context);
vm.runInContext(`${gameSource}\n;globalThis.__GAMES__ = GAMES;`,context,{
    filename:"assets/js/game.js"
});
vm.runInContext(localizationSource,context,{
    filename:"assets/js/game-localization.js"
});

const games = context.__GAMES__;
const api = context.window.GameLocalization;
const projectReport = path.join(projectRoot,"reports/game-localization-report.txt");
const requireEnglish = process.argv.includes("--require-en");
const lines = [];
const issues = [];
const warnings = [];
const englishComplete = [];
let longLegacyTextBlocks = 0;
const seen = { id:new Map(), folder:new Map(), page:new Map() };
const germanWordPattern = /\b(?:ist|sind|wurde|wurden|wird|werden|das|die|der|eine|einen|einer|dieses|diese|mit|für|auch|noch|heute|spiel|spieler)\b/gi;

function label(game){
    return `${game.folder || "<folder missing>"} (id: ${game.id ?? "missing"})`;
}

function recordDuplicates(game,field){
    const value = game[field];
    if(value == null || value === "") return;
    if(seen[field].has(value)) issues.push(`${label(game)}: duplicate ${field} "${value}" (also ${seen[field].get(value)})`);
    else seen[field].set(value,label(game));
}

games.forEach(game=>{
    ["id","folder","page"].forEach(field=>recordDuplicates(game,field));
    if(!game.translations || typeof game.translations !== "object"){
        issues.push(`${label(game)}: translations object missing`);
        return;
    }
    if(!game.translations.en || typeof game.translations.en !== "object") issues.push(`${label(game)}: translations.en is not prepared`);

    const german = api.validateTranslation(game,"de");
    if(!german.complete) issues.push(`${label(game)} [DE]: missing ${german.missing.join(", ")}`);

    const english = api.validateTranslation(game,"en");
    if(english.complete) englishComplete.push(game.folder);
    else if(requireEnglish) issues.push(`${label(game)} [EN]: missing ${english.missing.join(", ")}`);

    const englishValues = [
        game.translations.en?.description,
        game.translations.en?.history,
        game.translations.en?.review,
        game.translations.en?.worthPlaying,
        ...(game.translations.en?.trivia || [])
    ];
    englishValues.forEach((value,index)=>{
        const matches = String(value || "").match(germanWordPattern) || [];
        if(matches.length >= 3){
            warnings.push(`${label(game)}: possible mixed German text in EN content block ${index+1} (${matches.slice(0,5).join(", ")})`);
        }
    });

    const de = game.translations.de;
    ["description","history","review","worthPlaying"].forEach(field=>{
        ["de","en"].forEach(language=>{
            const value = game.translations?.[language]?.[field];
            if(value != null && !api.isTextContent(value)){
                issues.push(`${label(game)} [${language.toUpperCase()}]: ${field} must be a string or a non-empty paragraph array`);
            }
            if(typeof value === "string" && value.length >= 650 && !/\r?\n\s*\r?\n/.test(value)){
                longLegacyTextBlocks += 1;
            }
        });
    });
    if(de && !Array.isArray(de.trivia)) warnings.push(`${label(game)}: DE trivia is not an array`);
    if(Array.isArray(de?.trivia) && de.trivia.length === 0) warnings.push(`${label(game)}: DE trivia is empty`);
    if(/[ÃÂâ€žâ€œâ€“â€”]/.test(JSON.stringify(de || {}))) warnings.push(`${label(game)}: possible character-encoding artifacts in DE content`);
});

const germanFailures = issues.filter(item=>item.includes("[DE]")).length;
lines.push("GAME LOCALIZATION REPORT");
lines.push(`Generated: ${new Date().toISOString()}`);
lines.push("");
lines.push(`Games checked: ${games.length}`);
lines.push(`German translations complete: ${games.length-germanFailures}/${games.length}`);
lines.push(`English translations complete: ${englishComplete.length}/${games.length}`);
lines.push(`English placeholders prepared: ${games.filter(game=>game.translations?.en && typeof game.translations.en === "object").length}/${games.length}`);
lines.push(`Long legacy text blocks using automatic paragraph grouping: ${longLegacyTextBlocks}`);
lines.push(`Errors: ${issues.length}`);
lines.push(`Warnings: ${warnings.length}`);
lines.push("");
lines.push("COMPLETE ENGLISH ENTRIES");
lines.push(...(englishComplete.length ? englishComplete.map(folder=>`- ${folder}`) : ["- none"]));
lines.push("");
lines.push("ERRORS");
lines.push(...(issues.length ? issues.map(issue=>`- ${issue}`) : ["- none"]));
lines.push("");
lines.push("WARNINGS / UNUSUAL GERMAN DATA");
lines.push(...(warnings.length ? warnings.map(warning=>`- ${warning}`) : ["- none"]));
lines.push("");

fs.mkdirSync(path.dirname(projectReport),{ recursive:true });
fs.writeFileSync(projectReport,`${lines.join("\n")}\n`,"utf8");
console.log(lines.slice(0,9).join("\n"));
console.log(`\nDetailed report: ${path.relative(projectRoot,projectReport)}`);
if(issues.length) process.exitCode = 1;
