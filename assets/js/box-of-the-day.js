const games = [

{
    title: "SDI",
    subtitle: "Cinemaware / Mindscape · Amiga · 1987",

    image: "assets/games/SDI_Box Inhalt.png",

    description:
        "Die Erde wird von Atomraketen bedroht. Deine Aufgabe besteht darin, mit dem Satellitenabwehrsystem SDI die Welt vor der Vernichtung zu bewahren.",

    link: "spiele/sdi.html"
},

{
    title: "Der Patrizier",
    subtitle: "Ascaron · PC · 1992",

    image: "assets/games/patrizier/patrizier-box.png",

    description:
        "Vom kleinen Händler zum mächtigsten Kaufmann der Hanse. Wirtschaftssimulation mit Tiefgang und Langzeitmotivation.",

    link: "spiele/der-patrizier.html"
},

{
    title: "Burntime",
    subtitle: "Max Design · Amiga · 1993",

    image: "assets/games/burntime.png",

    description:
        "Nach dem nuklearen Krieg kämpfst du in einer zerstörten Welt um Nahrung, Ausrüstung und Einfluss.",

    link: "spiele/burntime.html"
}

];

const todayIndex =
    Math.floor(Date.now() / 86400000);

const game =
    games[todayIndex % games.length];

document.getElementById("box-of-the-day").innerHTML = `

<div class="box-of-day">

    <div class="box-day-image">

        <img src="${game.image}"
             alt="${game.title}">

    </div>

    <div class="box-day-content">

        <div class="box-day-label">
            🎮 BOX OF THE DAY
        </div>

        <h2>${game.title}</h2>

        <div class="box-day-subtitle">
            ${game.subtitle}
        </div>

        <div class="box-day-description">
            ${game.description}
        </div>

        <a href="${game.link}"
           class="box-day-button">
           Mehr erfahren
        </a>

    </div>

</div>
`;
