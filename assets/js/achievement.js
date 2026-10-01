document.addEventListener("DOMContentLoaded",async()=>{
    await Promise.resolve(window.__siteI18nReady);

    const popup = document.getElementById("achievement-popup");
    if(!popup) return;

    let visitCounter = Number.parseInt(
        localStorage.getItem("retroVisitCounter") || "0",
        10
    );
    visitCounter += 1;
    localStorage.setItem("retroVisitCounter",String(visitCounter));

    const nextAchievement = Number.parseInt(
        localStorage.getItem("retroNextAchievement") || "1",
        10
    );
    if(visitCounter < nextAchievement) return;

    const achievements = {
        common:[
            { icon:"🏆",key:"welcome" },
            { icon:"☕",key:"coffee" },
            { icon:"💾",key:"save" },
            { icon:"🕹️",key:"joystick" },
            { icon:"📺",key:"crt" },
            { icon:"🎮",key:"game" },
            { icon:"📰",key:"news" },
            { icon:"📼",key:"datasette" }
        ],
        rare:[
            { icon:"💽",key:"disk" },
            { icon:"🎵",key:"sidMusic" }
        ],
        legendary:[
            { icon:"👑",key:"sidChip" },
            { icon:"💿",key:"drive" }
        ]
    };

    const chance = Math.random();
    const rarity = chance <= .01 ? "legendary" : chance <= .10 ? "rare" : "common";
    const pool = achievements[rarity];
    const achievement = pool[Math.floor(Math.random() * pool.length)];

    function renderAchievement(){
        const t = (key)=>window.SiteI18n?.t(key) ?? key;
        popup.querySelector(".achievement-icon").textContent = achievement.icon;
        popup.querySelector("strong").textContent =
            t(`home.achievement.${achievement.key}.title`);
        popup.querySelector("small").textContent =
            t(`home.achievement.${achievement.key}.text`);

        const labelKey = rarity === "legendary"
            ? "home.achievement.legendaryLabel"
            : rarity === "rare"
                ? "home.achievement.rareLabel"
                : "home.achievement.defaultLabel";
        popup.querySelector(".achievement-label").textContent = t(labelKey);
    }

    popup.classList.remove(
        "achievement-common",
        "achievement-rare",
        "achievement-legendary"
    );
    popup.classList.add(`achievement-${rarity}`);
    renderAchievement();
    document.addEventListener("siteLanguageChanged",renderAchievement);

    const nextVisitDelay = Math.floor(Math.random() * 6) + 3;
    localStorage.setItem(
        "retroNextAchievement",
        String(visitCounter + nextVisitDelay)
    );

    setTimeout(()=>popup.classList.add("show"),1200);
    setTimeout(()=>popup.classList.remove("show"),6500);
});
