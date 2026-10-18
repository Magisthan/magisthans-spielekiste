/* ==========================================
   Gamebox Discovery
   Scan contribution dialog

   The former Community rating panel was retired in Viewer Redesign phase 8.
   This module now owns only the still active contribution dialog.
========================================== */

let currentContributionGameTitle = "";
let contributionDialogReturnFocus = null;

function setContributionDialogOpen(open){
    const dialog = document.getElementById("scan-contribution-dialog");
    const compactToggle = document.getElementById("viewer-contribute-button");
    const closeButton = document.getElementById("scan-dialog-close");

    if(!dialog) return;

    const shouldOpen = Boolean(open);
    const wasOpen = dialog.classList.contains("is-open");

    dialog.classList.toggle("is-open",shouldOpen);
    compactToggle?.setAttribute("aria-expanded",String(shouldOpen));
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

    document.dispatchEvent(new CustomEvent("scancontributionchange",{
        detail:{ open:shouldOpen }
    }));
}

function updateContributionEmailLink(){
    const emailLink = document.getElementById("scan-contribution-email");
    if(!emailLink) return;

    const gameName = currentContributionGameTitle || "Gamebox Discovery";
    const isEnglish = window.RDI18n?.getLanguage?.() === "en";
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

window.ScanContributionDialog = Object.freeze({
    open:()=>setContributionDialogOpen(true),
    close:()=>setContributionDialogOpen(false),
    isOpen:()=>document.getElementById("scan-contribution-dialog")
        ?.classList.contains("is-open") === true
});

document.addEventListener("DOMContentLoaded",()=>{
    document.getElementById("scan-dialog-close")
        ?.addEventListener("click",()=>setContributionDialogOpen(false));
    document.getElementById("scan-dialog-cancel")
        ?.addEventListener("click",()=>setContributionDialogOpen(false));
    document.querySelector("[data-scan-dialog-close]")
        ?.addEventListener("click",()=>setContributionDialogOpen(false));
    updateContributionEmailLink();
});

document.addEventListener("rdlanguagechange",updateContributionEmailLink);

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
