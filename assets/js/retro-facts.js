(() => {
    const FACT_COUNT = 33;
    const day = Math.floor(Date.now() / 86400000);
    const factKey = `home.fact.${day % FACT_COUNT}`;

    function renderFact(){
        const target = document.getElementById("retro-fact-text");
        if(target && window.SiteI18n) target.textContent = SiteI18n.t(factKey);
    }

    async function initializeFacts(){
        if(document.readyState === "loading"){
            await new Promise(resolve=>document.addEventListener("DOMContentLoaded",resolve,{ once:true }));
        }
        await Promise.resolve(window.__siteI18nReady);
        renderFact();
        document.addEventListener("siteLanguageChanged",renderFact);
    }

    initializeFacts();
})();
