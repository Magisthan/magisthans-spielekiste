/* Gamebox Discovery: Wilson-ranked thumb reactions. */
(() => {
    "use strict";

    const TOP_LIMIT = 20;
    const MIN_RANKING_VOTES = 5;
    const WILSON_Z = 1.96;
    const ROW_HEIGHT = 79;
    const SCROLL_SPEED = 11;
    const UPDATE_PAUSE = 2000;
    const MOBILE_ROTATION_INTERVAL = 5000;

    const SEED_REACTIONS = [
        { id:1,folder:"pirates",title:"Sid Meier's Pirates!",system:"Amiga",likes:126,dislikes:2 },
        { id:5,folder:"vermeer-c64",title:"Vermeer",system:"C64",likes:89,dislikes:2 },
        { id:2,folder:"ports-of-call-eu",title:"Ports of Call",system:"Amiga",likes:83,dislikes:3 },
        { id:7,folder:"dotc-c64-us",title:"Defender of the Crown",system:"C64",likes:64,dislikes:1 },
        { id:11,folder:"patrizier-cd-v1",title:"Der Patrizier",system:"MS-DOS",likes:59,dislikes:1 },
        { id:15,folder:"1869",title:"1869 – Hart am Wind",system:"Amiga",likes:70,dislikes:3 },
        { id:16,folder:"burntime",title:"Burntime",system:"Amiga",likes:66,dislikes:3 },
        { id:19,folder:"fugger-c64",title:"Die Fugger",system:"C64",likes:43,dislikes:1 },
        { id:20,folder:"fugger-2-v2",title:"Die Fugger II",system:"PC",likes:50,dislikes:2 },
        { id:18,folder:"champions-of-krynn-amiga-eu",title:"Champions of Krynn",system:"Amiga",likes:34,dislikes:1 },
        { id:17,folder:"rings-of-medusa",title:"Rings of Medusa",system:"Amiga",likes:51,dislikes:4 },
        { id:6,folder:"hanse-c64",title:"Hanse",system:"C64",likes:48,dislikes:3 },
        { id:4,folder:"kaiser",title:"Kaiser",system:"C64",likes:29,dislikes:2 },
        { id:10,folder:"pirates-cd32",title:"Pirates! Gold",system:"CD32",likes:32,dislikes:2 },
        { id:14,folder:"phantasie-ldw-c64",title:"Phantasie",system:"C64",likes:23,dislikes:1 },
        { id:8,folder:"neverwinter-nights-ssi-v1",title:"Neverwinter Nights",system:"IBM-PC",likes:26,dislikes:1 },
        { id:13,folder:"galactic-adventures",title:"Galactic Adventures",system:"Amiga",likes:35,dislikes:4 },
        { id:9,folder:"regent-ce",title:"Regent",system:"IBM-PC-DOS",likes:29,dislikes:3 },
        { id:22,folder:"7thguest",title:"The 7th Guest",system:"PC",likes:19,dislikes:2 },
        { id:23,folder:"7cities_of_gold_c64",title:"The Seven Cities of Gold",system:"C64",likes:17,dislikes:1 }
    ];

    window.ReactionStore?.seed(SEED_REACTIONS);
    let discoveries = window.ReactionStore?.all() || SEED_REACTIONS;
    let desktopTrack;
    let mobileCurrent;
    let offset = 0;
    let loopHeight = 0;
    let lastFrame = 0;
    let pauseUntil = 0;
    let highlightedFolder = null;
    let mobileIndex = 0;

    function wilsonScore(likes,dislikes,z=WILSON_Z){
        const positive = Math.max(0,Number(likes) || 0);
        const negative = Math.max(0,Number(dislikes) || 0);
        const votes = positive + negative;
        if(!votes) return 0;
        const approval = positive / votes;
        const zSquared = z * z;
        return (
            approval + zSquared / (2 * votes) -
            z * Math.sqrt(
                (approval * (1 - approval) + zSquared / (4 * votes)) / votes
            )
        ) / (1 + zSquared / votes);
    }

    function rankedDiscoveries(){
        return discoveries
            .map(entry => {
                const likes = Math.max(0,Number(entry.likes) || 0);
                const dislikes = Math.max(0,Number(entry.dislikes) || 0);
                const votes = likes + dislikes;
                return {
                    ...entry,
                    likes,
                    dislikes,
                    votes,
                    approvalPercent:votes ? Math.round(likes / votes * 100) : 0,
                    score:wilsonScore(likes,dislikes)
                };
            })
            .filter(entry => entry.votes >= MIN_RANKING_VOTES)
            .sort((a,b) => b.score - a.score || b.votes - a.votes || b.likes - a.likes)
            .slice(0,TOP_LIMIT);
    }

    function localizedVotes(count){
        const key = count === 1 ? "top.vote" : "top.votes";
        const translated = window.RDI18n?.t(key,{ count });
        return translated && translated !== key ? translated : `${count} VOTES`;
    }

    function rowMarkup(entry,rank,duplicate){
        const isHighlighted = entry.folder === highlightedFolder && !duplicate;
        const delta = entry.rankDelta
            ? `<span class="top-discovery-delta">▲${entry.rankDelta}</span>`
            : entry.isNew
                ? `<span class="top-discovery-delta is-new">NEW</span>`
                : "";
        return `
            <article class="top-discovery-row${isHighlighted ? " is-highlighted" : ""}">
                <span class="top-discovery-rank">${String(rank).padStart(2,"0")}</span>
                <div class="top-discovery-main">
                    <div class="top-discovery-title">${entry.title}</div>
                    <div class="top-discovery-meta">
                        <span class="top-discovery-score">${entry.approvalPercent}%</span>
                        <span class="top-discovery-votes">${localizedVotes(entry.votes)}</span>
                        ${delta}
                    </div>
                </div>
            </article>`;
    }

    function refreshLoopHeight(){
        if(!desktopTrack) return;
        loopHeight = desktopTrack.scrollHeight / 2 || TOP_LIMIT * ROW_HEIGHT;
        if(loopHeight) offset %= loopHeight;
    }

    function renderDesktop({ resetPosition=false }={}){
        if(!desktopTrack) return;
        const ranked = rankedDiscoveries();
        desktopTrack.innerHTML =
            ranked.map((entry,index)=>rowMarkup(entry,index + 1,false)).join("") +
            ranked.map((entry,index)=>rowMarkup(entry,index + 1,true)).join("");
        refreshLoopHeight();
        if(resetPosition) offset = 0;
        desktopTrack.style.transform = `translateY(${-offset}px)`;
    }

    function renderMobile(entry){
        if(!mobileCurrent) return;
        if(!entry){
            mobileCurrent.replaceChildren();
            return;
        }
        const rank = rankedDiscoveries().findIndex(item=>item.folder === entry.folder) + 1;
        mobileCurrent.innerHTML = `
            <article class="top-discoveries-mobile-entry">
                <span class="top-discoveries-mobile-rank">#${String(rank).padStart(2,"0")}</span>
                <div>
                    <div class="top-discoveries-mobile-title">${entry.title}</div>
                    <div class="top-discoveries-mobile-meta">
                        <span class="top-discoveries-mobile-score">${entry.approvalPercent}%</span>
                        <span>${localizedVotes(entry.votes)}</span>
                        <span>${entry.system}</span>
                    </div>
                </div>
            </article>`;
    }

    function render(options={}){
        renderDesktop(options);
        const ranked = rankedDiscoveries();
        if(ranked.length) mobileIndex %= ranked.length;
        else mobileIndex = 0;
        renderMobile(ranked[mobileIndex]);
    }

    function applyReactionRecord(record){
        if(!record?.folder) return;
        const previousRanks = new Map(
            rankedDiscoveries().map((item,index)=>[item.folder,index + 1])
        );
        const index = discoveries.findIndex(item=>item.folder === record.folder);
        const existing = index >= 0 ? discoveries[index] : {};
        const next = { ...existing,...record };
        if(index >= 0) discoveries[index] = next;
        else discoveries.push(next);

        const newRank = rankedDiscoveries().findIndex(item=>item.folder === record.folder) + 1;
        const oldRank = previousRanks.get(record.folder) || 0;
        next.rankDelta = oldRank && newRank && newRank < oldRank ? oldRank - newRank : 0;
        next.isNew = !oldRank && newRank > 0;
        highlightedFolder = newRank ? record.folder : null;
        pauseUntil = performance.now() + UPDATE_PAUSE;
        if(newRank) mobileIndex = newRank - 1;
        render();

        window.setTimeout(()=>{
            if(highlightedFolder !== record.folder) return;
            highlightedFolder = null;
            next.rankDelta = 0;
            next.isNew = false;
            render();
        },UPDATE_PAUSE + 500);
    }

    function rotateMobileEntry(){
        const ranked = rankedDiscoveries();
        if(!ranked.length) return;
        mobileIndex = (mobileIndex + 1) % ranked.length;
        renderMobile(ranked[mobileIndex]);
    }

    function animate(timestamp){
        if(!lastFrame) lastFrame = timestamp;
        const delta = Math.min((timestamp - lastFrame) / 1000,.1);
        lastFrame = timestamp;
        if(timestamp >= pauseUntil && loopHeight && desktopTrack){
            offset += SCROLL_SPEED * delta;
            if(offset >= loopHeight) offset -= loopHeight;
            desktopTrack.style.transform = `translateY(${-offset}px)`;
        }
        requestAnimationFrame(animate);
    }

    function initialize(){
        desktopTrack = document.getElementById("top-discoveries-track");
        mobileCurrent = document.getElementById("top-discoveries-mobile-current");
        if(!desktopTrack && !mobileCurrent) return;
        discoveries = window.ReactionStore?.all() || discoveries;
        render({ resetPosition:true });
        requestAnimationFrame(animate);
        window.setInterval(rotateMobileEntry,MOBILE_ROTATION_INTERVAL);
        ["mouseenter","mouseleave","focusin","focusout"].forEach(eventName=>{
            desktopTrack?.parentElement?.parentElement.addEventListener(
                eventName,
                ()=>window.setTimeout(refreshLoopHeight,360)
            );
        });
        document.addEventListener("reactionstorechange",event=>{
            applyReactionRecord(event.detail);
        });
        document.addEventListener("rdlanguagechange",()=>render());
    }

    window.TopDiscoveries = Object.freeze({
        render,
        getRanked:rankedDiscoveries,
        wilsonScore,
        applyReactionRecord,
        MIN_RANKING_VOTES
    });

    if(document.readyState === "loading"){
        document.addEventListener("DOMContentLoaded",initialize,{ once:true });
    }else{
        initialize();
    }
})();
