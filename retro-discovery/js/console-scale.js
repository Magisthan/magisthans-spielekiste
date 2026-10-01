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

        initializeMobileFilters();

    }

    function initializeMobileFilters() {

        const panel = document.getElementById("mobile-filter-panel");
        const systemMount = document.getElementById("mobile-system-filter-mount");
        const genreMount = document.getElementById("mobile-genre-filter-mount");
        const systemFilters = document.getElementById("system-filter-container");
        const genreFilters = document.getElementById("genre-filter-container");
        const lcd = document.getElementById("rd-lcd");
        const discoveryButton = document.getElementById("discovery-button");
        const carouselTrack = document.getElementById("rd-carousel-track");
        const lcdMount = document.getElementById("mobile-lcd-mount");
        const knobMount = document.getElementById("mobile-discovery-knob-mount");
        const spinMount = document.getElementById("mobile-spin-track-mount");

        if (
            !panel || !systemMount || !genreMount || !systemFilters || !genreFilters ||
            !lcd || !discoveryButton || !carouselTrack || !lcdMount || !knobMount || !spinMount
        ) return;

        const systemAnchor = document.createComment("system-filter-anchor");
        const genreAnchor = document.createComment("genre-filter-anchor");
        const lcdAnchor = document.createComment("lcd-anchor");
        const knobAnchor = document.createComment("discovery-button-anchor");
        const trackAnchor = document.createComment("carousel-track-anchor");

        systemFilters.parentNode.insertBefore(systemAnchor, systemFilters);
        genreFilters.parentNode.insertBefore(genreAnchor, genreFilters);
        lcd.parentNode.insertBefore(lcdAnchor, lcd);
        discoveryButton.parentNode.insertBefore(knobAnchor, discoveryButton);
        carouselTrack.parentNode.insertBefore(trackAnchor, carouselTrack);

        const mediaQuery = window.matchMedia("(max-width:768px)");

        const updateFilterLayout = () => {

            if (mediaQuery.matches) {
                systemMount.append(systemFilters);
                genreMount.append(genreFilters);
                lcdMount.append(lcd);
                knobMount.append(discoveryButton);
                spinMount.append(carouselTrack);
            } else {
                systemAnchor.parentNode.insertBefore(systemFilters, systemAnchor.nextSibling);
                genreAnchor.parentNode.insertBefore(genreFilters, genreAnchor.nextSibling);
                lcdAnchor.parentNode.insertBefore(lcd, lcdAnchor.nextSibling);
                knobAnchor.parentNode.insertBefore(discoveryButton, knobAnchor.nextSibling);
                trackAnchor.parentNode.insertBefore(carouselTrack, trackAnchor.nextSibling);
            }

        };

        mediaQuery.addEventListener("change", updateFilterLayout);
        updateFilterLayout();

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
                "--community-left",
                `${(80 * scale).toFixed(3)}px`
            );

            viewerStage.style.setProperty(
                "--community-top",
                `${(70 * scale).toFixed(3)}px`
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
