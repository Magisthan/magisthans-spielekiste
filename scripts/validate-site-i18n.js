const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const catalogDir = path.join(root, "assets/js/i18n");
const reportFile = path.join(root, "reports/site-i18n-report.txt");
const errors = [];
const warnings = [];
const notes = [];

function relative(file) {
    return path.relative(root, file).replaceAll("\\", "/");
}

function read(file) {
    return fs.readFileSync(file, "utf8");
}

function walk(directory, extension, files = []) {
    fs.readdirSync(directory, { withFileTypes:true }).forEach(entry => {
        const full = path.join(directory, entry.name);
        if (entry.isDirectory()) walk(full, extension, files);
        else if (!extension || entry.name.endsWith(extension)) files.push(full);
    });
    return files;
}

function loadCatalog(file) {
    let language = null;
    let messages = null;
    const context = {
        SiteI18n:{
            registerTranslations(lang, values) {
                language = lang;
                messages = values;
            }
        }
    };
    vm.createContext(context);
    try {
        vm.runInContext(read(file), context, { filename:relative(file) });
    } catch (error) {
        errors.push(`${relative(file)}: catalog cannot be evaluated (${error.message})`);
    }
    return { language, messages:messages || {} };
}

const catalogFiles = fs.readdirSync(catalogDir)
    .filter(name => /\.(de|en)\.js$/.test(name))
    .map(name => path.join(catalogDir, name));
const catalogs = new Map();
const allKeys = new Set();

catalogFiles.forEach(file => {
    const match = path.basename(file).match(/^(.*)\.(de|en)\.js$/);
    const loaded = loadCatalog(file);
    if (!match || loaded.language !== match[2]) {
        errors.push(`${relative(file)}: filename and registered language do not match`);
        return;
    }
    catalogs.set(`${match[1]}.${match[2]}`, loaded.messages);
    Object.keys(loaded.messages).forEach(key => allKeys.add(key));

    const serialized = JSON.stringify(loaded.messages);
    if (/[ÃÂ]|â(?:€|™|œ|ž)/.test(serialized)) {
        warnings.push(`${relative(file)}: possible UTF-8/Windows-1252 encoding artifact`);
    }
});

const sourceKeyCatalogs = new Set(["editorial", "legal"]);
const catalogNames = new Set(catalogFiles.map(file => path.basename(file).replace(/\.(de|en)\.js$/, "")));
catalogNames.forEach(name => {
    const de = catalogs.get(`${name}.de`);
    const en = catalogs.get(`${name}.en`);
    if (!de || !en) {
        errors.push(`${name}: German/English catalog pair is incomplete`);
        return;
    }
    if (sourceKeyCatalogs.has(name)) return;

    const missingEn = Object.keys(de).filter(key => !(key in en));
    const missingDe = Object.keys(en).filter(key => !(key in de));
    if (missingEn.length) errors.push(`${name}.en: missing ${missingEn.length} keys: ${missingEn.join(", ")}`);
    if (missingDe.length) errors.push(`${name}.de: missing ${missingDe.length} keys: ${missingDe.join(", ")}`);
});

