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
    
    chrome.storage.local.get(['rootWanderingEnabled'], (result) => {
        summonToggle.checked = !!result.rootWanderingEnabled;
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

    // 2. Récupération sécurisée du mot-clé (sans planter s'il n'existe pas)
    const keywordNode = document.getElementById('keyword-input');
    const keyword = keywordNode ? keywordNode.value.trim() : "";

    // 3. Récupération sécurisée des filtres
    const options = {
        primeOnly: document.getElementById('opt-prime') ? document.getElementById('opt-prime').checked : false,
        noSponsored: document.getElementById('opt-nosponsor') ? document.getElementById('opt-nosponsor').checked : false,
        minFourStars: document.getElementById('opt-stars') ? document.getElementById('opt-stars').checked : false
    };

    // 4. Envoi du message à l'onglet actif
    let [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (currentTab) {
        chrome.tabs.sendMessage(currentTab.id, { 
            action: "start_root", 
            strategy: selectedStrategy,
            keyword: keyword,
            filters: options
        }, (response) => {
            // Si la page Amazon n'est pas prête à recevoir le message
            if (chrome.runtime.lastError) {
                console.error("Erreur de communication : Recharge ta page Amazon !");
            } else {
                window.close(); // Ferme le popup si l'ordre est bien passé
            }
        });
    }
});