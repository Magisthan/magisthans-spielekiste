/*
==================================================
Retro Discovery

events.js
==================================================
*/

function dispatchGameChanged() {

    const sourceGame = visibleGames[currentGameIndex];
    const game = window.GameLocalization?.localizeGame(sourceGame)
        ?? sourceGame;

    document.dispatchEvent(

        new CustomEvent("gameChanged", {

            detail: game

        })

    );

}
