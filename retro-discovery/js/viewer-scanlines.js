/* ==========================================
   Optional CRT scanlines for the 3D viewer
========================================== */

(function initializeViewerScanlines(global){
    "use strict";

    const STORAGE_KEY = "rd-viewer-scanlines";
    let enabled = false;
    let stage = null;
    let toggle = null;
    let stateLabel = null;

    function readStoredState(){
        try{
            return global.localStorage.getItem(STORAGE_KEY) === "on";
        }catch(error){
            return false;
        }
    }

    function storeState(){
        try{
            global.localStorage.setItem(STORAGE_KEY,enabled ? "on" : "off");
        }catch(error){
            // The optional visual effect also works without web storage.
        }
    }

    function localize(){
        if(!toggle || !stateLabel) return;
        const i18n = global.RDI18n || global.SiteI18n;
        const stateKey = enabled ? "viewer.scanlinesOn" : "viewer.scanlinesOff";
        stateLabel.textContent = i18n?.t(stateKey) || (enabled ? "ON" : "OFF");
        toggle.setAttribute(
            "aria-label",
            i18n?.t("viewer.scanlinesToggle") || "Toggle scanlines"
        );
    }

    function render(){
        stage?.classList.toggle("viewer-scanlines-enabled",enabled);
        toggle?.setAttribute("aria-checked",String(enabled));
        localize();
    }

    function setEnabled(nextEnabled,{ persist=true }={}){
        enabled = Boolean(nextEnabled);
        if(persist) storeState();
        render();
        document.dispatchEvent(new CustomEvent("viewerscanlineschange",{
            detail:{ enabled }
        }));
        return enabled;
    }

    function initialize(){
        stage = document.getElementById("viewer-stage");
        toggle = document.getElementById("viewer-scanlines-toggle");
        stateLabel = document.getElementById("viewer-scanlines-state");
        if(!stage) return false;

        enabled = readStoredState();
        toggle?.addEventListener("click",()=>setEnabled(!enabled));
        document.addEventListener("rdlanguagechange",localize);
        render();
        return true;
    }

    global.ViewerScanlines = Object.freeze({
        initialize,
        isEnabled:()=>enabled,
        setEnabled
    });

    if(document.readyState === "loading"){
        document.addEventListener("DOMContentLoaded",initialize,{ once:true });
    }else{
        initialize();
    }

})(window);
