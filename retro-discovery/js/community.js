/* ==========================================
   Retro Discovery
   Community
========================================== */

//--------------------------------------------------
// Demo Daten
//--------------------------------------------------

const COMMUNITY = {

    pirates:{

        gameplay:9.2,
        boxdesign:8.8,
        cultstatus:9.7,
        votes:421

    },

    monkey_island:{

        gameplay:9.8,
        boxdesign:9.5,
        cultstatus:10.0,
        votes:863

    }
    

};

let currentCommunityFolder = null;

//--------------------------------------------------
// Standardwerte
//--------------------------------------------------

const EMPTY_COMMUNITY = {

    gameplay:0,
    boxdesign:0,
    cultstatus:0,
    votes:0

};

//--------------------------------------------------
// Daten laden
//--------------------------------------------------

function getCommunityRating(folder){

    return COMMUNITY[folder] ?? EMPTY_COMMUNITY;

}

//--------------------------------------------------
// Panel aktualisieren
//--------------------------------------------------

function updateCommunityPanel(data){

    //------------------------------------------
    // Zahlen
    //------------------------------------------

    document.getElementById("rating-game-value").textContent =
        data.gameplay.toFixed(1);

    document.getElementById("rating-box-value").textContent =
        data.boxdesign.toFixed(1);

    document.getElementById("rating-cult-value").textContent =
        data.cultstatus.toFixed(1);

    document.getElementById("community-votes").textContent =
        `${data.votes} Bewertungen`;

    //------------------------------------------
    // Balken
    //------------------------------------------

    document.getElementById("rating-game-fill").style.width =
        `${data.gameplay*10}%`;

    document.getElementById("rating-box-fill").style.width =
        `${data.boxdesign*10}%`;

    document.getElementById("rating-cult-fill").style.width =
        `${data.cultstatus*10}%`;

}

//--------------------------------------------------
// Panel anzeigen
//--------------------------------------------------

function showCommunity(folder){

    currentCommunityFolder = folder;

    const data = getCommunityRating(folder);
    console.log("Neue Community Daten", data);

    updateCommunityPanel(data);

    const panel =

        document.getElementById(

            "community-panel"

        );

    if(!panel) return;

    panel.classList.remove("show");

    void panel.offsetWidth;

    panel.classList.add("show");

}

//--------------------------------------------------
// Panel ausblenden
//--------------------------------------------------

function hideCommunity(){

    document
        .getElementById("community-panel")
        ?.classList.remove("show");

}

/* ==========================================
   Neue Community Bewertung
========================================== */

function addCommunityRating(rating){
console.log("currentCommunityFolder", currentCommunityFolder);

    if(!currentCommunityFolder) return;

    if(!COMMUNITY[currentCommunityFolder]){

    COMMUNITY[currentCommunityFolder]={

        gameplay:0,
        boxdesign:0,
        cultstatus:0,
        votes:0

    };

}

const data = COMMUNITY[currentCommunityFolder];

    //------------------------------------------
    // Neue Durchschnittswerte
    //------------------------------------------

    data.gameplay =

        (

            data.gameplay * data.votes +

            rating.gameplay

        )

        /(data.votes+1);

    data.boxdesign =

        (

            data.boxdesign * data.votes +

            rating.boxdesign

        )

        /(data.votes+1);

    data.cultstatus =

        (

            data.cultstatus * data.votes +

            rating.cultstatus

        )

        /(data.votes+1);

    data.votes++;

    updateCommunityPanel(data);

}