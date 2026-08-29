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
    
    // NOUVEAU : On récupère 'rootSettings' (les filtres) en plus de 'rootWanderingEnabled' (le mode balade)
    chrome.storage.local.get(['rootWanderingEnabled', 'rootSettings'], (result) => {
        // Restauration du mode balade
        summonToggle.checked = !!result.rootWanderingEnabled;

        // Restauration des choix de Rootine s'ils existent dans la mémoire
        if (result.rootSettings) {
            // 1. Restaurer la stratégie
            const strategyRadio = document.querySelector(`input[name="strategy"][value="${result.rootSettings.strategy}"]`);
            if (strategyRadio) strategyRadio.checked = true;

            // 2. Restaurer le mot-clé (s'il existe dans le HTML)
            const keywordNode = document.getElementById('keyword-input');
            if (keywordNode && result.rootSettings.keyword !== undefined) {
                keywordNode.value = result.rootSettings.keyword;
            }

            // 3. Restaurer tous les filtres
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
            chrome.tabs.sendMessage(currentTab.id, { 
                action: "toggle_wandering", 
                enabled: isEnabled 
            }).catch(() => {
                console.log("Choix sauvegardé en attente d'aller sur Amazon.");
            });
        }
    });
});

document.getElementById('rescan-btn').addEventListener('click', async () => {
    // 1. Récupération sécurisée de la stratégie
    const strategyNode = document.querySelector('input[name="strategy"]:checked');
    const selectedStrategy = strategyNode ? strategyNode.value : 'cheapest';

    // 2. Récupération sécurisée du mot-clé
    const keywordNode = document.getElementById('keyword-input');
    const keyword = keywordNode ? keywordNode.value.trim() : "";

    // 3. Récupération sécurisée de tous les filtres (même les nouveaux)
    const options = {
        primeOnly: document.getElementById('opt-prime') ? document.getElementById('opt-prime').checked : false,
        noSponsored: document.getElementById('opt-nosponsor') ? document.getElementById('opt-nosponsor').checked : false,
        minFourStars: document.getElementById('opt-stars') ? document.getElementById('opt-stars').checked : false,
        soldByAmz: document.getElementById('opt-soldbyamz') ? document.getElementById('opt-soldbyamz').checked : false,
        isNew: document.getElementById('opt-new') ? document.getElementById('opt-new').checked : false,
        isBasics: document.getElementById('opt-basics') ? document.getElementById('opt-basics').checked : false
    };

    // NOUVEAU : Sauvegarde des choix dans le stockage local de Chrome
    chrome.storage.local.set({
        rootSettings: {
            strategy: selectedStrategy,
            keyword: keyword,
            filters: options
        }
    });

    // 4. Envoi du message à l'onglet actif
    let [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (currentTab) {
        chrome.tabs.sendMessage(currentTab.id, { 
            action: "start_root", 
            strategy: selectedStrategy,
            keyword: keyword,
            filters: options
        }, (response) => {
            if (chrome.runtime.lastError) {
                console.error("Erreur de communication : Recharge ta page Amazon !");
            } else {
                window.close();
            }
        });
    }
});