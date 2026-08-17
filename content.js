console.log("[Root] Script injecté. Début de l'exploration...");

const ASSETS_URL = chrome.runtime.getURL("assets/");
const ROOT_IDLE_GIF = ASSETS_URL + "root_idle.gif";
const ROOT_WALK_GIF = ASSETS_URL + "root_walk.gif";
const ROOT_THINK_GIF = ASSETS_URL + "root_think.gif";

let rootElement = null;
let isRootActive = false;
let isWandering = false;
let wanderingTimeout = null;
const ROOT_SPEED = 150; 

// --- VÉRIFICATION AMAZON ---
const isAmazon = window.location.hostname.includes("amazon.");

initRoot();

function initRoot() {
    createMascot();
    const startX = window.scrollX + Math.random() * (window.innerWidth - 100);
    const startY = window.scrollY + Math.random() * (window.innerHeight - 100);
    
    rootElement.style.setProperty('left', startX + 'px', 'important');
    rootElement.style.setProperty('top', startY + 'px', 'important');
    
    setTimeout(() => {
        rootElement.style.setProperty('opacity', '1', 'important');
        startWandering();
    }, 500);
}

function createMascot() {
    if (!rootElement) {
        rootElement = document.createElement('img');
        rootElement.id = 'root-mascot';
        rootElement.addEventListener('click', () => {
            stopWandering();
            rootElement.style.setProperty('opacity', '0', 'important');
            setTimeout(() => {
                if (rootElement && rootElement.parentNode) rootElement.parentNode.removeChild(rootElement);
                rootElement = null;
                isRootActive = false;
            }, 500);
        });
        document.body.appendChild(rootElement);
    }
}

// === LOGIQUE DE BALADE ALÉATOIRE ===

function startWandering() {
    if (isRootActive) return;
    isWandering = true;
    wanderLoop();
}

function stopWandering() {
    isWandering = false;
    clearTimeout(wanderingTimeout);
    if (rootElement) rootElement.style.setProperty('transition', 'opacity 0.5s', 'important');
}

function wanderLoop() {
    if (!isWandering) return;
    const action = Math.random();
    if (action < 0.4) walkToRandomPoint();
    else if (action < 0.7) {
        rootElement.src = ROOT_IDLE_GIF;
        wanderingTimeout = setTimeout(wanderLoop, 2000 + Math.random() * 2000);
    } else {
        rootElement.src = ROOT_THINK_GIF;
        wanderingTimeout = setTimeout(wanderLoop, 3000 + Math.random() * 2000);
    }
}

function walkToRandomPoint() {
    if (!isWandering || !rootElement) return;
    const destX = window.scrollX + Math.max(0, Math.random() * (window.innerWidth - 100));
    const destY = window.scrollY + Math.max(0, Math.random() * (window.innerHeight - 100));

    const rootRect = rootElement.getBoundingClientRect();
    const startX = window.scrollX + rootRect.left;
    const startY = window.scrollY + rootRect.top;

    if (destX < startX) rootElement.classList.add('flip');
    else rootElement.classList.remove('flip');

    const distance = Math.sqrt(Math.pow(destX - startX, 2) + Math.pow(destY - startY, 2));
    const duration = distance / ROOT_SPEED;

    rootElement.src = ROOT_WALK_GIF;
    rootElement.style.setProperty('transition', `top ${duration}s linear, left ${duration}s linear, opacity 0.5s`, 'important');

    window.requestAnimationFrame(() => {
        rootElement.style.setProperty('left', destX + 'px', 'important');
        rootElement.style.setProperty('top', destY + 'px', 'important');
    });

    wanderingTimeout = setTimeout(() => {
        rootElement.src = ROOT_IDLE_GIF;
        wanderingTimeout = setTimeout(wanderLoop, 500);
    }, duration * 1000);
}

// === LOGIQUE DE RECHERCHE ===

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // BLOCAGE : Si ce n'est pas Amazon, Root refuse la mission et continue sa vie
    if (!isAmazon) {
        console.log("[Root] Mission refusée : Root est exclusivement programmé pour Amazon.");
        return; 
    }

    if (request.action === "start_root" && !isRootActive) {
        stopWandering();
        isRootActive = true;
        rootElement.src = ROOT_THINK_GIF;
        
        setTimeout(() => {
            startRootSequence(request.strategy, request.keyword, request.filters);
        }, 1500);
    }
});

