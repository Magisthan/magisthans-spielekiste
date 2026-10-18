const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname,"..");
const storage = new Map();
const listeners = new Map();

const documentMock = {
    readyState:"loading",
    addEventListener(type,listener){
        if(!listeners.has(type)) listeners.set(type,[]);
        listeners.get(type).push(listener);
    },
    dispatchEvent(event){
        for(const listener of listeners.get(event.type) || []) listener(event);
        return true;
    },
    getElementById(){ return null; }
};

class CustomEventMock {
    constructor(type,options={}){
        this.type = type;
        this.detail = options.detail;
    }
}

const context = {
    console,
    document:documentMock,
    CustomEvent:CustomEventMock,
    localStorage:{
        getItem:key=>storage.get(key) ?? null,
        setItem:(key,value)=>storage.set(key,String(value))
    },
    performance:{ now:()=>0 },
    requestAnimationFrame:()=>0,
    setInterval:()=>0,
    setTimeout:()=>0,
    clearTimeout:()=>{},
    RDI18n:{ t:(key,{ count }={})=>`${count ?? ""} ${key}` }
};
context.window = context;
vm.createContext(context);

for(const relativePath of [
    "retro-discovery/js/reaction-store.js",
    "retro-discovery/js/top-discoveries.js"
]){
    vm.runInContext(
        fs.readFileSync(path.join(root,relativePath),"utf8"),
        context,
        { filename:relativePath }
    );
}

const store = context.ReactionStore;
const top = context.TopDiscoveries;
const testGame = { id:999,folder:"reaction-test",title:"Reaction Test",system:"Test" };

let record = store.vote(testGame,"like");
assert.strictEqual(record.likes,1,"First like was not recorded");
assert.strictEqual(record.dislikes,0);
assert.strictEqual(record.userReaction,"like");

record = store.vote(testGame,"dislike");
assert.strictEqual(record.likes,1,"A locked vote was changed after a second selection");
assert.strictEqual(record.dislikes,0,"A second selection bypassed the vote lock");
assert.strictEqual(record.userReaction,"like","The stored local choice was changed");

record = store.vote(testGame,"like");
assert.strictEqual(record.likes + record.dislikes,1,"A repeated click duplicated or removed the vote");
assert.strictEqual(record.userReaction,"like","A repeated click removed the local selection");

const dislikeRecord = store.vote(
    { id:998,folder:"reaction-dislike-test",title:"Dislike Test",system:"Test" },
    "dislike"
);
assert.strictEqual(dislikeRecord.likes,0);
assert.strictEqual(dislikeRecord.dislikes,1,"The initial dislike was not recorded");
assert.strictEqual(dislikeRecord.userReaction,"dislike");

assert(
    top.wilsonScore(90,10) > top.wilsonScore(9,1),
    "More votes should rank higher at the same approval ratio"
);
assert(
    top.wilsonScore(80,20) > top.wilsonScore(1,0),
    "A single positive vote is weighted too strongly"
);

const singleVote = store.vote(
    { id:1000,folder:"single-vote",title:"Single Vote",system:"Test" },
    "like"
);
top.applyReactionRecord(singleVote);
assert(
    !top.getRanked().some(entry=>entry.folder === "single-vote"),
    "A game with fewer than five votes entered Top Discoveries"
);

assert(
    !top.getRanked().some(entry=>entry.folder === "single-vote" && entry.score === 1),
    "A single vote produced an unweighted 100% ranking score"
);

console.log("RETRO REACTION TESTS: PASS");
