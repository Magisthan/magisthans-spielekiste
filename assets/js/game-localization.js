/* =========================================================
   Lokalisierung der Inhalte aus game.js
========================================================= */

(() => {
    const REQUIRED_FIELDS = [
        "description",
        "history",
        "review",
        "trivia",
        "worthPlaying"
    ];

    const TEXT_FIELDS = [
        "description",
        "history",
        "review",
        "worthPlaying"
    ];

    function isPresent(value) {
        if (Array.isArray(value)) return value.length > 0 && value.every(isPresent);
        return typeof value === "string" ? value.trim() !== "" : value != null;
    }

    function isTextContent(value) {
        if (typeof value === "string") return value.trim() !== "";
        return Array.isArray(value)
            && value.length > 0
            && value.every(paragraph => typeof paragraph === "string" && paragraph.trim() !== "");
    }

    function selectedLanguage(language) {
        return language
            || window.SiteI18n?.getLanguage?.()
            || document.documentElement.lang
            || "de";
    }

    function localizeGame(game, language) {
        if (!game) return game;

        const lang = selectedLanguage(language);
        const german = game.translations?.de || {};
        const selected = game.translations?.[lang] || {};
        const localized = { ...game };

        ["title", ...REQUIRED_FIELDS].forEach(field => {
            localized[field] = selected[field]
                ?? german[field]
                ?? game[field]
                ?? (field === "trivia" ? [] : "");
        });

        localized.screenshots = (game.screenshots || []).map(screenshot => ({
            ...screenshot,
            caption:selected.screenshotCaptions?.[screenshot.file]
                ?? german.screenshotCaptions?.[screenshot.file]
                ?? screenshot.caption
                ?? localized.title
        }));

        Object.defineProperty(localized, "__sourceGame", {
            value:game.__sourceGame || game,
            enumerable:false
        });

        return localized;
    }

    function validateTranslation(game, language) {
        const translation = game?.translations?.[language];
        const missing = [];

        if (!translation) {
            return { language, complete:false, missing:["translations"] };
        }

        REQUIRED_FIELDS.forEach(field => {
            const value = translation[field];
            const valid = TEXT_FIELDS.includes(field)
                ? isTextContent(value)
                : field === "trivia"
                    ? Array.isArray(value) && value.length > 0 && value.every(isPresent)
                    : isPresent(value);
            if (!valid) missing.push(field);
        });

        return { language, complete:missing.length === 0, missing };
    }

    function validateGame(game, languages = ["de", "en"]) {
        const results = languages.map(language => validateTranslation(game, language));
        return {
            id:game?.id,
            folder:game?.folder,
            complete:results.every(result => result.complete),
            languages:results
        };
    }

    function validatePilotGames(games) {
        const reports = (games || [])
            .filter(game => game.translationPilot)
            .map(game => validateGame(game));

        reports.forEach(report => {
            const summary = report.languages
                .map(result => result.complete
                    ? `${result.language.toUpperCase()}: complete`
                    : `${result.language.toUpperCase()}: missing ${result.missing.join(", ")}`)
                .join(" | ");
            const method = report.complete ? "info" : "warn";
            console[method](`[Game localization] ${report.folder}: ${summary}`);
        });

        return reports;
    }

    function validateAllGames(games, languages = ["de","en"]) {
        return (games || []).map(game => validateGame(game,languages));
    }

    window.GameLocalization = {
        localizeGame,
        validateTranslation,
        validateGame,
        validatePilotGames,
        validateAllGames,
        requiredFields:[...REQUIRED_FIELDS],
        textFields:[...TEXT_FIELDS],
        isTextContent
    };

    document.addEventListener("DOMContentLoaded", () => {
        if (typeof GAMES !== "undefined") validatePilotGames(GAMES);
    });
})();
