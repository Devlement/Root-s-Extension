document.addEventListener('DOMContentLoaded', async () => {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Si on n'est pas sur Amazon, on affiche une alerte dans la popup
    if (tab && !tab.url.includes("amazon.")) {
        document.getElementById('not-amazon-warning').style.display = "block";
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
        
        window.close();
    }
});