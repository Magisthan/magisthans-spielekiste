document.addEventListener("DOMContentLoaded", () => {

    const card = document.querySelector(".player-card");

    const openButton = document.querySelector(
        ".player-card-front .player-card-button"
    );

    const closeButton = document.querySelector(
        ".player-card-back .player-card-button"
    );

    const statBars = document.querySelectorAll(".stat-fill");

    if (!card) return;

    /* ==========================================
       CHARACTER STATS ANIMATION
    ========================================== */

    function animateStats(){

        statBars.forEach((bar,index)=>{

            /* zunächst zurücksetzen */

            bar.style.width = "0%";

            /* leicht versetzt starten */

            setTimeout(()=>{

                bar.style.width = bar.dataset.value + "%";

            },index * 150);

        });

    }

    function resetStats(){

        statBars.forEach(bar=>{

            bar.style.width = "0%";

        });

    }

    /* ==========================================
       KARTE ÖFFNEN
    ========================================== */

    if (openButton){

        openButton.addEventListener("click",()=>{

            card.classList.add("flipped");

            /* warten bis die Karte fast fertig gedreht ist */

            setTimeout(()=>{

                animateStats();

            },450);

        });

    }

    /* ==========================================
       KARTE SCHLIESSEN
    ========================================== */

    if (closeButton){

        closeButton.addEventListener("click",()=>{

            card.classList.remove("flipped");

            resetStats();

        });

    }

});