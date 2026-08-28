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
    const selectedStrategy = document.querySelector('input[name="strategy"]:checked').value;
    const keyword = document.getElementById('keyword-input').value.trim();

    const options = {
        primeOnly: document.getElementById('opt-prime').checked,
        noSponsored: document.getElementById('opt-nosponsor').checked,
        minFourStars: document.getElementById('opt-stars').checked
    };

    let [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (currentTab) {
        chrome.tabs.sendMessage(currentTab.id, { 
            action: "start_root", 
            strategy: selectedStrategy,
            keyword: keyword,
            filters: options
        }, (response) => {
            window.close();
        });
    }
});