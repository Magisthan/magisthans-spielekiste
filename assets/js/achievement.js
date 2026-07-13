document.addEventListener("DOMContentLoaded", () => {

    const popup = document.getElementById("achievement-popup");

    if (!popup) return;

/* ==========================================
   BESUCHSZÄHLER
========================================== */

let visitCounter = parseInt(
    localStorage.getItem("retroVisitCounter") || "0"
);

visitCounter++;

localStorage.setItem(
    "retroVisitCounter",
    visitCounter
);

let nextAchievement = parseInt(
    localStorage.getItem("retroNextAchievement") || "1"
);

/*
    Noch kein Achievement?

    Dann Script beenden.
*/

if (visitCounter < nextAchievement){

    return;

}

    const icon = popup.querySelector(".achievement-icon");
    const title = popup.querySelector("strong");
    const text = popup.querySelector("small");

    /* ==========================================
       ACHIEVEMENTS
    ========================================== */

    const commonAchievements = [

        {
            icon: "🏆",
            title: "Willkommen in der Spielekiste",
            text: "+10 Retro Erfahrung"
        },

        {
            icon: "☕",
            title: "Kaffee aufgefüllt",
            text: "+15 Energie"
        },

        {
            icon: "💾",
            title: "Spielstand geladen",
            text: "Erinnerungen erfolgreich wiederhergestellt."
        },

        {
            icon: "🕹️",
            title: "Joystick kalibriert",
            text: "+8 Geschick"
        },

        {
            icon: "📺",
            title: "CRT Monitor aktiviert",
            text: "Pixelmodus gestartet."
        },

        {
            icon: "🎮",
            title: "Neues Spiel entdeckt",
            text: "+12 Neugier"
        },

        {
            icon: "📰",
            title: "Retro News gefunden",
            text: "Neue Ausgabe entdeckt."
        },

        {
            icon: "📼",
            title: "Datasette eingelegt",
            text: "Bitte nicht ausschalten..."
        }

    ];



    const rareAchievements = [

        {
            icon: "📀",
            title: "Originaldiskette gefunden",
            text: "+250 Sammlerwert"
        },

        {
            icon: "🎵",
            title: "SID-Musik entdeckt",
            text: "Stereoanlage empfohlen."
        }

    ];



    const legendaryAchievements = [

        {
            icon: "👑",
            title: "SID CHIP ENTDECKT",
            text: "+500 Nostalgie"
        },

        {
            icon: "💿",
            title: "1541 JUSTIERT",
            text: "Lesekopf erfolgreich kalibriert."
        }

    ];



    /* ==========================================
       ZUFALL
    ========================================== */

    const chance = Math.random();

    let achievement;

    let rarity;

    if (chance <= 0.01) {

        rarity = "legendary";

        achievement = legendaryAchievements[
            Math.floor(Math.random() * legendaryAchievements.length)
        ];

    }

    else if (chance <= 0.10) {

        rarity = "rare";

        achievement = rareAchievements[
            Math.floor(Math.random() * rareAchievements.length)
        ];

    }

    else {

        rarity = "common";

        achievement = commonAchievements[
            Math.floor(Math.random() * commonAchievements.length)
        ];

    }



    /* ==========================================
       DATEN EINSETZEN
    ========================================== */

    icon.textContent = achievement.icon;

    title.textContent = achievement.title;

    text.textContent = achievement.text;



    /* ==========================================
       SELTENHEIT
    ========================================== */

    popup.classList.remove(
        "achievement-common",
        "achievement-rare",
        "achievement-legendary"
    );

    popup.classList.add("achievement-" + rarity);

    /* ==========================================
       UNTERSCHIEDE
    ========================================== */


    const label = popup.querySelector(".achievement-label");

switch(rarity){

    case "legendary":

        label.textContent = "LEGENDÄRES ACHIEVEMENT";

        break;

    case "rare":

        label.textContent = "SELTENES ACHIEVEMENT";

        break;

    default:

        label.textContent = "ACHIEVEMENT";

}

/* ==========================================
   NÄCHSTES ACHIEVEMENT FESTLEGEN
========================================== */

/*
    Nach jedem Achievement
    zufällig 3–8 weitere Besuche warten
*/

const nextVisitDelay =
    Math.floor(Math.random() * 6) + 3;

localStorage.setItem(

    "retroNextAchievement",

    visitCounter + nextVisitDelay

);

    /* ==========================================
       EINBLENDEN
    ========================================== */

    setTimeout(() => {

        popup.classList.add("show");

    }, 1200);



    /* ==========================================
       AUSBLENDEN
    ========================================== */

    setTimeout(() => {

        popup.classList.remove("show");

    }, 6500);


});