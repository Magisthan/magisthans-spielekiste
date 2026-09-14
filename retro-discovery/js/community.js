/* ==========================================
   Retro Discovery
   Community
========================================== */

//--------------------------------------------------
// Demo Daten
//--------------------------------------------------

const COMMUNITY = {

    pirates:{

        gameplay:9.2,
        boxdesign:8.8,
        cultstatus:9.7,
        votes:421

    },

    monkey_island:{

        gameplay:9.8,
        boxdesign:9.5,
        cultstatus:10.0,
        votes:863

    }
    

};

let currentCommunityFolder = null;
let currentContributionGameTitle = "";
let contributionDialogReturnFocus = null;
let currentContributionLanguage = "de";

const SCAN_CONTRIBUTION_TRANSLATIONS = {
    de:{
        kicker:"ARCHIV UNTERSTÜTZEN",
        title:"BOX-SCANS BEITRAGEN",
        description:"Du hast eine seltene Spielebox?<br>Hilf mit, sie digital zu bewahren.",
        sides:"Vorderseite, Rückseite und Seitenflächen (insgesamt 6 Bilder)",
        content:"Inhalt und Beilagen gerne separat auf einem Bild",
        angle:"Gerade fotografiert oder gescannt",
        resolution:"Auflösung mindestens 300 dpi",
        compression:"Möglichst ohne vorherige Komprimierung",
        email:"SCANS PER E-MAIL SENDEN",
        note:"Für größere Dateien kannst du mir zunächst schreiben.",
        cancel:"SCHLIESSEN",
        closeLabel:"Dialog schließen"
    },
    en:{
        kicker:"CONTRIBUTE TO THE ARCHIVE",
        title:"CONTRIBUTE BOX SCANS",
        description:"Do you own a rare game box?<br>Help preserve it digitally.",
        sides:"Front, back and side panels (6 images in total)",
        content:"Contents and inserts may be photographed separately in one image",
        angle:"Photographed straight-on or scanned",
        resolution:"Minimum resolution of 300 dpi",
        compression:"Preferably without prior compression",
        email:"SEND SCANS BY EMAIL",
        note:"For larger files, please contact me first.",
        cancel:"CLOSE",
        closeLabel:"Close dialog"
    }
};

const INLINE_RATING_DEFAULT = 5.0;
const INLINE_RATING_FIELDS = {
    gameplay:{ valueId:"rating-game-value", fillId:"rating-game-fill" },
    boxdesign:{ valueId:"rating-box-value", fillId:"rating-box-fill" },
    cultstatus:{ valueId:"rating-cult-value", fillId:"rating-cult-fill" }
};

const inlineRating = {
    active:false,
    gameplay:INLINE_RATING_DEFAULT,
    boxdesign:INLINE_RATING_DEFAULT,
    cultstatus:INLINE_RATING_DEFAULT
};

//--------------------------------------------------
// Standardwerte
//--------------------------------------------------

const EMPTY_COMMUNITY = {

    gameplay:0,
    boxdesign:0,
    cultstatus:0,
    votes:0

};

//--------------------------------------------------
// Daten laden
//--------------------------------------------------

function getCommunityRating(folder){

    return COMMUNITY[folder] ?? EMPTY_COMMUNITY;

}

//--------------------------------------------------
// Panel aktualisieren
//--------------------------------------------------

function updateCommunityPanel(data){

    const hasRatings = data.votes > 0;

    //------------------------------------------
    // Zahlen
    //------------------------------------------

    document.getElementById("rating-game-value").textContent =
        hasRatings ? data.gameplay.toFixed(1) : "-";

    document.getElementById("rating-box-value").textContent =
        hasRatings ? data.boxdesign.toFixed(1) : "-";

    document.getElementById("rating-cult-value").textContent =
        hasRatings ? data.cultstatus.toFixed(1) : "-";

    document.getElementById("community-votes").textContent =
        hasRatings
            ? `${data.votes} Bewertungen / Votes`
            : "- Bewertungen / Votes";

    //------------------------------------------
    // Balken
    //------------------------------------------

    document.getElementById("rating-game-fill").style.width =
        `${data.gameplay*10}%`;

    document.getElementById("rating-box-fill").style.width =
        `${data.boxdesign*10}%`;

    document.getElementById("rating-cult-fill").style.width =
        `${data.cultstatus*10}%`;

}

//--------------------------------------------------
// Panel anzeigen
//--------------------------------------------------

function showCommunity(folder){

    currentCommunityFolder = folder;

    setInlineRatingMode(false,{ refresh:false });
    setContributionDialogOpen(false);

    const data = getCommunityRating(folder);
    console.log("Neue Community Daten", data);

    updateCommunityPanel(data);

    const panel =

        document.getElementById(

            "community-panel"

        );

    if(!panel) return;

    panel.classList.remove("show");

    void panel.offsetWidth;

    panel.classList.add("show");

}

//--------------------------------------------------
// Panel ausblenden
//--------------------------------------------------

function hideCommunity(){

    setInlineRatingMode(false,{ refresh:false });
    setContributionDialogOpen(false);

    document
        .getElementById("community-panel")
        ?.classList.remove("show");

}

