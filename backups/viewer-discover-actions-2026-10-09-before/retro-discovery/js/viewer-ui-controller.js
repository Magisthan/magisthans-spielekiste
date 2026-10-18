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

    let stage = null;
    let shell = null;
    let contentsExhibit = null;
    let overlay = null;
    let contributionOverlay = null;
    let reactionStatus = null;
    let currentGame = null;
    let overlayReturnFocus = null;
    let reactionTransitionTimer = 0;
    let reactionDismissTimer = 0;
    let reactionDismissStartedAt = 0;
    let reactionDismissRemaining = 8000;
    const visibilityTimers = new WeakMap();
    const PANEL_HIDE_DELAY = 300;
    const REACTION_DISMISS_DELAY = 8000;
    const REACTION_FLIP_DURATION = 800;

    function reactionPanel(){
        return document.querySelector(".viewer-reaction-panel");
    }

    function clearReactionDismissTimer({ reset=true }={}){
        window.clearTimeout(reactionDismissTimer);
        reactionDismissTimer = 0;
        reactionDismissStartedAt = 0;
        if(reset) reactionDismissRemaining = REACTION_DISMISS_DELAY;
    }

    function revealReactionPanel(){
        const panel = reactionPanel();
        if(!panel) return;
        panel.classList.remove("is-dismissed");
        panel.setAttribute("aria-hidden","false");
    }

    function dismissReactionPanel(){
        const panel = reactionPanel();
        if(!panel || panel.dataset.view !== "results") return;
        clearReactionDismissTimer();
        panel.classList.add("is-dismissed");
        panel.setAttribute("aria-hidden","true");
        panel.tabIndex = -1;
    }

    function scheduleReactionDismiss(delay=reactionDismissRemaining){
        const panel = reactionPanel();
        if(!panel || panel.dataset.view !== "results" || panel.classList.contains("is-dismissed")) return;
        clearReactionDismissTimer({ reset:false });
        reactionDismissRemaining = Math.max(0,delay);
        reactionDismissStartedAt = performance.now();
        reactionDismissTimer = window.setTimeout(
            dismissReactionPanel,
            reactionDismissRemaining
        );
    }

    function pauseReactionDismiss(){
        if(!reactionDismissTimer) return;
        const elapsed = performance.now() - reactionDismissStartedAt;
        reactionDismissRemaining = Math.max(0,reactionDismissRemaining - elapsed);
        clearReactionDismissTimer({ reset:false });
    }

    function resumeReactionDismiss(){
        const panel = reactionPanel();
        if(
            !panel ||
            panel.dataset.view !== "results" ||
            panel.classList.contains("is-dismissed") ||
            panel.matches(":hover") ||
            panel.contains(document.activeElement)
        ) return;
        scheduleReactionDismiss(reactionDismissRemaining);
    }

    function scheduleReactionDismissAfterFlip(){
        const reducedMotion = global.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
        window.setTimeout(
            ()=>scheduleReactionDismiss(REACTION_DISMISS_DELAY),
            reducedMotion ? 0 : REACTION_FLIP_DURATION
        );
    }

    function setAnimatedVisibility(element,visible){
        if(!element) return;

        const activeTimer = visibilityTimers.get(element);
        if(activeTimer){
            clearTimeout(activeTimer);
            visibilityTimers.delete(element);
        }

        if(visible){
            element.hidden = false;
            requestAnimationFrame(()=>{
                if(
                    !element.hidden &&
                    element.getAttribute("aria-hidden") === "false"
                ) element.classList.add("is-open");
            });
            return;
        }

        element.classList.remove("is-open");
        if(element.hidden) return;

        const timer = setTimeout(()=>{
            if(!element.classList.contains("is-open")) element.hidden = true;
            visibilityTimers.delete(element);
        },PANEL_HIDE_DELAY);
        visibilityTimers.set(element,timer);
    }

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
            setAnimatedVisibility(contentsExhibit,contentsVisible);
            contentsExhibit.setAttribute("aria-hidden",String(!contentsVisible));
        }

        if(overlay){
            const overlayVisible = state.enabled && state.activeOverlay === "info";
            setAnimatedVisibility(overlay,overlayVisible);
            overlay.setAttribute("aria-hidden",String(!overlayVisible));
            overlay.toggleAttribute("inert",!overlayVisible);
        }

        if(contributionOverlay){
            const contributionVisible =
                state.enabled && state.activeOverlay === "contribute";
            setAnimatedVisibility(contributionOverlay,contributionVisible);
            contributionOverlay.setAttribute(
                "aria-hidden",
                String(!contributionVisible)
            );
            contributionOverlay.toggleAttribute("inert",!contributionVisible);
            document.getElementById("viewer-contribute-button")
                ?.setAttribute("aria-expanded",String(contributionVisible));
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
        return global.ReactionStore?.get(gameKey) || {
            likes:0,
            dislikes:0,
            totalVotes:0,
            likePercent:0,
            dislikePercent:0,
            userReaction:null
        };
    }

    function renderReactions({ keepQuestion=false }={}){
        const record = getReactionRecord();
        const panel = document.querySelector(".viewer-reaction-panel");
        const options = document.querySelector(".viewer-reaction-options");
        const results = document.querySelector(".viewer-reaction-results");
        const frontFace = document.querySelector(".viewer-reaction-front");
        const backFace = document.querySelector(".viewer-reaction-back");
        const likeButton = document.getElementById("viewer-reaction-like");
        const dislikeButton = document.getElementById("viewer-reaction-dislike");
        const likeCount = document.getElementById("viewer-reaction-like-count");
        const dislikeCount = document.getElementById("viewer-reaction-dislike-count");
        const likePercent = document.getElementById("viewer-reaction-like-percent");
        const dislikePercent = document.getElementById("viewer-reaction-dislike-percent");
        const total = document.getElementById("viewer-reaction-total");
        const resultLike = document.querySelector('[data-result-reaction="like"]');
        const resultDislike = document.querySelector('[data-result-reaction="dislike"]');

        if(likeCount) likeCount.textContent = String(record.likes);
        if(dislikeCount) dislikeCount.textContent = String(record.dislikes);
        if(likePercent) likePercent.textContent = `${record.likePercent}%`;
        if(dislikePercent) dislikePercent.textContent = `${record.dislikePercent}%`;
        results?.style.setProperty("--like-share",`${record.likePercent}%`);
        if(total){
            total.textContent = global.RDI18n?.t(
                "viewer.totalVotes",
                { count:record.totalVotes }
            ) || `${record.totalVotes} votes`;
        }
        likeButton?.setAttribute("aria-pressed",String(record.userReaction === "like"));
        dislikeButton?.setAttribute("aria-pressed",String(record.userReaction === "dislike"));
        if(resultLike) resultLike.dataset.selected = String(record.userReaction === "like");
        if(resultDislike) resultDislike.dataset.selected = String(record.userReaction === "dislike");
        const locked = Boolean(record.userReaction);
        const showResults = !keepQuestion && Boolean(record.userReaction);
        if(panel) panel.dataset.view = showResults ? "results" : "question";
        if(panel){
            panel.tabIndex = showResults ? 0 : -1;
            panel.setAttribute(
                "aria-label",
                showResults
                    ? global.RDI18n?.t("viewer.dismissReaction") || "Hide rating"
                    : global.RDI18n?.t("viewer.reactionQuestion") || "Rate this box"
            );
        }
        frontFace?.setAttribute("aria-hidden",String(showResults));
        backFace?.setAttribute("aria-hidden",String(!showResults));
        likeButton?.toggleAttribute("disabled",locked);
        dislikeButton?.toggleAttribute("disabled",locked);
        options?.setAttribute("aria-hidden",String(showResults));
        options?.toggleAttribute("inert",locked);
        results?.setAttribute("aria-hidden",String(!showResults));
        results?.toggleAttribute("inert",!showResults);
    }

    function setCurrentGame(game){
        currentGame = game || null;
        state.currentGameKey = game?.folder || null;
        if(currentGame) global.ReactionStore?.register(currentGame);
        window.clearTimeout(reactionTransitionTimer);
        clearReactionDismissTimer();
        revealReactionPanel();
        renderInfoOverlay();
        updateContributionEmailLink();
        renderState();
        renderReactions();
        if(getReactionRecord().userReaction) scheduleReactionDismissAfterFlip();
        emitStateChange("game-changed");
        return getSnapshot();
    }

    function setReaction(reaction,{ deferResult=false }={}){
        if(!state.currentGameKey || !["like","dislike"].includes(reaction)){
            return getSnapshot();
        }

        const previous = getReactionRecord().userReaction;
        if(previous) return getSnapshot();
        clearReactionDismissTimer();
        revealReactionPanel();
        const record = global.ReactionStore?.vote(currentGame,reaction)
            || getReactionRecord();

        window.clearTimeout(reactionTransitionTimer);
        const firstVote = !previous && Boolean(record.userReaction);
        renderReactions({ keepQuestion:firstVote });
        if(firstVote && !deferResult){
            const transitionDelay = global.matchMedia?.("(prefers-reduced-motion: reduce)").matches
                ? 80
                : 1580;
            reactionTransitionTimer = window.setTimeout(()=>{
                renderReactions();
                scheduleReactionDismissAfterFlip();
            },transitionDelay);
        }

        if(reactionStatus){
            const key = record.userReaction
                ? `viewer.${record.userReaction}Recorded`
                : "viewer.reactionRemoved";
            reactionStatus.textContent = global.RDI18n?.t(key) ?? "";
        }

        emitStateChange("reaction-changed");
        return getSnapshot();
    }

    function showReactionResultsAfterPause(){
        /* MANUELL: Pause zwischen Animationsende und Flip zur Prozentanzeige. */
        const pauseAfterAnimation = 420;
        window.clearTimeout(reactionTransitionTimer);
        reactionTransitionTimer = window.setTimeout(()=>{
            renderReactions();
            scheduleReactionDismissAfterFlip();
        },pauseAfterAnimation);
    }

    function animateReactionThumb(button,onComplete){
        const thumb = button?.querySelector('span[aria-hidden="true"]');
        if(!thumb) return;

        thumb.classList.remove("is-voting");
        void thumb.offsetWidth;
        thumb.classList.add("is-voting");
        thumb.addEventListener("animationend",()=>{
            thumb.classList.remove("is-voting");
        },{ once:true });

        /* Independent from the button so locking the vote cannot hide the effect. */
        const stageRect = stage?.getBoundingClientRect();
        const thumbRect = thumb.getBoundingClientRect();
        if(!stage || !stageRect) return;

        const clone = thumb.cloneNode(true);
        clone.classList.remove("is-voting");
        clone.classList.add("viewer-reaction-wow-clone");
        clone.style.left = `${thumbRect.left - stageRect.left + thumbRect.width / 2}px`;
        clone.style.top = `${thumbRect.top - stageRect.top + thumbRect.height / 2}px`;
        stage.appendChild(clone);

        let completed = false;
        const completeAnimation = ()=>{
            if(completed) return;
            completed = true;
            clone.remove();
            onComplete?.();
        };
        clone.addEventListener("animationend",completeAnimation,{ once:true });
        window.setTimeout(completeAnimation,2200);
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
        if(mode === "info" || mode === "contribute"){
            overlayReturnFocus = document.activeElement;
            const closeButtonId = mode === "info"
                ? "viewer-overlay-close"
                : "viewer-contribution-close";
            requestAnimationFrame(()=>document.getElementById(closeButtonId)?.focus());
        }
        emitStateChange("overlay-opened");
        return getSnapshot();
    }

    function closeOverlay(){
        if(state.activeOverlay === null) return getSnapshot();

        const wasDialog = ["info","contribute"].includes(state.activeOverlay);
        state.activeOverlay = null;
        renderState();
        if(wasDialog){
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

    function updateContributionEmailLink(){
        const emailLink = document.getElementById("viewer-contribution-email");
        if(!emailLink) return;

        const gameName = localizedGame()?.title || "Gamebox Discovery";
        const isEnglish = global.RDI18n?.getLanguage?.() === "en";
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
        const activePanel = state.activeOverlay === "info"
            ? overlay
            : state.activeOverlay === "contribute"
                ? contributionOverlay
                : null;
        if(!activePanel || activePanel.hidden) return;

        if(event.key === "Escape"){
            event.preventDefault();
            closeOverlay();
            return;
        }

        if(event.key !== "Tab") return;

        const focusable = Array.from(activePanel.querySelectorAll(
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
        openOverlay("contribute");
    }

    function initialize(){
        stage = document.getElementById("viewer-stage");
        shell = document.getElementById("viewer-redesign-shell");
        contentsExhibit = document.getElementById("viewer-contents-exhibit");
        overlay = document.getElementById("viewer-redesign-overlay");
        contributionOverlay = document.getElementById("viewer-contribution-overlay");
        reactionStatus = document.getElementById("viewer-reaction-status");

        if(!stage || !shell) return false;

        const panel = reactionPanel();
        panel?.addEventListener("click",event=>{
            if(event.target.closest("[data-reaction]")) return;
            dismissReactionPanel();
        });
        panel?.addEventListener("keydown",event=>{
            if(panel.dataset.view !== "results") return;
            if(event.key !== "Enter" && event.key !== " ") return;
            event.preventDefault();
            dismissReactionPanel();
        });
        panel?.addEventListener("mouseenter",pauseReactionDismiss);
        panel?.addEventListener("mouseleave",resumeReactionDismiss);
        panel?.addEventListener("focusin",pauseReactionDismiss);
        panel?.addEventListener("focusout",()=>{
            requestAnimationFrame(resumeReactionDismiss);
        });

        document.querySelectorAll("[data-reaction]").forEach(button=>{
            button.addEventListener("click",()=>{
                animateReactionThumb(button,showReactionResultsAfterPause);
                setReaction(button.dataset.reaction,{ deferResult:true });
            });
        });
        document.getElementById("viewer-contribute-button")
            ?.addEventListener("click",openContributionDialog);

        document.getElementById("viewer-compact-info-button")
            ?.addEventListener("click",()=>openOverlay("info"));

        document.getElementById("viewer-overlay-close")
            ?.addEventListener("click",closeOverlay);
        document.getElementById("viewer-contribution-close")
            ?.addEventListener("click",closeOverlay);
        document.getElementById("viewer-contribution-cancel")
            ?.addEventListener("click",closeOverlay);
        document.getElementById("viewer-redesign-scrim")
            ?.addEventListener("click",closeOverlay);
        document.getElementById("viewer-overlay-share")
            ?.addEventListener("click",shareCurrentGame);
        document.addEventListener("keydown",handleOverlayKeyboard);
        document.addEventListener("rdlanguagechange",()=>{
            renderInfoOverlay();
            updateContributionEmailLink();
            renderReactions();
        });

        document.addEventListener("gameChanged",event=>{
            reset("game-changed-reset");
            setCurrentGame(event.detail);
        });

        // Phase 3 activates only the compact title/action presentation. The
        // contents and overlay targets remain dormant until their own phases.
        state.enabled = true;
        updateContributionEmailLink();
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
