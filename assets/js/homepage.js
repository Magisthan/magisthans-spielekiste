const homepageEnhancerScript = document.currentScript?.src;
const homepageEnhancerReady = loadHomepageContentEnhancer(homepageEnhancerScript);

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

///--------------------------------------------------
// Box of the Day
//--------------------------------------------------

const featuredGames =
    GAMES.filter(game => game.featured);

if (featuredGames.length === 0) {

    console.warn("Keine Featured Games vorhanden.");

}
else {

    const todayIndex =
        Math.floor(Date.now() / 86400000);

    const game =
        featuredGames[todayIndex % featuredGames.length];

    document.getElementById("botd-title").textContent =
        game.title;

    document.getElementById("botd-subtitle").textContent =
        `${game.publisher} • ${game.system} • ${game.year}`;

    document.getElementById("botd-description").textContent =
        game.description;

    const image =
        document.getElementById("botd-image");

    image.addEventListener("load",()=>{
        homepageEnhancerReady.then(enhancer=>enhancer.apply(image,game.contentDisplay || {}));
    },{ once:true });

    image.src =
        `assets/textures/${game.folder}/content.webp`;

    image.alt =
        game.title;

    document.getElementById("botd-link").href =
        `spiele/${game.page}`;

}