const rootPages = [
    "index.html", "sammlung.html", "retro-news-flash.html", "pixelkumpel.html",
    "ueber-mich.html", "impressum.html", "datenschutz.html"
];
rootPages.forEach(name => {
    const file = path.join(root, name);
    const html = read(file);
    if (!/site-bootstrap\.js/.test(html)) errors.push(`${name}: site-bootstrap.js is missing`);
    if (!/<meta\s+name=["']viewport["']/i.test(html)) errors.push(`${name}: responsive viewport meta tag is missing`);
});

const expectedPageCatalogs = {
    "index.html":"home",
    "sammlung.html":"collection",
    "retro-news-flash.html":"editorial",
    "pixelkumpel.html":"editorial",
    "ueber-mich.html":"editorial",
    "impressum.html":"legal",
    "datenschutz.html":"legal"
};
Object.entries(expectedPageCatalogs).forEach(([name, catalog]) => {
    const html = read(path.join(root, name));
    const match = html.match(/data-i18n-catalogs=["']([^"']+)["']/);
    const assigned = (match?.[1] || "").split(",").map(value => value.trim());
    if (!assigned.includes(catalog)) errors.push(`${name}: page catalog "${catalog}" is not assigned`);
});

const gameContext = { console };
vm.createContext(gameContext);
vm.runInContext(`${read(path.join(root, "assets/js/game.js"))}\n;globalThis.__GAMES__ = GAMES;`, gameContext, {
    filename:"assets/js/game.js"
});
const registeredPageNames = new Set(gameContext.__GAMES__.map(game => game.page).filter(Boolean));
const allGamePages = walk(path.join(root, "spiele"), ".html");
const gamePages = allGamePages.filter(file => registeredPageNames.has(path.basename(file)));
const orphanPages = allGamePages.filter(file => !registeredPageNames.has(path.basename(file)));
orphanPages.forEach(file => warnings.push(`${relative(file)}: HTML page is not registered in game.js`));
registeredPageNames.forEach(page => {
    if (!fs.existsSync(path.join(root, "spiele", page))) errors.push(`assets/js/game.js: page "spiele/${page}" does not exist`);
});
gamePages.forEach(file => {
    const html = read(file);
    if (!/site-bootstrap\.js/.test(html)) errors.push(`${relative(file)}: site-bootstrap.js is missing`);
    if (!/data-i18n-catalogs=["'][^"']*game-page/.test(html)) errors.push(`${relative(file)}: game-page catalog is missing`);
    if (!/<meta\s+name=["']viewport["']/i.test(html)) errors.push(`${relative(file)}: responsive viewport meta tag is missing`);
});

const htmlFiles = rootPages.map(name => path.join(root, name)).concat(gamePages);
const attributePattern = /data-i18n(?:-html|-aria-label|-title|-placeholder|-alt|-value|-content)?=["']([^"']+)["']/g;
htmlFiles.forEach(file => {
    const html = read(file);
    let match;
    while ((match = attributePattern.exec(html))) {
        if (!allKeys.has(match[1])) errors.push(`${relative(file)}: unknown translation key "${match[1]}"`);
    }
});

const germanSignals = [
    /\b(?:zurück|schließen|abbrechen|bewerten|bewertungen|sammlung|spielspaß|entwickler|verleger)\b/i,
    /\b(?:jetzt|keine|noch kein|wird geladen|durchsuchen|erinnerungen anzeigen)\b/i
];
catalogs.forEach((messages, id) => {
    if (!id.endsWith(".en")) return;
    Object.entries(messages).forEach(([key, value]) => {
        if (typeof value !== "string") return;
        if (germanSignals.some(pattern => pattern.test(value))) {
            warnings.push(`${id} [${key}]: possible German text in English value: "${value}"`);
        }
    });
});

const css = [
    read(path.join(root, "assets/css/style.css")),
    read(path.join(root, "assets/css/game-archive-navigation.css"))
].join("\n");
const responsiveChecks = [
    ["language selector styles", /\.site-language-selector\s*\{/],
    ["language selector mobile rule", /@media[^\{]*max-width[\s\S]*?\.site-language-selector\s*\{/],
    ["legal text wrapping", /\.legal-content\s*\{[^}]*overflow-wrap\s*:\s*anywhere/s],
    ["game page mobile navigation", /@media[^\{]*max-width[\s\S]*?\.game-archive-navigation/s]
];
responsiveChecks.forEach(([label, pattern]) => {
    if (!pattern.test(css)) warnings.push(`Responsive CSS: ${label} was not detected`);
});

const retroHtml = read(path.join(root, "retro-discovery/index.html"));
if (!/retro-discovery\/js\/i18n\.js|js\/i18n\.js/.test(retroHtml)) {
    errors.push("retro-discovery/index.html: Retro Discovery i18n module is not loaded");
}
const retroI18n = read(path.join(root, "retro-discovery/js/i18n.js"));
if (!/window\.RDI18n\s*=\s*window\.SiteI18n/.test(retroI18n)) {
    errors.push("retro-discovery/js/i18n.js: connection to the shared SiteI18n core could not be verified");
}

notes.push(`${catalogFiles.length} site catalogs evaluated`);
notes.push(`${htmlFiles.length} localized main-site HTML pages checked (${gamePages.length} game pages)`);
notes.push(`${orphanPages.length} unregistered HTML game pages found`);
notes.push(`${allKeys.size} registered translation keys found`);
notes.push("Responsive check is structural; final pixel-level inspection still requires an available browser");

const lines = [
    "SITE I18N AND RESPONSIVE AUDIT",
    `Generated: ${new Date().toISOString()}`,
    "",
    `Catalog files: ${catalogFiles.length}`,
    `Localized HTML pages: ${htmlFiles.length}`,
    `Translation keys: ${allKeys.size}`,
    `Errors: ${errors.length}`,
    `Warnings: ${warnings.length}`,
    "",
    "NOTES",
    ...notes.map(note => `- ${note}`),
    "",
    "ERRORS",
    ...(errors.length ? errors.map(error => `- ${error}`) : ["- none"]),
    "",
    "WARNINGS",
    ...(warnings.length ? warnings.map(warning => `- ${warning}`) : ["- none"]),
    ""
];

fs.mkdirSync(path.dirname(reportFile), { recursive:true });
fs.writeFileSync(reportFile, lines.join("\n"), "utf8");
console.log(lines.slice(0, 9).join("\n"));
console.log(`\nDetailed report: ${relative(reportFile)}`);
if (errors.length) process.exitCode = 1;
