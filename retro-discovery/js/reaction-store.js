/* Gamebox Discovery: local reaction adapter with a Supabase-ready API. */
(function initializeReactionStore(global){
    "use strict";

    const AGGREGATES_KEY = "gamebox-reaction-aggregates-v1";
    const CHOICES_KEY = "gamebox-reaction-choices-v1";
    const VALID_REACTIONS = new Set(["like","dislike"]);

    function readStorage(key){
        try{
            return JSON.parse(global.localStorage.getItem(key) || "{}");
        }catch(error){
            return {};
        }
    }

    const storedAggregates = readStorage(AGGREGATES_KEY);
    const choices = readStorage(CHOICES_KEY);
    const aggregates = new Map(Object.entries(storedAggregates));

    function normalize(entry={}){
        const likes = Math.max(0,Number(entry.likes) || 0);
        const dislikes = Math.max(0,Number(entry.dislikes) || 0);
        const totalVotes = likes + dislikes;
        const likePercent = totalVotes ? Math.round(likes / totalVotes * 100) : 0;
        return {
            ...entry,
            likes,
            dislikes,
            totalVotes,
            likePercent,
            dislikePercent:totalVotes ? 100 - likePercent : 0,
            userReaction:choices[entry.folder] || null
        };
    }

    function persist(){
        try{
            global.localStorage.setItem(
                AGGREGATES_KEY,
                JSON.stringify(Object.fromEntries(aggregates))
            );
            global.localStorage.setItem(CHOICES_KEY,JSON.stringify(choices));
        }catch(error){
            // Storage can be unavailable in privacy modes; the in-memory adapter remains usable.
        }
    }

    function seed(entries=[]){
        for(const source of entries){
            if(!source?.folder || aggregates.has(source.folder)) continue;
            aggregates.set(source.folder,normalize(source));
        }
        persist();
    }

    function register(game){
        if(!game?.folder) return null;
        const existing = aggregates.get(game.folder) || {};
        const next = normalize({
            ...existing,
            id:existing.id ?? game.id,
            folder:game.folder,
            title:game.title || existing.title || game.folder,
            system:game.system || existing.system || ""
        });
        aggregates.set(game.folder,next);
        return next;
    }

    function get(folder){
        if(!folder) return normalize({ folder:"" });
        return normalize(aggregates.get(folder) || { folder });
    }

    function vote(game,nextReaction){
        if(!game?.folder || !VALID_REACTIONS.has(nextReaction)) return get(game?.folder);
        const record = register(game);
        const previousReaction = choices[game.folder] || null;
        if(previousReaction) return normalize(record);

        if(nextReaction === "like") record.likes += 1;
        if(nextReaction === "dislike") record.dislikes += 1;
        choices[game.folder] = nextReaction;

        const normalized = normalize(record);
        aggregates.set(game.folder,normalized);
        persist();

        document.dispatchEvent(new CustomEvent("reactionstorechange",{
            detail:{ ...normalized,previousReaction,nextReaction }
        }));
        return normalized;
    }

    function all(){
        return Array.from(aggregates.values(),normalize);
    }

    global.ReactionStore = Object.freeze({ seed,register,get,vote,all });
})(window);
