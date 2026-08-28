chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "open_popup") {
        // Cette commande demande à Chrome d'ouvrir la popup de l'extension
        chrome.action.openPopup().catch(err => console.log("Erreur d'ouverture :", err));
    }
});