function startRootSequence(strategy, keyword, filters) {
    document.querySelectorAll('.root-winner-highlight').forEach(el => el.classList.remove('root-winner-highlight'));
    document.querySelectorAll('.root-badge').forEach(el => el.remove());

    const winner = findBestAmazonProduct(strategy, keyword, filters);
    
    if (winner) {
        winner.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => { moveToTarget(winner); }, 1000);
    } else {
        console.log("[Root] Aucun produit trouvé correspondant aux critères Amazon.");
        rootElement.src = ROOT_THINK_GIF;
        setTimeout(() => {
            isRootActive = false;
            startWandering(); 
        }, 3000);
    }
}

function moveToTarget(targetElement) {
    if (!rootElement || !targetElement) return;

    const rect = targetElement.getBoundingClientRect();
    const destX = Math.max(0, window.scrollX + rect.left - 10); 
    const destY = Math.max(0, window.scrollY + rect.top - 40); 

    const rootRect = rootElement.getBoundingClientRect();
    const startX = window.scrollX + rootRect.left;
    const startY = window.scrollY + rootRect.top;

    if (destX < startX) rootElement.classList.add('flip');
    else rootElement.classList.remove('flip');

    const distance = Math.sqrt(Math.pow(destX - startX, 2) + Math.pow(destY - startY, 2));
    const duration = distance / (ROOT_SPEED * 1.5);

    rootElement.src = ROOT_WALK_GIF;
    rootElement.style.setProperty('transition', `top ${duration}s ease-in-out, left ${duration}s ease-in-out, opacity 0.5s`, 'important');

    window.requestAnimationFrame(() => {
        rootElement.style.setProperty('left', destX + 'px', 'important');
        rootElement.style.setProperty('top', destY + 'px', 'important');
    });

    setTimeout(() => {
        rootElement.src = ROOT_IDLE_GIF;
        rootElement.classList.remove('flip'); 
        targetElement.classList.add('root-winner-highlight');
        
        setTimeout(() => {
            isRootActive = false; 
            startWandering(); 
        }, 2000); 

    }, duration * 1000); 
}

function findBestAmazonProduct(strategy, keyword, filters) {
    // Spécifique Amazon : On cible les conteneurs de produits typiques pour éviter le bruit
    const productCards = document.querySelectorAll('[data-component-type="s-search-result"], .s-result-item');
    
    const priceRegex = /[\d\s]+[,.]?\d*/;
    const ratingRegex = /(\d[.,]\d|\d)\s*(?:sur|\/)\s*5/i; 
    let foundProducts = [];
    const lowerKeyword = keyword ? keyword.toLowerCase() : "";

    productCards.forEach(card => {
        const text = (card.innerText || card.textContent || "").toLowerCase();
        
        // Filtre 1 : Mot clé
        if (lowerKeyword && !text.includes(lowerKeyword)) return;

        // Filtre 2 : Sponsorisé
        if (filters.noSponsored && (text.includes("sponsorisé") || text.includes("sponsored"))) return;

        // Filtre 3 : Prime Uniquement
        const isPrime = text.includes("prime") || card.querySelector('.a-icon-prime');
        if (filters.primeOnly && !isPrime) return;

        // Filtre 4 : Notes
        let rating = 0;
        let ratingMatch = text.match(ratingRegex);
        if (ratingMatch) {
            rating = parseFloat(ratingMatch[1].replace(',', '.'));
        }
        if (filters.minFourStars && rating < 4.0) return;

        // Recherche du prix dans cette carte
        const priceElement = card.querySelector('.a-price .a-offscreen, .a-price-whole');
        if (priceElement) {
            let priceText = priceElement.innerText || priceElement.textContent;
            let match = priceText.match(priceRegex);
            if (match) {
                let priceStr = match[0].replace(/\s/g, '').replace(',', '.');
                let price = parseFloat(priceStr);
                
                if (!isNaN(price) && price > 0) {
                    foundProducts.push({ price: price, rating: rating, element: card });
                }
            }
        }
    });

    if (foundProducts.length === 0) return null;

    let chosenProduct;
    if (strategy === 'best_rated') {
        foundProducts.sort((a, b) => b.rating - a.rating || a.price - b.price);
        chosenProduct = foundProducts[0];
    } else {
        foundProducts.sort((a, b) => a.price - b.price);
        if (strategy === 'cheapest') chosenProduct = foundProducts[0];
        else if (strategy === 'expensive') chosenProduct = foundProducts[foundProducts.length - 1];
        else if (strategy === 'median') chosenProduct = foundProducts[Math.floor(foundProducts.length / 2)];
    }

    return chosenProduct.element;
}