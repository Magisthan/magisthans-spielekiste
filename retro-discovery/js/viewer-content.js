/* ==========================================
   Gamebox Discovery
   Content exhibit presentation
========================================== */

(function initializeViewerContent(global){
    "use strict";

    const CONTENT_ROOT = "../assets/textures";
    const PLACEHOLDER = "../assets/images/content-placeholder.svg";

    let currentGame = null;
    let requestSequence = 0;
    let initialized = false;
    let currentContentMissing = false;

    function text(key,fallback){
        const translated = global.RDI18n?.t(key);
        return translated && translated !== key ? translated : fallback;
    }

    function localizedGame(){
        if(!currentGame) return null;
        return global.GameLocalization?.localizeGame(
            currentGame.__sourceGame || currentGame
        ) ?? currentGame;
    }

    function setButtonState(){
        const button = document.getElementById("viewer-contents-button");
        if(!button) return;

        const inContents = global.ViewerUI?.getState().presentationMode === "contents";
        button.disabled = !currentGame;
        button.setAttribute("aria-disabled",String(!currentGame));
        button.setAttribute("aria-pressed",String(inContents));
        button.textContent = inContents
            ? text("viewer.backToBox","Zurück zur Box")
            : text("viewer.contents","Box-Inhalt");
    }

    function updateCopy(isMissing=false){
        const game = localizedGame();
        const title = document.getElementById("viewer-contents-game-title");
        const caption = document.getElementById("viewer-contents-caption");
        const image = document.getElementById("viewer-contents-image");
        const zoom = document.getElementById("viewer-contents-zoom");

        if(title) title.textContent = game?.title || "";
        if(caption){
            caption.textContent = isMissing
                ? text("viewer.contentsMissing","Noch kein Inhaltsbild vorhanden")
                : text("viewer.contentsCaption","Originaler Boxinhalt");
        }
        if(image){
            image.alt = isMissing
                ? text("viewer.contentsMissing","Noch kein Inhaltsbild vorhanden")
                : text("viewer.contentsImageAlt",`Inhalt von ${game?.title || "Spiel"}`)
                    .replace("{title}",game?.title || "");
        }
        if(zoom) zoom.hidden = isMissing || !image?.src;
    }

    function preloadImage(source){
        return new Promise((resolve,reject)=>{
            const preload = new Image();
            preload.onload = async()=>{
                try{
                    if(typeof preload.decode === "function") await preload.decode();
                    resolve(source);
                }catch(error){
                    resolve(source);
                }
            };
            preload.onerror = reject;
            preload.src = source;
        });
    }

    async function showContents(){
        const game = localizedGame();
        const image = document.getElementById("viewer-contents-image");
        const loading = document.getElementById("viewer-contents-loading");
        if(!game?.folder || !image || !global.ViewerUI) return;

        const sequence = ++requestSequence;
        image.classList.add("is-loading");
        if(loading) loading.textContent = text("viewer.contentsLoading","Inhalt wird geladen …");

        let source = `${CONTENT_ROOT}/${encodeURIComponent(game.folder)}/content.webp`;
        let missing = false;

        try{
            await preloadImage(source);
        }catch(error){
            source = PLACEHOLDER;
            missing = true;
            await preloadImage(source);
        }

        if(sequence !== requestSequence) return;

        image.src = source;
        currentContentMissing = missing;
        updateCopy(missing);
        if(!missing){
            await global.ContentImageEnhancer?.apply(image,game.contentDisplay || {});
        }else{
            global.ContentImageEnhancer?.reset(image);
        }

        if(sequence !== requestSequence) return;
        if(loading) loading.textContent = "";
        global.ViewerUI.setPresentationMode("contents");
        setButtonState();
        requestAnimationFrame(()=>image.classList.remove("is-loading"));
    }

    function showBox(){
        requestSequence += 1;
        global.ViewerUI?.setPresentationMode("box");
        setButtonState();
    }

    function openImageDialog(){
        if(currentContentMissing) return;

        const sourceImage = document.getElementById("viewer-contents-image");
        const dialog = document.getElementById("viewer-contents-dialog");
        const dialogImage = document.getElementById("viewer-contents-dialog-image");
        if(!sourceImage?.src || !dialog || !dialogImage) return;

        dialogImage.src = sourceImage.currentSrc || sourceImage.src;
        dialogImage.alt = sourceImage.alt;
        global.ContentImageEnhancer?.copy(sourceImage,dialogImage);
        dialog.showModal();
    }

    function closeImageDialog(){
        const dialog = document.getElementById("viewer-contents-dialog");
        if(dialog?.open) dialog.close();
    }

    function toggleContents(){
        const mode = global.ViewerUI?.getState().presentationMode;
        if(mode === "contents") showBox();
        else showContents();
    }

    function initialize(){
        if(initialized) return true;
        const button = document.getElementById("viewer-contents-button");
        if(!button || !global.ViewerUI) return false;
        initialized = true;

        button.addEventListener("click",toggleContents);
        document.getElementById("viewer-contents-zoom")
            ?.addEventListener("click",openImageDialog);
        document.getElementById("viewer-contents-image")
            ?.addEventListener("click",openImageDialog);
        document.getElementById("viewer-redesign-shell")
            ?.addEventListener("click",event=>{
                if(global.ViewerUI?.getState().presentationMode !== "contents") return;
                if(event.target.closest(
                    ".viewer-contents-image-frame,.viewer-redesign-interactions,.viewer-contents-dialog"
                )) return;
                showBox();
            });
        document.getElementById("viewer-contents-dialog-close")
            ?.addEventListener("click",closeImageDialog);
        document.getElementById("viewer-contents-dialog")
            ?.addEventListener("click",event=>{
                if(
                    event.target === event.currentTarget ||
                    event.target.classList?.contains("viewer-contents-dialog-panel")
                ) closeImageDialog();
            });
        document.addEventListener("gameChanged",event=>{
            requestSequence += 1;
            currentGame = event.detail || null;
            currentContentMissing = false;
            closeImageDialog();
            updateCopy(false);
            setButtonState();
        });
        document.addEventListener("vieweruistatechange",event=>{
            if(!event.detail.currentGameKey){
                currentGame = null;
                requestSequence += 1;
                closeImageDialog();
            }
            setButtonState();
        });
        document.addEventListener("rdlanguagechange",()=>{
            updateCopy(
                /content-placeholder\.svg(?:$|[?#])/i.test(
                    document.getElementById("viewer-contents-image")?.src || ""
                )
            );
            setButtonState();
        });

        setButtonState();
        return true;
    }

    if(document.readyState === "loading"){
        document.addEventListener("DOMContentLoaded",initialize,{ once:true });
    }else{
        initialize();
    }

})(window);
