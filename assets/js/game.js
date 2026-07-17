const GAMES = [
    

    {
        id: 1,
        folder: "pirates",
        title: " Sid Meiers Pirates!",
        system: "Amiga",
        year: 1987,
        publisher: "MicroProse",
        developer: "Sid Meier"
    },

    {
        id: 2,
        folder: "ports-of-call-eu",
        title: " Ports of Call (EU)",
        system: "Amiga",
        year: 1986,
        publisher: "The Disc Company",
        developer: "Rolf-Dieter Klein, Martin Ulrich"
    },

    {
        id: 3,
        folder: "ports-of-call-us",
        title: " Ports of Call (US)",
        system: "Amiga",
        year: 1986,
        publisher: "Aegis",
        developer: "Rolf-Dieter Klein, Martin Ulrich"
    },

    {
        id: 4,
        folder: "kaiser",
        title: " Kaiser",
        system: "C64",
        year: 1984,
        publisher: "Ariolasoft",
        developer: "Markus Mergard, Claudio Kronmüller, Dirk Beyelstein"
    },

    {
        id: 5,
        folder: "vermeer-c64",
        title: " Vermeer",
        system: "C64",
        year: 1987,
        publisher: "Ariolasoft",
        developer: "Ralf Glau, Paul Förterer, Andreas Kemnitz"
    },

    {
        id: 6,
        folder: "hanse-c64",
        title: " Hanse",
        system: "C64",
        year: 1986,
        publisher: "Ariolasoft",
        developer: "Ralf Glau"
    },

    {
        id: 7,
        folder: "dotc-c64-us",
        title: " Defender of the Crown (US)",
        system: "C64",
        year: 1987,
        publisher: "Master Designer Software",
        developer: "Cinemaware"
    },

    {
        id: 8,
        folder: "neverwinter-nights-ssi-v1",
        title: " Neverwinter Nights",
        system: "IBM-PC",
        year: 1991,
        publisher: "Strategic-Simulation-Incorporated (SSI)",
        developer: "Don Daglow, Cathryn Mataga, David Bunnett."
    },

    {
        id: 9,
        folder: "regent-ce",
        title: "Regent - Collectors Edition",
        system: "IBM-PC-DOS",
        year: 1994,
        publisher: "Martin ECONOMIC Simulations (MES)",
        developer: "Martin Martin, Elmar Martin, Dietmar Assmann"
    },



];

function getGameById(id) {

    return GAMES.find(game => game.id === id);

}

function getGameByFolder(folder) {

    return GAMES.find(game => game.folder === folder);

}