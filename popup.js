document.addEventListener('DOMContentLoaded', async () => {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    const amazonScreen = document.getElementById('amazon-screen');
    const notAmazonScreen = document.getElementById('not-amazon-screen');

    if (tab && tab.url && tab.url.includes("amazon.")) {
        amazonScreen.classList.remove('hidden');
        amazonScreen.classList.add('block');
    } else {
        notAmazonScreen.classList.remove('hidden');
        notAmazonScreen.classList.add('flex-col');
    }

    const summonToggle = document.getElementById('summon-toggle');
    
    chrome.storage.local.get(['rootWanderingEnabled', 'rootSettings'], (result) => {
        summonToggle.checked = !!result.rootWanderingEnabled;

        if (result.rootSettings) {
            const strategyRadio = document.querySelector(`input[name="strategy"][value="${result.rootSettings.strategy}"]`);
            if (strategyRadio) strategyRadio.checked = true;

            const keywordNode = document.getElementById('keyword-input');
            if (keywordNode && result.rootSettings.keyword !== undefined) {
                keywordNode.value = result.rootSettings.keyword;
            }

            const filters = result.rootSettings.filters || {};
            if (document.getElementById('opt-prime')) document.getElementById('opt-prime').checked = !!filters.primeOnly;
            if (document.getElementById('opt-nosponsor')) document.getElementById('opt-nosponsor').checked = !!filters.noSponsored;
            if (document.getElementById('opt-stars')) document.getElementById('opt-stars').checked = !!filters.minFourStars;
            if (document.getElementById('opt-soldbyamz')) document.getElementById('opt-soldbyamz').checked = !!filters.soldByAmz;
            if (document.getElementById('opt-new')) document.getElementById('opt-new').checked = !!filters.isNew;
            if (document.getElementById('opt-basics')) document.getElementById('opt-basics').checked = !!filters.isBasics;
        }
    });

    summonToggle.addEventListener('change', async (e) => {
        const isEnabled = e.target.checked;
        chrome.storage.local.set({ rootWanderingEnabled: isEnabled });
        
        let [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (currentTab) {
            try {
                await sendOrInjectMessage(currentTab.id, { 
                    action: "toggle_wandering", 
                    enabled: isEnabled 
                });
            } catch (err) {
                console.log("Choix sauvegardé en attente d'aller sur Amazon.");
            }
        }
    });
});

document.getElementById('rescan-btn').addEventListener('click', async () => {
    const strategyNode = document.querySelector('input[name="strategy"]:checked');
    const selectedStrategy = strategyNode ? strategyNode.value : 'cheapest';

    const keywordNode = document.getElementById('keyword-input');
    const keyword = keywordNode ? keywordNode.value.trim() : "";

    const options = {
        primeOnly: document.getElementById('opt-prime') ? document.getElementById('opt-prime').checked : false,
        noSponsored: document.getElementById('opt-nosponsor') ? document.getElementById('opt-nosponsor').checked : false,
        minFourStars: document.getElementById('opt-stars') ? document.getElementById('opt-stars').checked : false,
        soldByAmz: document.getElementById('opt-soldbyamz') ? document.getElementById('opt-soldbyamz').checked : false,
        isNew: document.getElementById('opt-new') ? document.getElementById('opt-new').checked : false,
        isBasics: document.getElementById('opt-basics') ? document.getElementById('opt-basics').checked : false
    };

    await chrome.storage.local.set({
        rootSettings: {
            strategy: selectedStrategy,
            keyword: keyword,
            filters: options
        }
    });

    let [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (currentTab) {
        try {
            await sendOrInjectMessage(currentTab.id, { 
                action: "start_root", 
                strategy: selectedStrategy,
                keyword: keyword,
                filters: options
            });
            window.close();
        } catch (error) {
            console.error("Impossible d'exécuter la commande sur cette page :", error);
        }
    }
});

// Envoie le message ou injecte le content script si le canal est coupé
async function sendOrInjectMessage(tabId, message) {
    try {
        return await chrome.tabs.sendMessage(tabId, message);
    } catch (err) {
        await chrome.scripting.insertCSS({ target: { tabId }, files: ["content.css"] });
        await chrome.scripting.executeScript({ target: { tabId }, files: ["content.js"] });
        await new Promise(res => setTimeout(res, 150));
        return await chrome.tabs.sendMessage(tabId, message);
    }
}