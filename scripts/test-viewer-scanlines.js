const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const listeners = new Map();
const storage = new Map();
const stageClasses = new Set();
const buttonListeners = new Map();

const stage = {
    classList:{
        toggle(name,force){
            if(force) stageClasses.add(name);
            else stageClasses.delete(name);
        }
    }
};
const stateLabel = { textContent:"" };
const toggle = {
    attributes:new Map(),
    setAttribute(name,value){ this.attributes.set(name,String(value)); },
    addEventListener(type,listener){ buttonListeners.set(type,listener); }
};

const documentMock = {
    readyState:"loading",
    getElementById(id){
        return {
            "viewer-stage":stage,
            "viewer-scanlines-toggle":toggle,
            "viewer-scanlines-state":stateLabel
        }[id] || null;
    },
    addEventListener(type,listener){ listeners.set(type,listener); },
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
    RDI18n:{ t:key=>({
        "viewer.scanlinesToggle":"Toggle scanlines",
        "viewer.scanlinesOn":"ON",
        "viewer.scanlinesOff":"OFF"
    })[key] || key }
};
context.window = context;
vm.createContext(context);
vm.runInContext(
    fs.readFileSync(path.resolve(__dirname,"../retro-discovery/js/viewer-scanlines.js"),"utf8"),
    context
);

listeners.get("DOMContentLoaded")();
assert.strictEqual(toggle.attributes.get("aria-checked"),"false");
assert.strictEqual(stateLabel.textContent,"OFF");
assert(!stageClasses.has("viewer-scanlines-enabled"));

buttonListeners.get("click")();
assert.strictEqual(toggle.attributes.get("aria-checked"),"true");
assert.strictEqual(stateLabel.textContent,"ON");
assert(stageClasses.has("viewer-scanlines-enabled"));
assert.strictEqual(storage.get("rd-viewer-scanlines"),"on");

context.ViewerScanlines.setEnabled(false);
assert.strictEqual(storage.get("rd-viewer-scanlines"),"off");
assert(!stageClasses.has("viewer-scanlines-enabled"));

console.log("VIEWER SCANLINES TESTS: PASS");
