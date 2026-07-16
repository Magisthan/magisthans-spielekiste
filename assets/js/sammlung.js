/* =====================================================
   Magisthans Spielekiste
   Meine Retro Sammlung
===================================================== */

document.addEventListener("DOMContentLoaded", () => {

    initCounter();
    initShelfEffects();
    initFavoriteEffects();
    initLightbox();

});


/* =====================================================
   Counter
===================================================== */

function initCounter() {

    const cards = document.querySelectorAll(".counter-value");

    if (!cards.length) return;

    let started = false;

    const observer = new IntersectionObserver((entries) => {

        entries.forEach(entry => {

            if (!entry.isIntersecting || started) return;

            started = true;

            cards.forEach(counter => {

                animateCounter(counter);

            });

        });

    }, {

        threshold: 0.35

    });

    observer.observe(document.querySelector(".collection-counter-row"));

}


/* =====================================================
   Counter Animation
===================================================== */

function animateCounter(counter) {

    const target = parseInt(counter.dataset.target);

    const duration = 3500;

    const start = performance.now();

    function update(time) {

        const progress = Math.min(

            (time - start) / duration,

            1

        );

        const eased = easeOut(progress);

        counter.textContent = Math.floor(eased * target);

        if (progress < 1) {

            requestAnimationFrame(update);

        } else {

            counter.textContent = target;

        }

    }

    requestAnimationFrame(update);

}


/* =====================================================
   Ease Animation
===================================================== */

function easeOut(x) {

    return 1 - Math.pow(1 - x, 3);

}


/* =====================================================
   Regale
===================================================== */

function initShelfEffects() {

    const shelves = document.querySelectorAll(".shelf-item");

    shelves.forEach(card => {

        card.addEventListener("mouseenter", () => {

            card.classList.add("hover");

        });

        card.addEventListener("mouseleave", () => {

            card.classList.remove("hover");

        });

        card.addEventListener("click", () => {

            const img = card.querySelector("img");

            const lightbox = document.getElementById("lightbox");

            const lightboxImage = document.getElementById("lightbox-image");

            if (!img || !lightbox || !lightboxImage) return;

            lightboxImage.src = img.src;

            lightbox.classList.add("active");

        });

    });

}


/* =====================================================
   Lightbox
===================================================== */

function initLightbox() {

    const lightbox = document.getElementById("lightbox");

    const image = document.getElementById("lightbox-image");

    const close = document.querySelector(".lightbox-close");

    if (!lightbox || !image || !close) return;

    /* Schließen über X */

    close.addEventListener("click", (e) => {

        e.stopPropagation();

        lightbox.classList.remove("active");

    });

    /* Schließen über Hintergrund */

    lightbox.addEventListener("click", (e) => {

        if (e.target === lightbox) {

            lightbox.classList.remove("active");

        }

    });

    /* ESC Taste */

    document.addEventListener("keydown", (e) => {

        if (e.key === "Escape") {

            lightbox.classList.remove("active");

        }

    });

}


/* =====================================================
   Lieblingsstücke
===================================================== */

function initFavoriteEffects() {

    const cards = document.querySelectorAll(".favorite-item");

    cards.forEach(card => {

        card.addEventListener("mouseenter", () => {

            card.classList.add("hover");

        });

        card.addEventListener("mouseleave", () => {

            card.classList.remove("hover");

        });

    });

}


/* =====================================================
   Platzhalter für spätere Erweiterungen
===================================================== */

function openGallery(category) {

    console.log("Galerie:", category);

}

function openLightbox(image) {

    console.log("Lightbox:", image);

}

function filterPlatform(platform) {

    console.log("Filter:", platform);

}

function showGameDetails(id) {

    console.log("Spiel:", id);

}