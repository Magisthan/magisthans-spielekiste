document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       ELEMENTE
    ===================================================== */

    const powerButton   = document.getElementById("crtPower");
    const channelButton = document.getElementById("crtChannelButton");
    const playButton    = document.getElementById("crtPlay");

    const led = document.getElementById("crtLed");

    const thumbnail = document.getElementById("crtThumbnail");

    const video = document.getElementById("crtVideo");
    const videoSource = document.getElementById("crtVideoSource");

    const channelNumber = document.getElementById("crtChannelNumber");
    const channelTitle  = document.getElementById("crtChannelTitle");

    const hint = document.getElementById("crtHint");

    const boot  = document.querySelector(".crt-boot");
    const line  = document.querySelector(".crt-line");
    const noise = document.querySelector(".crt-static");

    const playOverlay = document.getElementById("crtPlay");

    if(

        !powerButton ||
        !channelButton ||
        !playButton ||

        !led ||

        !thumbnail ||

        !video ||
        !videoSource ||

        !channelNumber ||
        !channelTitle ||

        !hint ||

        !boot ||
        !line ||
        !noise

    ){

        console.error("CRT TV 3.0 konnte nicht initialisiert werden.");

        return;

    }

    /* =====================================================
       STATUS
    ===================================================== */

    let currentChannel = 0;

    let isStarting = false;

    let isPlaying = false;

    /* =====================================================
       VIDEOKANÄLE
    ===================================================== */

    const channels = [

        {

            number : "01",

            title : "DIE PIXELKUMPEL",

            type : "local",

            thumbnail : "assets/images/pixelkumpel-thumbnail.webp",

            video : "assets/video/pixelkumpelvideo.mp4"

        },

        {

            number : "02",

            title : "KATAKIS",

            type : "youtube",

            thumbnail : "assets/images/katakis.webp",

            youtube : "https://www.youtube.com/watch?v=WFaL6tq7p98"

        },

        {

            number : "03",

            title : "STUNT CAR RACER",

            type : "youtube",

            thumbnail : "assets/images/stunt-car-racer.webp",

            youtube : "https://www.youtube.com/watch?v=X8BoKZvYUfY"

        },

        {

            number : "04",

            title : "SUPERSTAR ICE HOCKEY",

            type : "youtube",

            thumbnail : "assets/images/superstar-ice-hockey.webp",

            youtube : "https://www.youtube.com/watch?v=uIo5wnpNN90"

        }

    ];

    /* =====================================================
       CHANNEL AKTUALISIEREN
    ===================================================== */

    function updateChannel(){

        const item = channels[currentChannel];

        thumbnail.src = item.thumbnail;

        channelNumber.textContent =
            "CHANNEL " + item.number;

        channelTitle.textContent =
            "► " + item.title;

        if(item.type === "local"){

            videoSource.src = item.video;

            video.load();

        }

    }

    /* =====================================================
       NÄCHSTER KANAL
    ===================================================== */

    function nextChannel(){

        if(isPlaying || isStarting){

            return;

        }

        noise.classList.remove("active");

        void noise.offsetWidth;

        noise.classList.add("active");

        currentChannel++;

        if(currentChannel >= channels.length){

            currentChannel = 0;

        }

        setTimeout(updateChannel,200);

    }

    /* =====================================================
       HINWEISE
    ===================================================== */

    let hintTimer;

    function showHint(text, autoHide = false){

        clearTimeout(hintTimer);

        hint.textContent = text;

        hint.classList.add("show");

        if(autoHide){

            hintTimer = setTimeout(()=>{

                hideHint();

            },1800);

    }

}

    function hideHint(){

        hint.classList.remove("show");

    }

        /* =====================================================
       TV STARTEN
    ===================================================== */

    function startTV(){

        if(isStarting || isPlaying){

            return;

        }

        const item = channels[currentChannel];

        isStarting = true;

        hideHint();

        led.classList.add("on");

        playOverlay.style.opacity = "0";

        thumbnail.classList.add("fade");

        boot.classList.remove("active");
        line.classList.remove("active");
        noise.classList.remove("active");

        void boot.offsetWidth;

        boot.classList.add("active");
        line.classList.add("active");
        noise.classList.add("active");

        setTimeout(()=>{

            isStarting = false;

            if(item.type === "local"){

                thumbnail.style.display = "none";

                video.style.display = "block";

                video.classList.add("active");

                video.play();

                isPlaying = true;

            }else{

                resetTV();

                window.open(item.youtube,"_blank");

            }

        },600);

    }


    /* =====================================================
       TV ZURÜCKSETZEN
    ===================================================== */

    function resetTV(){

        isPlaying = false;

        video.pause();

        video.currentTime = 0;

        video.classList.remove("active");

        video.style.display = "none";

        thumbnail.style.display = "block";

        requestAnimationFrame(()=>{

            thumbnail.classList.remove("fade");

        });

        playOverlay.style.opacity = "1";

        led.classList.remove("on");

        boot.classList.remove("active");

        line.classList.remove("active");

        noise.classList.remove("active");

    }


    /* =====================================================
       VIDEO EVENTS
    ===================================================== */

    video.addEventListener("play",()=>{

        isPlaying = true;

    });


    video.addEventListener("ended",()=>{

        resetTV();

    });


    video.addEventListener("error",()=>{

        console.error("Video konnte nicht geladen werden.");

        resetTV();

    });


    /* =====================================================
       POWER BUTTON
    ===================================================== */

    powerButton.addEventListener("mouseenter",()=>{

        showHint("TV einschalten");

    });

    powerButton.addEventListener("mouseleave",()=>{

        hideHint();

    });

    powerButton.addEventListener("click",()=>{

    showHint("TV startet...",true);

    startTV();

    });


    /* =====================================================
       PLAY BUTTON
    ===================================================== */

    playButton.addEventListener("click",startTV);


    /* =====================================================
       CHANNEL BUTTON
    ===================================================== */

    channelButton.addEventListener("mouseenter",()=>{

        showHint("Kanal wechseln");

    });

    channelButton.addEventListener("mouseleave",()=>{

        hideHint();

    });

    channelButton.addEventListener("click",()=>{

    nextChannel();

    showHint("Kanal gewechselt",true);

    });


    /* =====================================================
       TASTATUR (OPTIONAL)
    ===================================================== */

    document.addEventListener("keydown",(e)=>{

        if(e.key==="ArrowDown"){

            nextChannel();

        }

        if(e.key==="Enter"){

            startTV();

        }

    });

/* =====================================================
   RETRO MEMORY
===================================================== */

const memory = document.querySelector(".retro-memory");

if(memory){

    const observer = new IntersectionObserver((entries)=>{

        entries.forEach(entry=>{

            if(entry.isIntersecting){

                memory.classList.add("show");

            }

        });

    },{

        threshold:.25

    });

    observer.observe(memory);

}

/* ==========================================
   MEMORY HOVER
========================================== */

const memoryPhoto = document.querySelector(".memory-photo");
const memoryType  = document.getElementById("memoryType");

const memoryText = "Unsere ersten C64 Erlebnisse";

memoryPhoto.addEventListener("mouseenter",()=>{

    memoryType.textContent="";

    let i=0;

    const timer=setInterval(()=>{

        memoryType.textContent+=memoryText.charAt(i);

        i++;

        if(i>=memoryText.length){

            clearInterval(timer);

        }

    },28);

});


updateChannel();

});