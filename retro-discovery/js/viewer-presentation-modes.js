/* ==========================================
   Retro Discovery viewer presentation modes
   standard | retro scanlines | museum light
========================================== */

(function initializeViewerPresentationModes(global){
    "use strict";

    const STORAGE_KEY = "rd-viewer-presentation-mode";
    const MODES = Object.freeze(["standard","retro","museum"]);
    let mode = "standard";
    let stage = null;
    let controls = null;

    function normalizeMode(value){
        return MODES.includes(value) ? value : "standard";
    }

    function readStoredMode(){
        try{
            const stored = global.localStorage.getItem(STORAGE_KEY);
            if(MODES.includes(stored)) return stored;
        }catch(error){
            // The modes remain available when storage is unavailable.
        }

        return global.ViewerScanlines?.isEnabled() ? "retro" : "standard";
    }

    function storeMode(){
        try{
            global.localStorage.setItem(STORAGE_KEY,mode);
        }catch(error){
            // Persistence is optional; the active session still works.
        }
    }

    function updateControls(){
        controls?.querySelectorAll("[data-viewer-mode]").forEach(button=>{
            button.setAttribute(
                "aria-pressed",
                String(button.dataset.viewerMode === mode)
            );
        });
    }

    function applyMode(){
        stage?.classList.toggle("viewer-retro-mode",mode === "retro");
        stage?.classList.toggle("viewer-museum-mode",mode === "museum");
        global.ViewerScanlines?.setEnabled(mode === "retro",{ persist:true });
        global.ViewerLighting?.applyProfile(mode);
        updateControls();
    }

    function setMode(nextMode,{ persist=true }={}){
        mode = normalizeMode(nextMode);
        if(persist) storeMode();
        applyMode();
        document.dispatchEvent(new CustomEvent("viewerpresentationchange",{
            detail:{ mode }
        }));
        return mode;
    }

    function initialize(){
        stage = document.getElementById("viewer-stage");
        controls = document.getElementById("viewer-presentation-modes");
        if(!stage || !controls) return false;

        mode = readStoredMode();
        controls.addEventListener("click",event=>{
            const button = event.target.closest?.("[data-viewer-mode]");
            if(button) setMode(button.dataset.viewerMode);
        });
        document.addEventListener("viewerlightingready",applyMode);
        applyMode();
        return true;
    }

    global.ViewerPresentationModes = Object.freeze({
        initialize,
        getMode:()=>mode,
        setMode,
        modes:MODES
    });

    if(document.readyState === "loading"){
        document.addEventListener("DOMContentLoaded",initialize,{ once:true });
    }else{
        initialize();
    }

})(window);
