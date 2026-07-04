document.addEventListener("DOMContentLoaded", () => {
  
 /* ==========================================
   ELEMENTE
========================================== */

const timeline = document.querySelector(".savegame-card");

const progress = document.querySelector(".timeline-progress");

const items = [...document.querySelectorAll(".timeline-item")];


/* ==========================================
   MEMORY CARD
========================================== */

const memory = document.getElementById("retro-memory");

const memorySlot = document.getElementById("memory-slot");

const memoryDate = document.getElementById("memory-date");

const memoryImage = document.getElementById("memory-image");

const memoryTitle = document.getElementById("memory-title");

const memorySummary = document.getElementById("memory-summary");

const memoryTags = document.getElementById("memory-tags");

const memoryStory = document.getElementById("memory-story");

const memoryStoryText = document.getElementById("memory-story-text");

const memoryToggle = document.getElementById("memory-toggle");


/* ==========================================
   PRÜFUNG
========================================== */

if(

    !timeline ||

    !progress ||

    !memory ||

    !memorySlot ||

    !memoryDate ||

    !memoryImage ||

    !memoryTitle ||

    !memorySummary ||

    !memoryTags ||

    !memoryStory ||

    !memoryStoryText ||

    !memoryToggle

){

    console.warn("Timeline: Elemente fehlen.");

    return;

}


/* ==========================================
   STATUS
========================================== */

let timelineRunning = false;

let introFinished = false;

let currentYear = null;

let storyOpen = false;

/* ==========================================
   SAVEGAME DATEN
========================================== */

const data = {

    1987:{

        slot:"SAVEGAME #01",

        date:"1987",

        title:"DER ANFANG",

        summary:"Mein Einstieg in die Welt des Commodore 64.",

        image:"assets/images/c64-timeline.webp", 

        tags:[
            "1541-II",
            "BASIC",
            "Vermeer",
            'LOAD"*",8,1'
        ],

        story:`
<h4>Eigentlich wollte ich nur ein bisschen spielen...</h4>
<p>
Eigentlich wollte ich nur ein bisschen spielen...
Wenn ich heute darüber nachdenke, hat alles mit einer ziemlich einfachen Idee 
begonnen: "Lass uns ein Spiel starten."
Gut... beim Commodore 64 meines Cousins bedeutete das damals allerdings etwas 
anderes als heute. Er gehörte zu den Glücklichen, die schon sehr früh einen C64 besaßen
selbstverständlich mit Datasette. 
</p>

<p>
Unser typischer Ablauf war daher ungefähr so:
"Wir laden jetzt das Spiel... und solange gehen wir erst einmal eine Runde Fußball spielen."
Das war kein Scherz. Bis manche Spiele endlich geladen waren, konnte man tatsächlich noch 
etwas anderes unternehmen. Damals ahnte ich natürlich noch nicht, dass mich dieser kleine 
Brotkasten viele Jahrzehnte begleiten würde.
</p>

<h4>Der erste eigene C64</h4>

<p>
Mit ungefähr elf Jahren war es dann endlich soweit: Mein eigener Commodore 64 zog ein.
Diesmal sogar schon mit einer 1541-II-Floppy und einem MPS-Nadeldrucker. Rückblickend war 
das fast schon Luxus.
Die ersten Spiele, die mich wirklich in ihren Bann zogen, waren Moon Cresta und Vermeer. Besonders Vermeer faszinierte mich. Damals verstand ich wahrscheinlich nur die Hälfte dessen, was ich eigentlich tat – aber genau das machte den Reiz aus.
Es folgten Klassiker wie Maniac Mansion, Zak McKracken, International Karate, R-Type oder Katakis. Stunden wurden zu Tagen, Tage zu Ferien und Ferien schienen grundsätzlich viel zu kurz zu sein.
</p>

<h4>BASIC</h4>

<p>
Natürlich wollte ich irgendwann auch selbst Spiele programmieren.
Also begann ich mit BASIC.
Die Ergebnisse waren... nennen wir sie "überschaubar".
Ein paar Programme funktionierten sogar. Viele andere sorgten eher für 
kryptische Fehlermeldungen und spontane Systemabstürze.
Assembler? Den habe ich nie gelernt.
Vielleicht war das auch besser so. Wahrscheinlich wären dadurch einige 
Joysticks in ernsthafte Gefahr geraten.
</p>

`

    },

    1991:{

        slot:"SAVEGAME #02",

        date:"1991",

        title:"AMIGA LIEBE",

        summary:"Monkey Island, Turrican und Chaos Engine machten den Amiga zu meinem Lieblingsrechner.",

        image:"assets/images/amiga-timeline.webp",

        tags:[
            "Amiga 500",
            "Workbench",
            "Monkey Island",
            "Turrican"
        ],

        story:`

<h4>Willkommen Amiga!</h4>
<p>
Mit ungefähr vierzehn Jahren zog schließlich ein Amiga 500 bei mir ein.
Natürlich blieb es nicht beim Grundgerät. Ein zweites Diskettenlaufwerk 
musste her. Speichererweiterung ebenfalls. Und irgendwann stand auch noch 
ein gebrauchter Commodore-Monitor auf dem Schreibtisch.
Der Amiga wurde schnell zum Mittelpunkt vieler Nachmittage.
</p>

<h4>Mit Freunden macht es noch mal so viel Spass</h4>

<p>
Mal spielte ich allein. Mal mit einem Freund. Und manchmal mit einer ganzen Gruppe.
Besonders in Erinnerung geblieben sind die legendären Oil-Imperium-Runden. Da immer 
nur ein Spieler gleichzeitig an den Bildschirm durfte, mussten alle anderen den Raum 
verlassen. Heute klingt das fast absurd. Damals war das vollkommen normal.
Und erstaunlicherweise funktionierte das sogar.

</p>

`

    },

    1996:{

        slot:"SAVEGAME #03",

        date:"1996",

        title:"DER ERSTE PC",

        summary:"Mit dem ersten PC begann ein neues Kapitel.",

        image:"assets/images/pc-timeline.webp",

        tags:[
            "DOS",
            "Windows 98",
            "3dfx",
            "Command & Conquer"
        ],

        story:`

<h4>Dann kam der erste PC</h4>
<p>
Irgendwann hielt schließlich auch der erste PC Einzug.
Ein 486 DX2 mit sagenhaften 66 MHz.
Plötzlich gab es VGA-Grafik, Soundkarten und ganz neue Spielewelten.
In vielen Bereichen war der PC überlegen.
Trotzdem blieb der Amiga noch lange griffbereit. Manche Spiele fühlten sich dort einfach... 
richtiger an. Mit den Jahren wurde der PC schließlich zum Alltagsgerät.
Das Spielen wurde seltener. Beruf, Alltag und andere Hobbys rückten in den Vordergrund.

</p>
`

    },

    2023:{

        slot:"SAVEGAME #04",

        date:"2023",

        title:"YOUTUBE",

        summary:"Aus einem Hobby entstand Magisthans Spielekiste.",

        image:"assets/images/youtube-timeline.webp",

        tags:[
            "YouTube",
            "Let's Plays",
            "Retro",
            "Community"
        ],

        story:`

<h4>Die alte Liebe kehrt zurück...</h4>
<p>
Viele Jahre später passierte etwas, womit ich selbst nicht gerechnet hätte.
Durch einen guten Freund kam ich wieder mit der C64- und Amiga-Community in Kontakt.
Plötzlich entdeckte ich neue Spiele.
Neue Hardware.
Neue Demos.
Und vor allem viele Menschen, die diese alten Computer bis heute mit unglaublich viel 
Leidenschaft am Leben erhalten. Je mehr ich mich damit beschäftigte, desto stärker wurde 
die alte Begeisterung. Nur eines fehlte noch: Die Motivation, all die alten Spiele 
tatsächlich wieder regelmäßig zu spielen.

</p>

<h4>Die verrückte Idee mit YouTube</h4>

<p>
Also machte ich etwas, womit ich das Spielen gleich mit etwas völlig Neuem verbinden konnte.
Ich eröffnete einen eigenen YouTube-Kanal. Plötzlich ging es nicht mehr nur um Spiele. Ich 
lernte Videos aufzunehmen. Zu schneiden. Thumbnails zu erstellen. SEO. Tonbearbeitung.
Und überhaupt alles, was hinter einem YouTube-Kanal steckt.
Rückblickend war das fast noch spannender als manche Spiele selbst.

</p>

`

    },

    2026:{

        slot:"SAVEGAME #05",

        date:"Heute",

        title:"RETRO NEWS FLASH",

        summary:"Jede Woche neue Spiele, Hardware und Demos rund um Commodore 64 und Amiga.",

        image:"assets/images/heute-timeline.webp",

        tags:[
            "News",
            "C64",
            "Amiga",
            "Homebrew"
        ],

        story:`

<h4>Wie der Retro News Flash entstand</h4>
<p>
Mit jedem neuen Video kamen neue Zuschauer hinzu. Und irgendwann stellte ich mir eine 
einfache Frage: Warum eigentlich immer nur über alte Spiele sprechen? Jede Woche erscheinen 
neue Homebrew-Spiele für C64 und Amiga. Neue Demos. Neue Hardware. Neue Projekte.
Aber viele bekommen davon kaum etwas mit. Ende 2024 entstand deshalb der Retro News Flash.
Seitdem berichte ich jede Woche über genau diese Entwicklungen und versuche, möglichst 
viele spannende Projekte vorzustellen.


</p>

<h4>HEUTE</h4>

<p>
Heute gehört der Retro News Flash fest zu meinem Wochenablauf. Daneben gibt es gemeinsam 
mit meinem langjährigen Freund Sascha den Kanal "Die Pixelkumpel", auf dem wir alte Spiele 
neu entdecken, Erinnerungen austauschen und uns gelegentlich darüber streiten, wer eigentlich
gerade den größten Unsinn gemacht hat. Außerdem schreibe ich regelmäßig Artikel für die 
Computerzeitschrift Amiga Future und freue mich, auf diese Weise ebenfalls einen kleinen 
Beitrag zur Community leisten zu dürfen.

</p>

<h4>Mein Wunsch für die Zukunft...</h4>

<p>
Ich wünsche mir, dass die C64- und Amiga-Szene auch in Zukunft weiter wächst.
Dass neue Entwickler den Mut haben, ihre Ideen umzusetzen.
Dass noch mehr Menschen entdecken, wie lebendig diese Computer bis heute sind.
Und natürlich hoffe ich auch, dass sich mein Kanal weiterentwickelt, noch mehr Retro-Fans 
erreicht und ich viele weitere Jahre jede Woche über neue Spiele, neue Ideen und neue 
Projekte berichten darf. Denn ganz ehrlich: Eigentlich wollte ich damals nur ein 
bisschen spielen. Dass daraus einmal all das entstehen würde, hätte ich nie gedacht.

</p>

`

    }

};


/* ==========================================
   MEMORY WECHSELN
========================================== */

function changeMemory(year){

    const entry = data[year];

    if(!entry){
        return;
    }

    if(currentYear === year){
        return;
    }

    currentYear = year;

    /* Story immer schließen */

    memoryStory.classList.remove("open");

    storyOpen = false;

    memoryToggle.textContent = "► Erinnerungen anzeigen";

    /* Inhalt weich ausblenden */

    memory.classList.add("memory-changing");

    setTimeout(()=>{

        /* Header */

        memorySlot.textContent = entry.slot;

        memoryDate.textContent = entry.date;

        /* Bild */

        memoryImage.style.opacity = 0;
        memoryImage.style.transform = "scale(.95)";

        setTimeout(()=>{

            memoryImage.src = entry.image;

        },120);

        memoryImage.onload = ()=>{

            memoryImage.style.opacity = 1;
            memoryImage.style.transform = "scale(1)";

        };

        /* Titel */

        memoryTitle.textContent = entry.title;

        /* Kurzbeschreibung */

        memorySummary.textContent = entry.summary;

        /* Tags */

        memoryTags.innerHTML = "";

        entry.tags.forEach((tag,index)=>{

            const span = document.createElement("span");

            span.textContent = tag;

            span.style.opacity = 0;

            span.style.transform = "translateY(8px)";

            memoryTags.appendChild(span);

            setTimeout(()=>{

                span.style.transition =
                    "all .35s ease";

                span.style.opacity = 1;

                span.style.transform =
                    "translateY(0)";

            },80*index);

        });

        /* Story */

        memoryStoryText.innerHTML = entry.story;

        /* Einblenden */

        memory.classList.remove("memory-changing");

    },260);

}

/* ==========================================
   STORY ÖFFNEN / SCHLIESSEN
========================================== */

function toggleStory(){

    storyOpen = !storyOpen;

    if(storyOpen){

        memoryStory.classList.add("open");

        memoryToggle.textContent =

            "▼ Erinnerungen ausblenden";

        /*
        Erst Karte öffnen...
        */

        setTimeout(()=>{

            /*
            ...dann Text weich einblenden
            */

            memoryStory.classList.add("show-text");

        },450);

    }

    else{

        /*
        Text zuerst ausblenden
        */

        memoryStory.classList.remove("show-text");

        /*
        kleine Pause,
        danach Karte schließen
        */

        setTimeout(()=>{

            memoryStory.classList.remove("open");
            memoryStory.classList.remove("show-text");

        },180);

        memoryToggle.textContent=

            "► Erinnerungen anzeigen";

    }

}

/* ==========================================
   BUTTON
========================================== */

memoryToggle.addEventListener("click", toggleStory);


/* ==========================================
   TIMELINE START
========================================== */

function startTimeline(){

    if(timelineRunning){
        return;
    }

    timelineRunning = true;
    introFinished = false;

    /* Progress zurücksetzen */

    progress.getAnimations().forEach(animation=>animation.cancel());

    progress.style.width="0%";

    progress.animate(

        [

            { width:"0%" },

            { width:"100%" }

        ],

        {

            duration:5200,

            easing:"ease-in-out",

            fill:"forwards"

        }

    );

    /* Punkte zurücksetzen */

    items.forEach(item=>{

        item.classList.remove("show");
        item.classList.remove("active");

    });

    /* Punkte nacheinander anzeigen */

    items.forEach((item,index)=>{

        setTimeout(()=>{

            item.classList.add("show");

        },500 + index*700);

    });

    /* Danach darf geklickt werden */

    setTimeout(()=>{

        introFinished=true;

        /* ersten Punkt automatisch aktivieren */

        items[0].classList.add("active");

        changeMemory(items[0].dataset.year);

    },5200);

}

/* ==========================================
   TIMELINE KLICK
========================================== */

items.forEach(item=>{

    item.addEventListener("click",()=>{

        if(!introFinished){
            return;
        }

        items.forEach(i=>{

            i.classList.remove("active");

        });

        item.classList.add("active");

        changeMemory(item.dataset.year);

    });

});

/* ==========================================
   SCROLL OBSERVER
========================================== */

const observer = new IntersectionObserver(

    entries=>{

        entries.forEach(entry=>{

            if(entry.isIntersecting){

                startTimeline();

            }

        });

    },

    {

        threshold:.25,

        rootMargin:"0px 0px -15% 0px"

    }

);

observer.observe(timeline);

/* ==========================================
   STARTWERT
========================================== */

changeMemory("1987");

});
