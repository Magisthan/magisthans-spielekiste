/* ==========================================
   Gamebox Discovery
   Viewer UI state controller
========================================== */

(function initializeViewerUiController(global){
    "use strict";

    const PRESENTATION_MODES = new Set(["box","contents"]);
    const OVERLAY_MODES = new Set([
        null,
        "info",
        "review",
        "worthPlaying",
        "trivia",
        "contribute"
    ]);

    const state = {
        enabled:false,
        presentationMode:"box",
        activeOverlay:null,
        currentGameKey:null
    };

    const reactions = new Map();

    let stage = null;
    let shell = null;
    let contentsExhibit = null;
    let overlay = null;
    let reactionStatus = null;
    let currentGame = null;
    let overlayReturnFocus = null;

    function getSnapshot(){
        return Object.freeze({ ...state });
    }

    function emitStateChange(reason){
        document.dispatchEvent(new CustomEvent("vieweruistatechange",{
            detail:{
                ...getSnapshot(),
                reason
            }
        }));
    }

    function renderState(){
        if(!stage || !shell) return;

        stage.classList.toggle("viewer-redesign-enabled",state.enabled);
        stage.classList.toggle(
            "viewer-contents-active",
            state.enabled && state.presentationMode === "contents"
        );
        shell.hidden = !state.enabled;
        shell.toggleAttribute("inert",!state.enabled);
        shell.setAttribute("aria-hidden",String(!state.enabled));
        shell.dataset.presentationMode = state.presentationMode;
        shell.dataset.activeOverlay = state.activeOverlay || "none";
        shell.dataset.hasGame = String(Boolean(state.currentGameKey));

        if(contentsExhibit){
            const contentsVisible = state.enabled && state.presentationMode === "contents";
            contentsExhibit.hidden = !contentsVisible;
            contentsExhibit.setAttribute("aria-hidden",String(!contentsVisible));
        }

        if(overlay){
            const overlayVisible = state.enabled && state.activeOverlay === "info";
            overlay.hidden = !overlayVisible;
            overlay.setAttribute("aria-hidden",String(!overlayVisible));
        }
    }

    function setEnabled(enabled){
        const nextEnabled = Boolean(enabled);
        if(state.enabled === nextEnabled) return getSnapshot();

        state.enabled = nextEnabled;
        document.documentElement.classList.toggle("viewer-redesign-active",nextEnabled);

        if(!nextEnabled){
            state.presentationMode = "box";
            state.activeOverlay = null;
        }

        renderState();
        emitStateChange(nextEnabled ? "enabled" : "disabled");
        return getSnapshot();
    }

    function getReactionRecord(gameKey=state.currentGameKey){
        if(!gameKey) return { likes:0,dislikes:0,userReaction:null };

        if(!reactions.has(gameKey)){
            reactions.set(gameKey,{ likes:0,dislikes:0,userReaction:null });
        }

        return reactions.get(gameKey);
    }

    function renderReactions(){
        const record = getReactionRecord();
        const likeButton = document.getElementById("viewer-reaction-like");
        const dislikeButton = document.getElementById("viewer-reaction-dislike");
        const likeCount = document.getElementById("viewer-reaction-like-count");
        const dislikeCount = document.getElementById("viewer-reaction-dislike-count");

        if(likeCount) likeCount.textContent = String(record.likes);
        if(dislikeCount) dislikeCount.textContent = String(record.dislikes);
        likeButton?.setAttribute("aria-pressed",String(record.userReaction === "like"));
        dislikeButton?.setAttribute("aria-pressed",String(record.userReaction === "dislike"));
    }

    function setCurrentGame(game){
        currentGame = game || null;
        state.currentGameKey = game?.folder || null;
        renderInfoOverlay();
        renderState();
        renderReactions();
        emitStateChange("game-changed");
        return getSnapshot();
    }

    function setReaction(reaction){
        if(!state.currentGameKey || !["like","dislike"].includes(reaction)){
            return getSnapshot();
        }

        const record = getReactionRecord();
        const previous = record.userReaction;

        if(previous === reaction){
            record[`${reaction}s`] = Math.max(0,record[`${reaction}s`] - 1);
            record.userReaction = null;
        }else{
            if(previous){
                record[`${previous}s`] = Math.max(0,record[`${previous}s`] - 1);
            }
            record[`${reaction}s`] += 1;
            record.userReaction = reaction;
        }

        renderReactions();

        if(reactionStatus){
            const key = record.userReaction
                ? `viewer.${record.userReaction}Recorded`
                : "viewer.reactionRemoved";
            reactionStatus.textContent = global.RDI18n?.t(key) ?? "";
        }

        emitStateChange("reaction-changed");
        return getSnapshot();
    }

    function animateReactionThumb(button){
        const thumb = button?.querySelector('span[aria-hidden="true"]');
        if(!thumb) return;

        thumb.classList.remove("is-voting");
        void thumb.offsetWidth;
        thumb.classList.add("is-voting");
        thumb.addEventListener("animationend",()=>{
            thumb.classList.remove("is-voting");
        },{ once:true });
    }

    function setPresentationMode(mode){
        if(!PRESENTATION_MODES.has(mode)){
            throw new TypeError(`Unknown viewer presentation mode: ${mode}`);
        }

        if(state.presentationMode === mode) return getSnapshot();

        state.presentationMode = mode;
        state.activeOverlay = null;
        renderState();
        emitStateChange("presentation");
        return getSnapshot();
    }

    function openOverlay(mode){
        if(!OVERLAY_MODES.has(mode) || mode === null){
            throw new TypeError(`Unknown viewer overlay mode: ${mode}`);
        }

        if(state.activeOverlay === mode) return getSnapshot();

        state.activeOverlay = mode;
        renderState();
        if(mode === "info"){
            overlayReturnFocus = document.activeElement;
            requestAnimationFrame(()=>document.getElementById("viewer-overlay-close")?.focus());
        }
        emitStateChange("overlay-opened");
        return getSnapshot();
    }

    function closeOverlay(){
        if(state.activeOverlay === null) return getSnapshot();

        const wasInfo = state.activeOverlay === "info";
        state.activeOverlay = null;
        renderState();
        if(wasInfo){
            const returnFocus = overlayReturnFocus;
            overlayReturnFocus = null;
            requestAnimationFrame(()=>{
                if(returnFocus?.isConnected) returnFocus.focus();
            });
        }
        emitStateChange("overlay-closed");
        return getSnapshot();
    }

    function reset(reason="reset"){
        state.presentationMode = "box";
        state.activeOverlay = null;
        renderState();
        emitStateChange(reason);
        return getSnapshot();
    }

    function localizedGame(){
        if(!currentGame) return null;
        return global.GameLocalization?.localizeGame(
            currentGame.__sourceGame || currentGame
        ) ?? currentGame;
    }

    function localizedGenres(genres){
        return (Array.isArray(genres) ? genres : [genres])
            .map(value=>String(value ?? "").trim())
            .filter(Boolean)
            .map(genre=>{
                const key = `genre.${genre}`;
                const translated = global.RDI18n?.t(key);
                return translated && translated !== key ? translated : genre;
            })
            .join(", ");
    }

    function normalizeEditorialContent(content){
        return Array.isArray(content)
            ? content.map(item=>String(item ?? "").trim()).filter(Boolean).join("\n\n")
            : String(content ?? "").trim();
    }

    function setText(id,value,fallback="–"){
        const element = document.getElementById(id);
        if(element) element.textContent = value || fallback;
    }

    function configureOverlayEditorialButton(id,content,headingKey){
        const button = document.getElementById(id);
        if(!button) return;

        const normalized = normalizeEditorialContent(content);
        button.hidden = !normalized;
        button.onclick = normalized
            ? ()=>global.openEditorialDialog?.(headingKey,normalized,button)
            : null;
    }

    function configureExternalLink(id,url){
        const link = document.getElementById(id);
        if(!link) return false;

        const validUrl = typeof url === "string" && url.trim() !== "";
        link.hidden = !validUrl;
        if(validUrl) link.href = url;
        else link.removeAttribute("href");
        return validUrl;
    }

    function renderInfoOverlay(){
        const game = localizedGame();
        if(!game) return;

        setText("viewer-overlay-title",game.title);
        setText(
            "viewer-overlay-meta",
            [game.system,localizedGenres(game.genre),game.year]
                .filter(Boolean)
                .join(" · ")
        );
        setText("viewer-overlay-developer",game.developer);
        setText("viewer-overlay-publisher",game.publisher);

        const artists = (game.boxArtists || [])
            .map(value=>String(value ?? "").trim())
            .filter(Boolean);
        setText(
            "viewer-overlay-boxartist",
            artists.join(", "),
            global.RDI18n?.t("info.noData") || "–"
        );

        configureOverlayEditorialButton("viewer-overlay-review",game.review,"reviewHeading");
        configureOverlayEditorialButton(
            "viewer-overlay-worth-playing",
            game.worthPlaying,
            "worthPlayingHeading"
        );
        const hasExternalLinks = [
            configureExternalLink("viewer-overlay-mobygames",game.links?.mobygames),
            configureExternalLink("viewer-overlay-wikipedia",game.links?.wikipedia),
            configureExternalLink("viewer-overlay-gog",game.links?.gog),
            configureExternalLink("viewer-overlay-letsplay",game.letsPlay)
        ].some(Boolean);
        const linksSection = document.getElementById("viewer-overlay-links");
        if(linksSection) linksSection.hidden = !hasExternalLinks;
    }

    async function shareCurrentGame(){
        if(!currentGame) return;

        const shareButton = document.getElementById("viewer-overlay-share");
        const url = `${global.location.origin}${global.location.pathname}?game=${encodeURIComponent(currentGame.folder)}`;

        try{
            await navigator.clipboard.writeText(url);
            if(shareButton) shareButton.textContent = global.RDI18n?.t("info.copied") || "✓";
            window.setTimeout(()=>{
                if(shareButton) shareButton.textContent = global.RDI18n?.t("info.share") || "Share";
            },2000);
        }catch(error){
            global.prompt("Copy link",url);
        }
    }

    function handleOverlayKeyboard(event){
        if(state.activeOverlay !== "info" || !overlay || overlay.hidden) return;

        if(event.key === "Escape"){
            event.preventDefault();
            closeOverlay();
            return;
        }

        if(event.key !== "Tab") return;

        const focusable = Array.from(overlay.querySelectorAll(
            'a[href],button:not([disabled]):not([hidden]),[tabindex]:not([tabindex="-1"])'
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
    }

    function openContributionDialog(){
        closeOverlay();
        state.activeOverlay = "contribute";
        renderState();
        emitStateChange("contribution-opened");
        global.ScanContributionDialog?.open();
    }

    function initialize(){
        stage = document.getElementById("viewer-stage");
        shell = document.getElementById("viewer-redesign-shell");
        contentsExhibit = document.getElementById("viewer-contents-exhibit");
        overlay = document.getElementById("viewer-redesign-overlay");
        reactionStatus = document.getElementById("viewer-reaction-status");

        if(!stage || !shell) return false;

        document.querySelectorAll("[data-reaction]").forEach(button=>{
            button.addEventListener("click",()=>{
                setReaction(button.dataset.reaction);
                animateReactionThumb(button);
            });
        });

        document.getElementById("viewer-contribute-button")
            ?.addEventListener("click",openContributionDialog);

        document.getElementById("viewer-compact-info-button")
            ?.addEventListener("click",()=>openOverlay("info"));

        document.getElementById("viewer-overlay-close")
            ?.addEventListener("click",closeOverlay);
        document.getElementById("viewer-redesign-scrim")
            ?.addEventListener("click",closeOverlay);
        document.getElementById("viewer-overlay-share")
            ?.addEventListener("click",shareCurrentGame);
        document.addEventListener("keydown",handleOverlayKeyboard);
        document.addEventListener("rdlanguagechange",renderInfoOverlay);
        document.addEventListener("scancontributionchange",event=>{
            const isOpen = Boolean(event.detail?.open);
            const button = document.getElementById("viewer-contribute-button");
            button?.setAttribute("aria-expanded",String(isOpen));

            if(!isOpen && state.activeOverlay === "contribute"){
                state.activeOverlay = null;
                renderState();
                emitStateChange("contribution-closed");
            }
        });

        document.addEventListener("gameChanged",event=>{
            reset("game-changed-reset");
            setCurrentGame(event.detail);
        });

        // Phase 3 activates only the compact title/action presentation. The
        // contents and overlay targets remain dormant until their own phases.
        state.enabled = true;
        renderState();
        document.documentElement.classList.add("viewer-redesign-active");
        return true;
    }

    global.ViewerUI = Object.freeze({
        initialize,
        getState:getSnapshot,
        setEnabled,
        setCurrentGame,
        setReaction,
        setPresentationMode,
        openOverlay,
        closeOverlay,
        reset
    });

    if(document.readyState === "loading"){
        document.addEventListener("DOMContentLoaded",initialize,{ once:true });
    }else{
        initialize();
    }

})(window);
