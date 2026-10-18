const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const documentListeners = new Map();
const storage = new Map();
const stageClasses = new Set();
const controlListeners = new Map();
const lightingCalls = [];
const scanlineCalls = [];

function createButton(mode){
    return {
        dataset:{ viewerMode:mode },
        attributes:new Map(),
        setAttribute(name,value){ this.attributes.set(name,String(value)); }
    };
}

const buttons = ["standard","retro","museum"].map(createButton);
const controls = {
    querySelectorAll(){ return buttons; },
    addEventListener(type,listener){ controlListeners.set(type,listener); }
};
const stage = {
    classList:{
        toggle(name,force){
            if(force) stageClasses.add(name);
            else stageClasses.delete(name);
        }
    }
};
const documentMock = {
    readyState:"loading",
    getElementById(id){
        return {
            "viewer-stage":stage,
            "viewer-presentation-modes":controls
        }[id] || null;
    },
    addEventListener(type,listener){ documentListeners.set(type,listener); },
    dispatchEvent(){}
};
class CustomEventMock {
    constructor(type,options={}){ this.type=type; this.detail=options.detail; }
}
const context = {
    document:documentMock,
    CustomEvent:CustomEventMock,
    localStorage:{
        getItem:key=>storage.get(key) ?? null,
        setItem:(key,value)=>storage.set(key,String(value))
    },
    ViewerScanlines:{
        isEnabled:()=>false,
        setEnabled:(enabled,options)=>scanlineCalls.push({ enabled,options })
    }
};
context.window = context;
vm.createContext(context);
vm.runInContext(
    fs.readFileSync(path.resolve(__dirname,"../retro-discovery/js/viewer-presentation-modes.js"),"utf8"),
    context
);

documentListeners.get("DOMContentLoaded")();
assert.strictEqual(context.ViewerPresentationModes.getMode(),"standard");
assert(stageClasses.size === 0);
assert.strictEqual(buttons[0].attributes.get("aria-pressed"),"true");
assert.strictEqual(scanlineCalls.at(-1).enabled,false);

context.ViewerLighting = {
    applyProfile:profile=>lightingCalls.push(profile)
};
documentListeners.get("viewerlightingready")();
assert.strictEqual(lightingCalls.at(-1),"standard");

controlListeners.get("click")({
    target:{ closest:()=>buttons[1] }
});
assert.strictEqual(context.ViewerPresentationModes.getMode(),"retro");
assert(stageClasses.has("viewer-retro-mode"));
assert(!stageClasses.has("viewer-museum-mode"));
assert.strictEqual(scanlineCalls.at(-1).enabled,true);
assert.strictEqual(lightingCalls.at(-1),"standard");

controlListeners.get("click")({
    target:{ closest:()=>buttons[2] }
});
assert.strictEqual(context.ViewerPresentationModes.getMode(),"museum");
assert(!stageClasses.has("viewer-retro-mode"));
assert(stageClasses.has("viewer-museum-mode"));
assert.strictEqual(scanlineCalls.at(-1).enabled,false);
assert.strictEqual(lightingCalls.at(-1),"museum");
assert.strictEqual(storage.get("rd-viewer-presentation-mode"),"museum");
assert.strictEqual(buttons[2].attributes.get("aria-pressed"),"true");

context.ViewerPresentationModes.setMode("unsupported");
assert.strictEqual(context.ViewerPresentationModes.getMode(),"standard");
assert(!stageClasses.has("viewer-museum-mode"));

console.log("VIEWER PRESENTATION MODES TESTS: PASS");
