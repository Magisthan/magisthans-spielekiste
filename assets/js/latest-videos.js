fetch("data/latest-videos.json")

.then(response => response.json())

.then(videos => {

    /* ==========================
       Neuestes Video
       ========================== */

    const featured =
        document.getElementById("featured-video");

    if (featured && videos.length > 0) {

        const firstVideo = videos[0];

        featured.innerHTML = `

        <div class="featured-video-card">

            <button
                class="lite-video-button"
                type="button"
                data-video-id="${firstVideo.videoId}"
                aria-label="Video abspielen: ${firstVideo.title}">

                <img
                    src="${firstVideo.thumbnail}"
                    alt="${firstVideo.title}"
                    loading="lazy"
                    decoding="async">

                <span class="lite-video-play" aria-hidden="true"></span>

            </button>

        </div>

        `;

        featured
            .querySelector(".lite-video-button")
            .addEventListener("click", event => {

                const button = event.currentTarget;
                const videoId = button.dataset.videoId;

                button.outerHTML = `

                <iframe
                    src="https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1"
                    title="${firstVideo.title}"
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowfullscreen>
                </iframe>

                `;

            });
    }

    /* ==========================
       Letzte Videos
       ========================== */

    const container =
        document.getElementById("latest-videos");

    if (!container) return;

    videos.forEach(video => {

        container.innerHTML += `

        <a href="${video.url}"
           target="_blank"
           class="video-row">

            <div class="video-thumb">

                <img src="${video.thumbnail}"
                     alt="${video.title}"
                     loading="lazy"
                     decoding="async">

            </div>

            <div class="video-info">

                <h3>${video.title}</h3>

                <p>
                    Neues Video auf Magisthans Spielekiste
                </p>

            </div>

            <div class="video-arrow">
                →
            </div>

        </a>

        `;
    });

})

.catch(error => {

    console.error(
        "Fehler beim Laden der Videos:",
        error
    );

});
