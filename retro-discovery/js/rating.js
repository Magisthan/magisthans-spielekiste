/*
======================================================
Retro Discovery

rating.js

Startet die Anwendung
======================================================
*/

document.addEventListener(

    "gameChanged",

    (event)=>{

        const game = event.detail;

        console.log(

            "Bewertung:",

            game.rating

        );

    }

);