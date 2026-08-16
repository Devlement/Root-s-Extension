document.getElementById('rescan-btn').addEventListener('click', async () => {
    // Récupère la stratégie sélectionnée (cheapest, median, ou expensive)
    const selectedStrategy = document.querySelector('input[name="strategy"]:checked').value;

    // Trouve l'onglet actif
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (tab) {
        // Envoie l'action ET la stratégie choisie
        chrome.tabs.sendMessage(tab.id, { 
            action: "start_root", 
            strategy: selectedStrategy 
        });
        
        window.close();
    }
});