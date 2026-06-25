const games = [

{
    title: "SDI",
    subtitle: "Cinemaware / Mindscape · Amiga · 1987",

    image: "assets/games/sdi/sdi/SDI_Box Inhalt.png",

    description:
        "Die Erde wird von Atomraketen bedroht. Deine Aufgabe besteht darin, mit dem Satellitenabwehrsystem SDI die Welt vor der Vernichtung zu bewahren.",

    link: "spiele/sdi.html"
},

{
    title: "Der Patrizier",
    subtitle: "Ascaron · PC · 1992",

    image: "assets/games/patrizier/patrizier-box.png",

    description:
        "Vom kleinen Händler zum mächtigsten Kaufmann der Hanse. Eine der bis heute besten Wirtschaftssimulationen mit Handel, Politik und Hanseflair.",

    link: "spiele/der-patrizier.html"
},

{
    title: "Mega Lo Mania",
    subtitle: "Sensible Software · Amiga · 1991",

    image: "assets/games/megalomania/megalomania-box.png",

    description:
        "Führe deine Zivilisation von der Steinzeit bis ins Atomzeitalter und besiege deine Gegner mit Forschung, Strategie und taktischem Geschick.",

    link: "spiele/mega-lo-mania.html"
},

{
    title: "1869",
    subtitle: "Max Design · Amiga · 1992",

    image: "assets/games/1869/1869-box.png",

    description:
        "Gründe eine Reederei, kaufe Dampfschiffe und baue ein weltweites Handelsnetz im Zeitalter der großen Ozeandampfer auf.",

    link: "spiele/1869.html"
},

{
    title: "Die Fugger",
    subtitle: "Golden Games · C64 · 1989",

    image: "assets/games/fugger/fugger-box.png",

    description:
        "Steige vom einfachen Händler zum reichsten Kaufmann Europas auf und sichere dir politischen Einfluss durch geschicktes Wirtschaften.",

    link: "spiele/fugger.html"
},

{
    title: "Die Fugger 2",
    subtitle: "Sunflowers · PC · 1996",

    image: "assets/games/fugger2/fugger2-box.png",

    description:
        "Der Nachfolger erweitert das Wirtschaftssystem erheblich und verbindet Handel, Produktion und Politik zu einer komplexen Simulation.",

    link: "spiele/fugger-2.html"
},

{
    title: "Rings of Medusa",
    subtitle: "Starbyte · Amiga · 1989",

    image: "assets/games/ringsofmedusa/ringsofmedusa-box.png",

    description:
        "Fantasy, Handel und Strategie verschmelzen zu einem ungewöhnlichen Mix aus Wirtschaftssimulation und Rollenspiel.",

    link: "spiele/rings-of-medusa.html"
},

{
    title: "Burntime",
    subtitle: "Max Design · Amiga · 1993",

    image: "assets/games/burntime/burntime-box.png",

    description:
        "Nach einem nuklearen Krieg kämpfst du in einer zerstörten Welt um Nahrung, Ausrüstung und Einfluss in einer einzigartigen Endzeit-Simulation.",

    link: "spiele/burntime.html"
},

{
    title: "Champions of Krynn",
    subtitle: "SSI · Amiga · 1990",

    image: "assets/games/cok/cok-box.png",

    description:
        "Ein klassisches Dungeons & Dragons-Rollenspiel im Dragonlance-Universum mit rundenbasierten Kämpfen und großer Partyfreiheit.",

    link: "spiele/champions-of-krynn.html"
},

{
    title: "Cinemaware Games",
    subtitle: "Cinemaware · Amiga / C64 · 1986–1991",

    image: "assets/games/cinemaware/cinemaware-box.png",

    description:
        "Eine Hommage an die legendären Cinemaware-Klassiker wie Defender of the Crown, Rocket Ranger und Wings.",

    link: "spiele/cinemaware-games.html"
},

    {
    title: "Vermeer",
    subtitle: "Cinemaware · Amiga / C64 · 1986–1991",

    image: "assets/games/vermeer/vermeer-box.png",

    description:
        "Eine Hommage an die legendären Cinemaware-Klassiker wie Defender of the Crown, Rocket Ranger und Wings.",

    link: "spiele/vermeer.html"
},

{
    title: "Sid Meier's Pirates!",
    subtitle: "MicroProse · Amiga · 1987",

    image: "assets/games/pirates-amiga/pirates-amiga-box.png",

    description:
        "Segle durch die Karibik, kämpfe gegen feindliche Flotten, suche verborgene Schätze und werde zur Legende der sieben Meere.",

    link: "spiele/sid-meiers-pirates.html"
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
