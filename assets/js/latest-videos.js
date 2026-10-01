(() => {
    let loadedVideos = [];

    function text(key,params={}){
        return window.SiteI18n?.t(key,params) ?? key;
    }

    function renderVideos(){
        if(!loadedVideos.length) return;

        const featured = document.getElementById("featured-video");
        const firstVideo = loadedVideos[0];

        if(featured){
            featured.innerHTML = `
                <div class="featured-video-card">
                    <button
                        class="lite-video-button"
                        type="button"
                        data-video-id="${firstVideo.videoId}"
                        aria-label="${text("home.videoPlay",{ title:firstVideo.title })}">
                        <img
                            src="${firstVideo.thumbnail}"
                            alt="${firstVideo.title}"
                            loading="lazy"
                            decoding="async">
                        <span class="lite-video-play" aria-hidden="true"></span>
                    </button>
                </div>`;

            featured.querySelector(".lite-video-button")?.addEventListener("click",event=>{
                const button = event.currentTarget;
                button.outerHTML = `
                    <iframe
                        src="https://www.youtube-nocookie.com/embed/${button.dataset.videoId}?autoplay=1"
                        title="${firstVideo.title}"
                        loading="lazy"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowfullscreen>
                    </iframe>`;
            });
        }

        const container = document.getElementById("latest-videos");
        if(!container) return;

        container.innerHTML = loadedVideos.map(video=>`
            <a href="${video.url}"
               target="_blank"
               rel="noopener noreferrer"
               class="video-row">
                <div class="video-thumb">
                    <img src="${video.thumbnail}"
                         alt="${video.title}"
                         loading="lazy"
                         decoding="async">
                </div>
                <div class="video-info">
                    <h3>${video.title}</h3>
                    <p>${text("home.videoDescription")}</p>
                </div>
                <div class="video-arrow" aria-hidden="true">→</div>
            </a>`).join("");
    }

    async function initializeVideos(){
        if(document.readyState === "loading"){
            await new Promise(resolve=>document.addEventListener("DOMContentLoaded",resolve,{ once:true }));
        }
        await Promise.resolve(window.__siteI18nReady);

        try{
            const response = await fetch("data/latest-videos.json");
            if(!response.ok) throw new Error(`HTTP ${response.status}`);
            loadedVideos = await response.json();
            renderVideos();
            document.addEventListener("siteLanguageChanged",renderVideos);
        }catch(error){
            console.error(text("common.error"),error);
        }
    }

    initializeVideos();
})();
