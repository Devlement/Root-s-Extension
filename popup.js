document.addEventListener('DOMContentLoaded', async () => {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    const amazonScreen = document.getElementById('amazon-screen');
    const notAmazonScreen = document.getElementById('not-amazon-screen');

    // Vérifie si l'URL contient "amazon"
    if (tab && tab.url && tab.url.includes("amazon.")) {
        amazonScreen.classList.remove('hidden');
        amazonScreen.classList.add('block');
    } else {
        notAmazonScreen.classList.remove('hidden');
        notAmazonScreen.classList.add('flex-col');
    }
});

document.getElementById('rescan-btn').addEventListener('click', async () => {
    const selectedStrategy = document.querySelector('input[name="strategy"]:checked').value;
    const keyword = document.getElementById('keyword-input').value.trim();

    // Récupération des filtres actifs
    const options = {
        primeOnly: document.getElementById('opt-prime').checked,
        noSponsored: document.getElementById('opt-nosponsor').checked,
        minFourStars: document.getElementById('opt-stars').checked
    };

    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (tab) {
        chrome.tabs.sendMessage(tab.id, { 
            action: "start_root", 
            strategy: selectedStrategy,
            keyword: keyword,
            filters: options
        });
        
        // Ferme la popup après avoir lancé Root
        window.close();
    }
});