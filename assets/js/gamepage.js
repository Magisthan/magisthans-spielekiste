const gamePageEnhancerScript = document.currentScript?.src;
const gamePageEnhancerReady = loadContentImageEnhancer(gamePageEnhancerScript);

function loadContentImageEnhancer(scriptUrl){
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

//--------------------------------------------------
// Game Page
//--------------------------------------------------

document.addEventListener("DOMContentLoaded", initGamePage);


//--------------------------------------------------
// Initialisierung
//--------------------------------------------------

function initGamePage() {

    const page = getCurrentPage();

    const game = getGameByPage(page);

    if (!game) {

        console.warn(`Kein Spiel für "${page}" gefunden.`);
        return;

    }

    fillGameData(game);

}


//--------------------------------------------------
// Aktuelle HTML-Datei ermitteln
//--------------------------------------------------

function getCurrentPage() {

    return window.location.pathname
        .split("/")
        .pop();

}


//--------------------------------------------------
// Spiel anhand der HTML-Seite finden
//--------------------------------------------------

function getGameByPage(page) {

    return GAMES.find(game => game.page === page);

}


//--------------------------------------------------
// Daten einfügen
//--------------------------------------------------

function fillGameData(game) {

    const cover = document.getElementById("game-cover");

    if (cover?.parentElement) {
        const coverStage = cover.parentElement;
        const overview = coverStage.parentElement;
        const metadata = Array.from(overview?.children || [])
            .find(element => element !== coverStage && element.querySelector?.("#game-title"));
        const history = document.getElementById("game-history")?.closest(".section");

        coverStage.classList.add("game-cover-stage");
        overview?.classList.add("game-detail-intro", "game-detail-overview");
        metadata?.classList.add("game-detail-metadata");
        history?.classList.add("game-detail-history");

        metadata?.querySelectorAll(":scope > p").forEach(row => {
            row.classList.add("game-detail-metadata__row");
        });

        if (overview && history && history.parentElement === metadata) {
            overview.insertAdjacentElement("afterend", history);
        }

        setupContentImageViewer(cover);
    }

    setText("game-title", game.title);
    setText("game-developer", game.developer);
    setText("game-publisher", game.publisher);
    setText("game-genre", game.genre);
    setText("game-system", game.system);
    setText("game-year", game.year);

    setImage(
        "game-cover",
        `../assets/textures/${game.folder}/content.webp`,
        game.title,
        {
            fallbackSrc: "../assets/images/content-placeholder.svg",
            fallbackAlt: "Noch kein Inhaltsbild vorhanden / No content image available",
            display: game.contentDisplay || {}
        }
    );

    setHTML("game-history", game.history);
    setHTML("game-review", game.review);
    setTrivia("game-trivia", game.trivia);
    setHTML("game-worth-playing", game.worthPlaying);

    // ⭐ Sterne setzen
    const stars = document.getElementById("game-rating-stars");

if (stars) {

    stars.classList.remove(
        "stars-1",
        "stars-1-5",
        "stars-2",
        "stars-2-5",
        "stars-3",
        "stars-3-5",
        "stars-4",
        "stars-4-5",
        "stars-5",
        "animate"
    );

    const ratingClass = String(game.rating).replace(".", "-");
    stars.classList.add(`stars-${ratingClass}`);

    animateRating(stars);

}

setText(
    "game-rating-text",
    `${game.rating} von 5 Sternen`
);

fillScreenshots(game);

setLink("game-letsplay", game.letsPlay);

    }

    




//--------------------------------------------------
// Hilfsfunktionen
//--------------------------------------------------

function setText(id, value) {

    const element = document.getElementById(id);

    if (element) {

        element.textContent = value;

    }

}

function setImage(id, src, alt = "", options = {}) {

    const image = document.getElementById(id);

    if (image) {

        const stage = image.closest(".game-cover-stage") || image.parentElement;
        let fallbackActive = false;

        stage?.classList.remove("has-content-placeholder");

        image.addEventListener("load", () => {
            stage?.classList.toggle("has-content-placeholder", fallbackActive);
            setContentImageInteraction(image,!fallbackActive);
            gamePageEnhancerReady.then(enhancer=>{
                if(fallbackActive) enhancer.reset(image);
                else enhancer.apply(image,options.display || {});
            });
        }, { once: true });

        if (options.fallbackSrc) {
            image.addEventListener("error", () => {
                fallbackActive = true;
                stage?.classList.add("has-content-placeholder");
                image.alt = options.fallbackAlt || alt;
                image.src = options.fallbackSrc;
            }, { once: true });
        }

        image.src = src;

        image.alt = alt;

    }

}

function setupContentImageViewer(image){
    if(!image || image.dataset.contentViewerReady === "true") return;

    const stage = image.parentElement;
    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "content-image-trigger";
    trigger.disabled = true;
    trigger.setAttribute("aria-label","Inhaltsbild vergrößern / Enlarge content image");

    stage.insertBefore(trigger,image);
    trigger.append(image);
    image.dataset.contentViewerReady = "true";

    const dialog = getContentImageDialog();
    const dialogImage = dialog.querySelector(".content-image-dialog-image");

    trigger.addEventListener("click",async()=>{
        if(trigger.disabled) return;
        const enhancer = await gamePageEnhancerReady;
        if(!image.classList.contains("content-image-enhanced")){
            await enhancer.apply(image);
        }
        dialogImage.src = image.currentSrc || image.src;
        dialogImage.alt = image.alt;
        enhancer.copy(image,dialogImage);
        dialog.showModal();
    });
}

function setContentImageInteraction(image,enabled){
    const trigger = image?.closest(".content-image-trigger");
    if(!trigger) return;
    trigger.disabled = !enabled;
    trigger.classList.toggle("is-enabled",enabled);
    if(enabled){
        trigger.setAttribute("aria-label","Inhaltsbild vergrößern / Enlarge content image");
    }else{
        trigger.removeAttribute("aria-label");
    }
}

function getContentImageDialog(){
    let dialog = document.querySelector(".content-image-dialog");
    if(dialog) return dialog;

    dialog = document.createElement("dialog");
    dialog.className = "content-image-dialog";
    dialog.setAttribute("aria-label","Vergrößertes Inhaltsbild / Enlarged content image");
    dialog.innerHTML = `
        <div class="content-image-dialog-panel">
            <button class="content-image-dialog-close" type="button"
                    aria-label="Bild schließen / Close image">×</button>
            <img class="content-image-dialog-image" alt="">
        </div>`;
    document.body.append(dialog);

    const closeButton = dialog.querySelector(".content-image-dialog-close");
    closeButton.addEventListener("click",()=>dialog.close());
    const panel = dialog.querySelector(".content-image-dialog-panel");
    dialog.addEventListener("click",event=>{
        if(event.target === dialog || event.target === panel) dialog.close();
    });
    dialog.addEventListener("close",()=>{
        const dialogImage = dialog.querySelector(".content-image-dialog-image");
        dialogImage.removeAttribute("src");
        gamePageEnhancerReady.then(enhancer=>enhancer.reset(dialogImage));
    });

    return dialog;
}

function setHTML(id, text){

    const element = document.getElementById(id);

    if(element){

        element.innerHTML = text;

    }

}

function setTrivia(id, list){

    const element = document.getElementById(id);

    if(!element || !Array.isArray(list)) return;

    element.innerHTML = "";

    list.forEach(item => {

        const li = document.createElement("li");

        li.textContent = item;

        element.appendChild(li);

    });

}

//--------------------------------------------------
// Sterne animieren
//--------------------------------------------------

function animateRating(stars) {

    if (!stars) return;

    const observer = new IntersectionObserver(entries => {

        entries.forEach(entry => {

            if (!entry.isIntersecting) return;

            stars.classList.add("animate");

            observer.disconnect();

        });

    }, {

        threshold: 0.6

    });

    observer.observe(stars);

}

//--------------------------------------------------
// Screenshots
//--------------------------------------------------

function fillScreenshots(game) {

    const gallery = document.getElementById("game-screenshots");

    if (!gallery || !Array.isArray(game.screenshots)) return;

    gallery.innerHTML = "";

    game.screenshots.forEach(screen => {

        const figure = document.createElement("figure");

        figure.className = "game-screenshot";

        const img = document.createElement("img");

        img.src = `../assets/textures/${game.folder}/${screen.file}`;

        img.alt = screen.caption || game.title;

        img.className = "screenshot";

        img.width = 640;
        img.height = 400;

        img.loading = "lazy";
        img.decoding = "async";

        const caption = document.createElement("figcaption");

        caption.textContent = screen.caption;

        figure.appendChild(img);
        figure.appendChild(caption);

        gallery.appendChild(figure);

    });

}

function setLink(id, url) {

    const link = document.getElementById(id);

    if (!link) return;

    if (url) {

        link.href = url;

    } else {

        // Kein Let's Play vorhanden
        link.style.display = "none";

    }

}
