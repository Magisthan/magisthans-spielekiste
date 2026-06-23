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

            <iframe
                src="https://www.youtube-nocookie.com/embed/${firstVideo.videoId}"
                title="${firstVideo.title}"
                allowfullscreen>
            </iframe>

        </div>

        `;
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
                     alt="${video.title}">

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
