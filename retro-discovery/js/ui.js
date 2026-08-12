/*
======================================================
Retro Discovery

ui.js

Startet die Anwendung
======================================================
*/

document.addEventListener(

    "gameChanged",

    (event)=>{

        const game = event.detail;

        console.log(

            "Info:",

            game.title

        );

    }

);