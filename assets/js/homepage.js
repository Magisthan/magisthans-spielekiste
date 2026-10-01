const homepageEnhancerScript = document.currentScript?.src;
const homepageEnhancerReady = loadHomepageContentEnhancer(homepageEnhancerScript);

let homepageFeaturedGame = null;

function loadHomepageContentEnhancer(scriptUrl){
    if(window.ContentImageEnhancer) return Promise.resolve(window.ContentImageEnhancer);
    if(window.__contentImageEnhancerReady) return window.__contentImageEnhancerReady;
    window.__contentImageEnhancerReady = new Promise((resolve,reject)=>{
        const script = document.createElement("script");
        script.src = new URL("content-image-enhancer.js",scriptUrl).href;
        script.onload = ()=>resolve(window.ContentImageEnhancer);
        script.onerror = reject;
        document.head.append(script);
    });
    return window.__contentImageEnhancerReady;
}

function waitForHomepageLanguage(){
    if(document.readyState !== "loading"){
        return Promise.resolve(window.__siteI18nReady);
    }

    return new Promise(resolve=>{
        document.addEventListener("DOMContentLoaded",()=>{
            Promise.resolve(window.__siteI18nReady).then(resolve);
        },{ once:true });
    });
}

function renderFeaturedGame(){
    if(!homepageFeaturedGame) return;

    const game = window.GameLocalization?.localizeGame(homepageFeaturedGame)
        || homepageFeaturedGame;

    document.getElementById("botd-title").textContent = game.title;
    document.getElementById("botd-subtitle").textContent =
        `${game.publisher} • ${game.system} • ${game.year}`;
    document.getElementById("botd-description").textContent = game.description;

    const image = document.getElementById("botd-image");
    image.alt = game.title;
}

async function initializeHomepage(){
    await waitForHomepageLanguage();

    const featuredGames = GAMES.filter(game => game.featured);
    if(!featuredGames.length){
        console.warn(window.SiteI18n?.t("home.featuredMissing"));
        return;
    }

    const todayIndex = Math.floor(Date.now() / 86400000);
    homepageFeaturedGame = featuredGames[todayIndex % featuredGames.length];

    const image = document.getElementById("botd-image");
    image.addEventListener("load",()=>{
        homepageEnhancerReady.then(enhancer=>{
            enhancer.apply(image,homepageFeaturedGame.contentDisplay || {});
        });
    },{ once:true });
    image.src = `assets/textures/${homepageFeaturedGame.folder}/content.webp`;

    document.getElementById("botd-link").href =
        `spiele/${homepageFeaturedGame.page}`;

    renderFeaturedGame();
    document.addEventListener("siteLanguageChanged",renderFeaturedGame);
}

initializeHomepage();
