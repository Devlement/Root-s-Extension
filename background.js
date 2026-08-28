chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "open_popup") {

        chrome.action.openPopup().catch(err => console.log("Erreur d'ouverture :", err));
    }
});