/* ==========================================
   Neue Community Bewertung
========================================== */

function addCommunityRating(rating){
console.log("currentCommunityFolder", currentCommunityFolder);

    if(!currentCommunityFolder) return;

    if(!COMMUNITY[currentCommunityFolder]){

    COMMUNITY[currentCommunityFolder]={

        gameplay:0,
        boxdesign:0,
        cultstatus:0,
        votes:0

    };

}

const data = COMMUNITY[currentCommunityFolder];

    //------------------------------------------
    // Neue Durchschnittswerte
    //------------------------------------------

    data.gameplay =

        (

            data.gameplay * data.votes +

            rating.gameplay

        )

        /(data.votes+1);

    data.boxdesign =

        (

            data.boxdesign * data.votes +

            rating.boxdesign

        )

        /(data.votes+1);

    data.cultstatus =

        (

            data.cultstatus * data.votes +

            rating.cultstatus

        )

        /(data.votes+1);

    data.votes++;

    updateCommunityPanel(data);

    //------------------------------------------
    // Top-Discoveries-Monitor
    // Der Monitor führt momentan eine getrennte
    // Test-Top-20. Ist das bewertete Spiel dort
    // enthalten, wird sein Rang live aktualisiert.
    //------------------------------------------

    window.TopDiscoveries?.recordRatingByFolder(
        currentCommunityFolder,
        (
            rating.gameplay +
            rating.boxdesign +
            rating.cultstatus
        ) / 3
    );

}

document.addEventListener("DOMContentLoaded",()=>{

    document.querySelectorAll(".rating-slider").forEach(slider=>{

        slider.addEventListener("input",()=>{
            const type = slider.dataset.rating;
            const value = Number(slider.value);

            inlineRating[type] = value;
            updateRatingMetric(type,value);
        });

    });

    document
        .getElementById("community-rate-button")
        ?.addEventListener("click",()=>{
            if(inlineRating.active){
                submitInlineRating();
            }else{
                beginInlineRating();
            }
        });

    document
        .getElementById("community-rating-cancel")
        ?.addEventListener("click",cancelInlineRating);

    document
        .getElementById("scan-contribution-toggle")
        ?.addEventListener("click",()=>{
            setContributionDialogOpen(true);
        });

    document
        .getElementById("scan-dialog-close")
        ?.addEventListener("click",()=>setContributionDialogOpen(false));

    document
        .getElementById("scan-dialog-cancel")
        ?.addEventListener("click",()=>setContributionDialogOpen(false));

    document
        .querySelector("[data-scan-dialog-close]")
        ?.addEventListener("click",()=>setContributionDialogOpen(false));

    document.querySelectorAll("[data-scan-language]").forEach(button=>{
        button.addEventListener("click",()=>{
            setContributionLanguage(button.dataset.scanLanguage);
        });
    });

    setContributionLanguage(currentContributionLanguage);

});

document.addEventListener("gameChanged",event=>{
    currentContributionGameTitle = event.detail?.title || "";
    updateContributionEmailLink();
});

