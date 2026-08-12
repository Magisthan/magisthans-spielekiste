/* ==================================================
   Retro Discovery
   console-scale.js

   Keeps the complete top-console overlay in the same
   coordinate system as the 1700px desktop reference.
   ================================================== */

(() => {

    const REFERENCE_WIDTH = 1700;

    function initializeVirtualCanvas(
        selector,
        scaleProperty
    ) {

        const canvas = document.querySelector(selector);

        if (!canvas) return;

        const updateScale = () => {

            const width = canvas.clientWidth;

            if (!width) return;

            canvas.style.setProperty(
                scaleProperty,
                (width / REFERENCE_WIDTH).toFixed(6)
            );

        };

        const observer = new ResizeObserver(updateScale);

        observer.observe(canvas);

        updateScale();

    }

    function initializeConsoleScale() {

        initializeVirtualCanvas(
            ".rd-console-top",
            "--console-scale"
        );

        initializeVirtualCanvas(
            ".rd-console-shelf",
            "--shelf-scale"
        );

        initializeViewerStage();

        initializeMobileViewerPanels();

    }

    function initializeViewerStage() {

        const viewerStage = document.getElementById("viewer-stage");

        if (!viewerStage) return;

        const updateViewerStage = () => {

            const scale = Math.min(
                1,
                viewerStage.clientWidth / REFERENCE_WIDTH
            );

            viewerStage.style.setProperty(
                "--community-scale",
                scale.toFixed(6)
            );

            viewerStage.style.setProperty(
                "--community-left",
                `${(130 * scale).toFixed(3)}px`
            );

            viewerStage.style.setProperty(
                "--community-top",
                `${(85 * scale).toFixed(3)}px`
            );

            window.dispatchEvent(new Event("resize"));

        };

        const observer = new ResizeObserver(updateViewerStage);

        observer.observe(viewerStage);

        updateViewerStage();

    }

    function initializeMobileViewerPanels() {

        const mobilePanels = document.getElementById(
            "viewer-mobile-panels"
        );

        const communityPanel = document.getElementById(
            "community-panel"
        );

        const infoPanel = document.getElementById(
            "viewer-info-panel"
        );

        if (!mobilePanels || !communityPanel || !infoPanel) return;

        const communityAnchor = document.createComment(
            "community-panel-anchor"
        );

        const infoAnchor = document.createComment(
            "viewer-info-panel-anchor"
        );

        communityPanel.parentNode.insertBefore(
            communityAnchor,
            communityPanel
        );

        infoPanel.parentNode.insertBefore(
            infoAnchor,
            infoPanel
        );

        const mediaQuery = window.matchMedia("(max-width:1200px)");

        const updatePanelLayout = () => {

            if (mediaQuery.matches) {

                mobilePanels.append(
                    communityPanel,
                    infoPanel
                );

            } else {

                communityAnchor.parentNode.insertBefore(
                    communityPanel,
                    communityAnchor.nextSibling
                );

                infoAnchor.parentNode.insertBefore(
                    infoPanel,
                    infoAnchor.nextSibling
                );

            }

            window.dispatchEvent(new Event("resize"));

        };

        mediaQuery.addEventListener("change", updatePanelLayout);

        updatePanelLayout();

    }

    if (document.readyState === "loading") {

        document.addEventListener(
            "DOMContentLoaded",
            initializeConsoleScale,
            { once:true }
        );

    } else {

        initializeConsoleScale();

    }

})();
