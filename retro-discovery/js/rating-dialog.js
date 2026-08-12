/* ==========================================
   Retro Discovery
   Rating Dialog
========================================== */

const currentRating = {

    gameplay:0,
    boxdesign:0,
    cultstatus:0

};

/* ==========================================
   Dialog öffnen
========================================== */

function openRatingDialog(){

    document
        .getElementById("rating-modal")
        .classList.add("show");

}

/* ==========================================
   Dialog schließen
========================================== */

function closeRatingDialog(){

    document
        .getElementById("rating-modal")
        .classList.remove("show");

}

/* ==========================================
   Sterne aktualisieren
========================================== */

function updateStars(container,value){

    container
        .querySelectorAll(".star")
        .forEach(star=>{

            star.classList.toggle(

                "active",

                Number(star.dataset.value)<=value

            );

        });

}

/* ==========================================
   Sterne erzeugen
========================================== */

function createStars(container){

    const type =
        container.dataset.name;

    for(let i=1;i<=10;i++){

        const star =
            document.createElement("span");

        star.className="star";

        star.innerHTML="★";

        star.dataset.value=i;

        //----------------------------------
        // Hover
        //----------------------------------

        star.addEventListener("mouseenter",()=>{

            updateStars(container,i);

            updateRatingText(type,i);

        });

        //----------------------------------
        // Klick
        //----------------------------------

        star.addEventListener("click",()=>{

            currentRating[type]=i;

            updateStars(container,i);

            updateRatingText(type,i);

        });

        container.appendChild(star);

    }

    //----------------------------------
    // Maus verlässt Reihe
    //----------------------------------

    container.addEventListener("mouseleave",()=>{

        updateStars(

            container,

            currentRating[type]

        );

        updateRatingText(

            type,

            currentRating[type]

        );

    });

}

function updateRatingText(type,value){

    const target =

        document.getElementById(

            "rating-text-"+type

        );

    if(!target) return;

    let text="Noch keine Bewertung";

    if(value>=1 && value<=2){

        text="Schwach";

    }

    else if(value<=4){

        text="Durchschnitt";

    }

    else if(value<=6){

        text="Gut";

    }

    else if(value<=8){

        text="Sehr gut";

    }

    else if(value<=10){

        text="Legendär";

    }

    target.textContent=text;

}

/* ==========================================
   Formular zurücksetzen
========================================== */

function resetRatingDialog(){

    currentRating.gameplay=0;

    currentRating.boxdesign=0;

    currentRating.cultstatus=0;

    document

        .querySelectorAll(".stars")

        .forEach(container=>{

            updateStars(container,0);

        });

    updateRatingText(

        "gameplay",

        0

    );

    updateRatingText(

        "boxdesign",

        0

    );

    updateRatingText(

        "cultstatus",

        0

    );

}

/* ==========================================
   Bewertung senden
========================================== */

function submitRating(){

    addCommunityRating(currentRating);

    closeRatingDialog();

    showToast(

        "Vielen Dank für deine Bewertung."

    );

}

/* ==========================================
   Toast
========================================== */

function showToast(text){

    const toast =

        document.createElement("div");

    toast.className="rating-toast";

    toast.textContent=text;

    document.body.appendChild(toast);

    requestAnimationFrame(()=>{

        toast.classList.add("show");

    });

    setTimeout(()=>{

        toast.classList.remove("show");

        setTimeout(()=>{

            toast.remove();

        },300);

    },2200);

}

/* ==========================================
   Initialisierung
========================================== */

document.addEventListener("DOMContentLoaded",()=>{

    document
        .querySelectorAll(".stars")
        .forEach(createStars);

    document.body.addEventListener("click",(event)=>{

        if(event.target.closest(".community-button")){

            resetRatingDialog();

            openRatingDialog();

        }

    //----------------------------------
// X Button
//----------------------------------

document

    .getElementById("rating-close")

    ?.addEventListener(

        "click",

        closeRatingDialog

    );

//----------------------------------
// ESC
//----------------------------------

document.addEventListener(

    "keydown",

    (event)=>{

        if(

            event.key==="Escape"

        ){

            closeRatingDialog();

        }

    }

);

//----------------------------------
// Klick außerhalb
//----------------------------------

document

    .getElementById("rating-modal")

    ?.addEventListener(

        "click",

        (event)=>{

            if(

                event.target.id===

                "rating-modal"

            ){

                closeRatingDialog();

            }

        }

    );

    });

    document
        .getElementById("rating-cancel")
        ?.addEventListener(

            "click",

            closeRatingDialog

        );

    document
        .getElementById("rating-submit")
        ?.addEventListener(

            "click",

            submitRating

        );

});