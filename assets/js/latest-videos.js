fetch("data/latest-videos.json")

.then(response => response.json())

.then(videos => {

    const container =
        document.getElementById("latest-videos");

    videos.forEach(video => {

        container.innerHTML += `

        <a href="${video.url}"
           target="_blank"
           class="video-box">

            <img src="${video.thumbnail}"
                 alt="${video.title}">

            <div class="video-content">

                <h3>${video.title}</h3>

            </div>

        </a>
        `;
    });

});
