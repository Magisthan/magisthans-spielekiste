(function(){
    "use strict";

    function clampRadius(camera,value){
        const lower = Number.isFinite(camera.lowerRadiusLimit)
            ? camera.lowerRadiusLimit
            : 0.1;
        const upper = Number.isFinite(camera.upperRadiusLimit)
            ? camera.upperRadiusLimit
            : Number.POSITIVE_INFINITY;
        return Math.min(upper,Math.max(lower,value));
    }

    function installStyles(){
        if(document.getElementById("viewer-zoom-controls-style")) return;
        const style = document.createElement("style");
        style.id = "viewer-zoom-controls-style";
        style.textContent = `
            .viewer-zoom-controls{
                position:absolute;z-index:145;top:16px;right:16px;
                display:flex;gap:7px;pointer-events:auto;
            }
            .viewer-zoom-control{
                display:grid;width:42px;height:42px;padding:0;place-items:center;
                border:1px solid rgba(255,255,255,.18);border-radius:50%;
                color:#f4cc67;background:rgba(8,12,18,.86);
                box-shadow:0 7px 18px rgba(0,0,0,.34);
                backdrop-filter:blur(6px);font:700 1.35rem/1 system-ui,sans-serif;
                cursor:pointer;touch-action:manipulation;
            }
            .viewer-zoom-control:hover{border-color:rgba(240,191,68,.65);background:rgba(42,35,20,.94)}
            .viewer-zoom-control:focus-visible{outline:2px solid #ffe293;outline-offset:3px}
            .viewer-zoom-control:active{transform:scale(.96)}
            @media(max-width:768px){
                .viewer-zoom-controls{top:12px;right:12px;gap:6px}
                .viewer-zoom-control{width:40px;height:40px;font-size:1.25rem}
            }
        `;
        document.head.append(style);
    }

    function setup(options){
        const { camera,canvas,container,onInteraction } = options || {};
        if(!camera || !canvas || canvas.dataset.viewerInputReady === "true") return null;

        canvas.dataset.viewerInputReady = "true";
        installStyles();

        camera.inputs?.removeByType?.("ArcRotateCameraMouseWheelInput");
        const pointerInput = camera.inputs?.attached?.pointers;
        if(pointerInput) pointerInput.buttons = [0];

        const zoomStep = Number(options.zoomStep) || 0.55;
        const dragSensitivity = Number(options.dragSensitivity) || 0.012;
        let zoomPointerId = null;
        let previousY = 0;

        const notify = ()=>onInteraction?.();
        const setRadius = value=>{
            camera.radius = clampRadius(camera,value);
            camera.inertialRadiusOffset = 0;
            notify();
        };

        const startZoom = event=>{
            if(event.pointerType === "mouse" && event.button === 2){
                event.preventDefault();
                event.stopImmediatePropagation();
                zoomPointerId = event.pointerId;
                previousY = event.clientY;
                canvas.setPointerCapture?.(event.pointerId);
                notify();
            }
        };
        const moveZoom = event=>{
            if(event.pointerId !== zoomPointerId) return;
            event.preventDefault();
            const deltaY = event.clientY - previousY;
            previousY = event.clientY;
            setRadius(camera.radius + deltaY * dragSensitivity);
        };
        const stopZoom = event=>{
            if(event.pointerId !== zoomPointerId) return;
            canvas.releasePointerCapture?.(event.pointerId);
            zoomPointerId = null;
        };
        const stopContextMenu = event=>event.preventDefault();

        canvas.addEventListener("pointerdown",startZoom,{ capture:true });
        canvas.addEventListener("pointermove",moveZoom,{ passive:false });
        canvas.addEventListener("pointerup",stopZoom);
        canvas.addEventListener("pointercancel",stopZoom);
        canvas.addEventListener("contextmenu",stopContextMenu);

        let controls = null;
        if(container){
            controls = container.querySelector(":scope > .viewer-zoom-controls");
            if(!controls){
                controls = document.createElement("div");
                controls.className = "viewer-zoom-controls";
                controls.setAttribute("aria-label","3D-Ansicht zoomen / Zoom 3D view");
                controls.innerHTML = `
                    <button class="viewer-zoom-control" type="button" data-viewer-zoom="out" aria-label="Herauszoomen / Zoom out">−</button>
                    <button class="viewer-zoom-control" type="button" data-viewer-zoom="in" aria-label="Hineinzoomen / Zoom in">+</button>
                `;
                container.append(controls);
            }
            controls.addEventListener("click",event=>{
                const direction = event.target.closest("[data-viewer-zoom]")?.dataset.viewerZoom;
                if(direction === "in") setRadius(camera.radius - zoomStep);
                if(direction === "out") setRadius(camera.radius + zoomStep);
            });
        }

        return {
            setRadius,
            destroy(){
                canvas.removeEventListener("pointerdown",startZoom,{ capture:true });
                canvas.removeEventListener("pointermove",moveZoom);
                canvas.removeEventListener("pointerup",stopZoom);
                canvas.removeEventListener("pointercancel",stopZoom);
                canvas.removeEventListener("contextmenu",stopContextMenu);
                controls?.remove();
                delete canvas.dataset.viewerInputReady;
            }
        };
    }

    window.ViewerInputControls = { setup };
})();