document.addEventListener("keydown",event=>{

    const dialog = document.getElementById("scan-contribution-dialog");
    if(!dialog?.classList.contains("is-open")) return;

    if(event.key === "Escape"){
        event.preventDefault();
        setContributionDialogOpen(false);
        return;
    }

    if(event.key !== "Tab") return;

    const focusable = Array.from(dialog.querySelectorAll(
        'a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])'
    ));

    if(!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if(event.shiftKey && document.activeElement === first){
        event.preventDefault();
        last.focus();
    }else if(!event.shiftKey && document.activeElement === last){
        event.preventDefault();
        first.focus();
    }

});

function updateRatingMetric(type,value){

    const field = INLINE_RATING_FIELDS[type];
    if(!field) return;

    const normalized = Math.min(10,Math.max(0,Number(value) || 0));

    document.getElementById(field.valueId).textContent =
        normalized.toFixed(1);

    document.getElementById(field.fillId).style.width =
        `${normalized*10}%`;

}

function setInlineRatingMode(active,{ refresh=true }={}){

    inlineRating.active = active;

    const card = document.querySelector(".community-card");
    const rateButton = document.getElementById("community-rate-button");
    const cancelButton = document.getElementById("community-rating-cancel");
    const votes = document.getElementById("community-votes");
    const contributionToggle = document.getElementById("scan-contribution-toggle");

    card?.classList.toggle("is-rating",active);

    if(active) setContributionDialogOpen(false);
    if(contributionToggle) contributionToggle.disabled = active;

    if(rateButton){
        rateButton.textContent = active
            ? "Bewerten / Rate"
            : "Jetzt bewerten / Vote now";
    }

    if(cancelButton) cancelButton.hidden = !active;

    document.querySelectorAll(".rating-slider").forEach(slider=>{
        slider.disabled = !active;
    });

    if(active){
        if(votes) votes.textContent = "DEINE WERTUNG";
        return;
    }

    if(refresh && currentCommunityFolder){
        updateCommunityPanel(getCommunityRating(currentCommunityFolder));
    }

}

function setContributionDialogOpen(open){

    const dialog = document.getElementById("scan-contribution-dialog");
    const toggle = document.getElementById("scan-contribution-toggle");
    const closeButton = document.getElementById("scan-dialog-close");

    if(!dialog || !toggle) return;

    const shouldOpen = Boolean(open) && !inlineRating.active;
    const wasOpen = dialog.classList.contains("is-open");

    dialog.classList.toggle("is-open",shouldOpen);
    toggle.setAttribute("aria-expanded",String(shouldOpen));
    dialog.setAttribute("aria-hidden",String(!shouldOpen));
    dialog.toggleAttribute("inert",!shouldOpen);
    document.body.classList.toggle("scan-dialog-open",shouldOpen);

    if(shouldOpen){
        contributionDialogReturnFocus = document.activeElement;
        requestAnimationFrame(()=>closeButton?.focus());
    }else if(wasOpen){
        const returnFocus = contributionDialogReturnFocus;
        contributionDialogReturnFocus = null;
        requestAnimationFrame(()=>{
            if(returnFocus?.isConnected) returnFocus.focus();
        });
    }

}

function updateContributionEmailLink(){

    const emailLink = document.getElementById("scan-contribution-email");
    if(!emailLink) return;

    const gameName = currentContributionGameTitle || "Retro Discovery";
    const isEnglish = currentContributionLanguage === "en";
    const subject = isEnglish
        ? `Box scan contribution – ${gameName}`
        : `Box-Scan Beitrag – ${gameName}`;
    const body = isEnglish
        ? [
            "Hello Magisthan,",
            "",
            `I would like to contribute box scans for “${gameName}”.`,
            "",
            "Best regards"
        ].join("\n")
        : [
            "Hallo Magisthan,",
            "",
            `ich möchte Box-Scans zu „${gameName}“ beitragen.`,
            "",
            "Viele Grüße"
        ].join("\n");

    emailLink.href =
        `mailto:magisthansspielekiste@disroot.org?subject=${encodeURIComponent(subject)}` +
        `&body=${encodeURIComponent(body)}`;

}

function setContributionLanguage(language){

    if(!SCAN_CONTRIBUTION_TRANSLATIONS[language]) return;

    currentContributionLanguage = language;
    const translation = SCAN_CONTRIBUTION_TRANSLATIONS[language];
    const dialog = document.getElementById("scan-contribution-dialog");

    if(dialog) dialog.lang = language;

    const textById = {
        "scan-dialog-kicker":translation.kicker,
        "scan-dialog-title":translation.title,
        "scan-guideline-sides":translation.sides,
        "scan-guideline-content":translation.content,
        "scan-guideline-angle":translation.angle,
        "scan-guideline-resolution":translation.resolution,
        "scan-guideline-compression":translation.compression,
        "scan-contribution-email":translation.email,
        "scan-dialog-note":translation.note,
        "scan-dialog-cancel":translation.cancel
    };

    Object.entries(textById).forEach(([id,text])=>{
        const element = document.getElementById(id);
        if(element) element.textContent = text;
    });

    const description = document.getElementById("scan-dialog-description");
    if(description) description.innerHTML = translation.description;

    const closeButton = document.getElementById("scan-dialog-close");
    if(closeButton) closeButton.setAttribute("aria-label",translation.closeLabel);

    document.querySelectorAll("[data-scan-language]").forEach(button=>{
        const isActive = button.dataset.scanLanguage === language;
        button.classList.toggle("is-active",isActive);
        button.setAttribute("aria-pressed",String(isActive));
    });

    updateContributionEmailLink();

}

function beginInlineRating(){

    Object.keys(INLINE_RATING_FIELDS).forEach(type=>{
        inlineRating[type] = INLINE_RATING_DEFAULT;

        const slider = document.querySelector(
            `.rating-slider[data-rating="${type}"]`
        );

        if(slider) slider.value = INLINE_RATING_DEFAULT.toFixed(1);
        updateRatingMetric(type,INLINE_RATING_DEFAULT);
    });

    setInlineRatingMode(true);

}

function cancelInlineRating(){
    setInlineRatingMode(false);
}

function submitInlineRating(){

    if(!inlineRating.active || !currentCommunityFolder) return;

    const submittedRating = {
        gameplay:inlineRating.gameplay,
        boxdesign:inlineRating.boxdesign,
        cultstatus:inlineRating.cultstatus
    };

    setInlineRatingMode(false,{ refresh:false });
    addCommunityRating(submittedRating);
    showRatingToast("Danke / Thanks");

}

function showRatingToast(text){

    const toast = document.createElement("div");
    toast.className = "rating-toast";
    toast.textContent = text;

    const viewerContainer = document.getElementById("viewer-container");
    (viewerContainer || document.body).appendChild(toast);

    requestAnimationFrame(()=>toast.classList.add("show"));

    setTimeout(()=>{
        toast.classList.remove("show");
        setTimeout(()=>toast.remove(),300);
    },2200);

}
