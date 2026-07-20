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

    image.src =
        `assets/textures/${game.folder}/content.webp`;

    image.alt =
        game.title;

    document.getElementById("botd-link").href =
        `spiele/${game.page}`;

}
