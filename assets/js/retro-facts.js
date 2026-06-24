const facts = [

    "Der Commodore 64 wurde über 12 Millionen Mal verkauft.",

    "Der Amiga 500 erschien 1987 und wurde zu einem der beliebtesten Heimcomputer Europas.",

    "Turrican wurde ursprünglich für den Commodore 64 entwickelt.",

    "Defender of the Crown war eines der ersten Cinemaware-Spiele.",

    "Monkey Island erschien ursprünglich auf Disketten.",

    "Der SID-Chip des C64 gilt bis heute als legendär.",

    "Viele moderne Indie-Spiele orientieren sich optisch an 8-Bit- und 16-Bit-Klassikern."

    "Der Commodore 64 wurde über 12 Millionen Mal verkauft.",

    "Der SID-Chip des C64 gilt bis heute als legendär.",

    "Der Amiga 500 erschien im Jahr 1987.",

    "Defender of the Crown war eines der ersten Cinemaware-Spiele.",

    "Viele moderne Indie-Spiele orientieren sich an 8-Bit- und 16-Bit-Klassikern.",

    "Der Amiga war seiner Zeit bei Grafik und Sound weit voraus.",

    "Turrican zählt zu den bekanntesten europäischen Actionspielen der 90er Jahre.",

    "Die Demoszene wurde 2021 von der UNESCO als Kulturerbe anerkannt.",

    "Der C64 besitzt nur 64 Kilobyte Arbeitsspeicher.",

    "Monkey Island erschien ursprünglich 1990.",

    "Der Amiga 1200 wurde mit einem Motorola 68020 Prozessor ausgeliefert.",

    "Der SID-Chip wurde von Bob Yannes entwickelt.",

    "Elite auf dem C64 gilt als eines der ersten Open-World-Spiele.",

    "Dungeon Master prägte das Genre der Echtzeit-Rollenspiele.",

    "Die meisten C64-Spiele wurden auf Diskette oder Kassette veröffentlicht.",

    "Der Amiga konnte bereits 1985 Multitasking ausführen.",

    "Prince of Persia nutzte rotoskopierte Animationen für realistische Bewegungen.",

    "Der C64 wurde von 1982 bis 1994 produziert.",

    "Lemmings wurde ursprünglich für den Amiga entwickelt.",

    "Der Amiga 500 war einer der erfolgreichsten Heimcomputer Europas.",

    "Viele berühmte Spiele-Musiker begannen auf dem C64.",

    "Wing Commander erschien 1990 und setzte neue Maßstäbe für Weltraumspiele.",

    "Die Bitmap Brothers gehören zu den bekanntesten Entwicklern der Amiga-Ära.",

    "Der erste Teil von The Settlers erschien 1993 auf dem Amiga.",

    "LucasArts führte mit SCUMM eine neue Art von Adventures ein.",

    "Das Spiel Pirates! von Sid Meier erschien bereits 1987.",

    "Der C64 startete direkt in den BASIC-Interpreter.",

    "Viele Amiga-Demos nutzten Effekte, die offiziell als unmöglich galten.",

    "Der VIC-II Grafikchip machte den C64 zu einer Spielemaschine.",

    "Eye of the Beholder gehörte zu den beliebtesten Dungeon-Crawlern der 90er.",

    "Die ersten Worms-Spiele erschienen auf dem Amiga.",

    "North & South basiert auf dem französischen Comic Die Blauen Boys.",

    "Kickstart ist das Betriebssystem-ROM des Amiga.",

    "Der Soundtrack von Turrican 2 stammt von Chris Hülsbeck.",

    "Der C64 konnte Sprites direkt per Hardware darstellen."

];

const day =
    Math.floor(Date.now() / 86400000);

document.getElementById("retro-fact-text")
    .textContent =
    facts[day % facts.length];
