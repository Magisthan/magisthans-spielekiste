const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const projectRoot = path.resolve(__dirname,"..");
const gamesSource = fs.readFileSync(path.join(projectRoot,"assets/js/game.js"),"utf8");
const context = { console };
vm.createContext(context);
vm.runInContext(`${gamesSource}\n;globalThis.__GAMES__ = GAMES;`,context,{
    filename:"assets/js/game.js"
});

const games = context.__GAMES__;
const pages = new Map();
games.forEach(game=>{
    if(!game.page) return;
    const list = pages.get(game.page) || [];
    list.push(game);
    pages.set(game.page,list);
});

const write = process.argv.includes("--write");
const report = { eligible:[], changed:[], unchanged:[], ambiguous:[], missing:[], incompatible:[] };

function addAttribute(html,selectorPattern,attribute){
    return html.replace(selectorPattern,(match,start,end)=>{
        if(match.includes(attribute.split("=")[0])) return match;
        return `${start} ${attribute}${end}`;
    });
}

function migrate(html){
    let next = html;

    if(!next.includes('../assets/js/i18n/site-bootstrap.js')){
        next = next.replace(
            "</head>",
            '<script defer src="../assets/js/i18n/site-bootstrap.js"></script>\n</head>'
        );
    }

    next = next.replace(
        /<body(?:\s+data-i18n-catalogs="[^"]*")?>/,
        '<body data-i18n-catalogs="game-page">'
    );

    if(!next.includes('../assets/js/game-localization.js')){
        next = next.replace(
            '<script src="../assets/js/game.js"></script>',
            '<script src="../assets/js/game.js"></script><script src="../assets/js/game-localization.js"></script>'
        );
    }

    const simpleBindings = [
        ["<strong>Entwickler:</strong>",'<strong data-i18n="gamePage.developer">Entwickler:</strong>'],
        ["<strong>Publisher:</strong>",'<strong data-i18n="gamePage.publisher">Publisher:</strong>'],
        ["<strong>Genre:</strong>",'<strong data-i18n="gamePage.genre">Genre:</strong>'],
        ["<strong>System:</strong>",'<strong data-i18n="gamePage.system">System:</strong>'],
        ["<strong>Erscheinungsjahr:</strong>",'<strong data-i18n="gamePage.year">Erscheinungsjahr:</strong>'],
        ["<h2>📖 Geschichte des Spiels</h2>",'<h2 data-i18n="gamePage.history">📖 Geschichte des Spiels</h2>'],
        ['<div class="review-name">Magisthan meint</div>','<div class="review-name" data-i18n="gamePage.reviewBy">Magisthan meint</div>'],
        ['<div class="review-content"><h2>Meine persönliche Wertung</h2>','<div class="review-content"><h2 data-i18n="gamePage.review">Meine persönliche Wertung</h2>'],
        ["<h2>💡 Trivia und interessante Fakten</h2>",'<h2 data-i18n="gamePage.trivia">💡 Trivia und interessante Fakten</h2>'],
        ["<h2>📦 Die Box in 3D</h2>",'<h2 data-i18n="gamePage.box3d">📦 Die Box in 3D</h2>'],
        ["<h2>🏆 Warum das Spiel heute noch spielenswert ist</h2>",'<h2 data-i18n="gamePage.worthPlaying">🏆 Warum das Spiel heute noch spielenswert ist</h2>'],
        ['<div class="game-detail-viewer-loading" role="status">','<div class="game-detail-viewer-loading" role="status" data-i18n="viewer.loading">'],
        ["<span>Linke Taste: Drehen</span>",'<span data-i18n="viewer.rotate">Linke Taste: Drehen</span>'],
        ["<span>Mausrad: Zoomen</span>",'<span data-i18n="viewer.zoom">Rechte Taste: Zoomen</span>'],
        ["<span>Rechte Taste: Ziehen zum Zoomen</span>",'<span data-i18n="viewer.zoom">Rechte Taste: Zoomen</span>']
    ];
    simpleBindings.forEach(([before,after])=>{ next = next.replaceAll(before,after); });

    next = next.replace(
        /<div\s+class="review-name"(?![^>]*data-i18n)[^>]*>/g,
        '<div class="review-name" data-i18n="gamePage.reviewBy">'
    );
    next = next.replace(
        /(<div\s+class="review-content"[^>]*>\s*<h2)(?![^>]*data-i18n)(>)/g,
        '$1 data-i18n="gamePage.review"$2'
    );

    next = addAttribute(next,/(<a id="game-letsplay"[^>]*)(>)/g,'data-i18n="gamePage.letsPlay"');
    next = next.replace(/(<a id="game-letsplay"[^>]*>)[^<]*(<\/a>)/g,'$1▶ Let\'s Play ansehen$2');
    next = addAttribute(next,/(<button\b(?=[^>]*class="game-detail-viewer-open")[^>]*)(>)/g,'data-i18n="viewer.openBox"');
    next = addAttribute(next,/(<button\b(?=[^>]*class="game-detail-viewer-fullscreen")[^>]*)(>)/g,'data-i18n-aria-label="viewer.enterFullscreen"');
    next = addAttribute(next,/(<a class="welcome-button" href="\.\.\/index\.html"[^>]*)(>)/g,'data-i18n="gamePage.backHome"');

    return next;
}

for(const [page,matches] of pages){
    if(matches.length !== 1){
        report.ambiguous.push(`${page} (${matches.length} game.js entries)`);
        continue;
    }

    const file = path.join(projectRoot,"spiele",page);
    if(!fs.existsSync(file)){
        report.missing.push(page);
        continue;
    }

    const html = fs.readFileSync(file,"utf8");
    if(!html.includes("assets/js/gamepage.js") || !html.includes("data-game-detail-viewer")){
        report.incompatible.push(page);
        continue;
    }

    report.eligible.push(page);
    const next = migrate(html);
    if(next === html){
        report.unchanged.push(page);
    }else{
        report.changed.push(page);
        if(write) fs.writeFileSync(file,next,"utf8");
    }
}

console.log(JSON.stringify({
    mode:write ? "write" : "dry-run",
    eligible:report.eligible.length,
    changed:report.changed.length,
    unchanged:report.unchanged.length,
    ambiguous:report.ambiguous,
    missing:report.missing,
    incompatible:report.incompatible
},null,2));
