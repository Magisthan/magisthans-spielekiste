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

    setText("game-title", game.title);
    setText("game-developer", game.developer);
    setText("game-publisher", game.publisher);
    setText("game-genre", game.genre);
    setText("game-system", game.system);
    setText("game-year", game.year);

    setImage(
        "game-cover",
        `../assets/textures/${game.folder}/content.webp`,
        game.title
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

    stars.classList.add(`stars-${game.rating}`);

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

function setImage(id, src, alt = "") {

    const image = document.getElementById(id);

    if (image) {

        image.src = src;

        image.alt = alt;

    }

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
