/*
==================================================
Retro Discovery

events.js
==================================================
*/

function dispatchGameChanged() {

    const game = visibleGames[currentGameIndex];

    document.dispatchEvent(

        new CustomEvent("gameChanged", {

            detail: game

        })

    );

}