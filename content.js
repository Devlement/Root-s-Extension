console.log("[Root] Script injecté. Début de l'exploration de la page...");

const ASSETS_URL = chrome.runtime.getURL("assets/");
const ROOT_IDLE_GIF = ASSETS_URL + "root_idle.gif";
const ROOT_WALK_GIF = ASSETS_URL + "root_walk.gif";
const ROOT_THINK_GIF = ASSETS_URL + "root_think.gif";

let rootElement = null;
let isRootActive = false;
let isWandering = false;
let wanderingTimeout = null;

// Vitesse de Root (en pixels par seconde)
const ROOT_SPEED = 150; 

// Initialisation dès le chargement de la page
initRoot();

function initRoot() {
    createMascot();
    
    // Fait apparaître Root aléatoirement sur l'écran
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
            // Disparaît au clic
            stopWandering();
            rootElement.style.setProperty('opacity', '0', 'important');
            setTimeout(() => {
                if (rootElement && rootElement.parentNode) {
                    rootElement.parentNode.removeChild(rootElement);
                }
                rootElement = null;
                isRootActive = false;
            }, 500);
        });

        document.body.appendChild(rootElement);
    }
}

// === LOGIQUE DE BALADE ALÉATOIRE ===

function startWandering() {
    if (isRootActive) return; // Ne pas errer si une mission est en cours
    isWandering = true;
    wanderLoop();
}

function stopWandering() {
    isWandering = false;
    clearTimeout(wanderingTimeout);
    if (rootElement) {
        rootElement.style.setProperty('transition', 'opacity 0.5s', 'important');
    }
}

function wanderLoop() {
    if (!isWandering) return;

    // Décide d'une action au hasard (40% marche, 30% pause, 30% réflexion)
    const action = Math.random();

    if (action < 0.4) {
        walkToRandomPoint();
    } else if (action < 0.7) {
        rootElement.src = ROOT_IDLE_GIF;
        wanderingTimeout = setTimeout(wanderLoop, 2000 + Math.random() * 2000);
    } else {
        rootElement.src = ROOT_THINK_GIF;
        wanderingTimeout = setTimeout(wanderLoop, 3000 + Math.random() * 2000);
    }
}

function walkToRandomPoint() {
    if (!isWandering || !rootElement) return;

    // Détermine un point aléatoire dans l'écran visible
    const destX = window.scrollX + Math.max(0, Math.random() * (window.innerWidth - 100));
    const destY = window.scrollY + Math.max(0, Math.random() * (window.innerHeight - 100));

    const rootRect = rootElement.getBoundingClientRect();
    const startX = window.scrollX + rootRect.left;
    const startY = window.scrollY + rootRect.top;

    // Flip selon la direction
    if (destX < startX) rootElement.classList.add('flip');
    else rootElement.classList.remove('flip');

    // Calcul de la distance et du temps de trajet (Théorème de Pythagore)
    const distance = Math.sqrt(Math.pow(destX - startX, 2) + Math.pow(destY - startY, 2));
    const duration = distance / ROOT_SPEED;

    rootElement.src = ROOT_WALK_GIF;
    
    // Applique la transition dynamiquement pour garder une vitesse constante
    rootElement.style.setProperty('transition', `top ${duration}s linear, left ${duration}s linear, opacity 0.5s`, 'important');

    window.requestAnimationFrame(() => {
        rootElement.style.setProperty('left', destX + 'px', 'important');
        rootElement.style.setProperty('top', destY + 'px', 'important');
    });

    wanderingTimeout = setTimeout(() => {
        rootElement.src = ROOT_IDLE_GIF;
        // Une fois arrivé, relance la boucle
        wanderingTimeout = setTimeout(wanderLoop, 500);
    }, duration * 1000);
}

// === LOGIQUE DE RECHERCHE (POPUP) ===

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "start_root" && !isRootActive) {
        // Interrompt la balade
        stopWandering();
        isRootActive = true;
        
        // Fait comprendre qu'il a reçu un ordre
        rootElement.src = ROOT_THINK_GIF;
        
        // Lance la séquence après 1.5s de réflexion
        setTimeout(() => {
            startRootSequence(request.strategy);
        }, 1500);
    }
});

function startRootSequence(strategy) {
    // Nettoie les anciens badges et encadrés de la page au cas où
    document.querySelectorAll('.root-winner-highlight').forEach(el => el.classList.remove('root-winner-highlight'));
    document.querySelectorAll('.root-badge').forEach(el => el.remove());

    const winner = findBestProduct(strategy);
    
    if (winner) {
        winner.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => {
            moveToTarget(winner);
        }, 1000);
    } else {
        console.log("[Root] Aucun produit trouvé.");
        rootElement.src = ROOT_THINK_GIF;
        setTimeout(() => {
            isRootActive = false;
            startWandering(); // Reprend sa balade si rien n'est trouvé
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

    // Calcul du temps pour la course finale (on le fait courir plus vite : x1.5)
    const distance = Math.sqrt(Math.pow(destX - startX, 2) + Math.pow(destY - startY, 2));
    const duration = distance / (ROOT_SPEED * 1.5);

    rootElement.src = ROOT_WALK_GIF;
    rootElement.style.setProperty('transition', `top ${duration}s ease-in-out, left ${duration}s ease-in-out, opacity 0.5s`, 'important');

    window.requestAnimationFrame(() => {
        rootElement.style.setProperty('left', destX + 'px', 'important');
        rootElement.style.setProperty('top', destY + 'px', 'important');
    });

    setTimeout(() => {
        // Root s'arrête devant le produit
        rootElement.src = ROOT_IDLE_GIF;
        rootElement.classList.remove('flip'); 
        
        // On remet la mise en valeur du produit (l'encadré)
        targetElement.classList.add('root-winner-highlight');
        
    }, duration * 1000); 
}

function findBestProduct(strategy) {
    const allElements = document.querySelectorAll('*');
    const priceRegex = /[\d\s]+[,.]?\d*/;
    let foundProducts = [];

    allElements.forEach(el => {
        if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'SVG', 'IMG'].includes(el.tagName)) return;
        const text = (el.innerText || el.textContent || "").trim();
        if (text.includes('€') && text.length > 0 && text.length < 40) {
            const rect = el.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
                let match = text.match(priceRegex);
                if (match) {
                    let priceStr = match[0].replace(/\s/g, '').replace(',', '.');
                    let price = parseFloat(priceStr);
                    if (!isNaN(price) && price > 0) {
                        const hasChildWithEuro = Array.from(el.children).some(child => (child.innerText || child.textContent || "").includes('€'));
                        if (!hasChildWithEuro) foundProducts.push({ price: price, element: el });
                    }
                }
            }
        }
    });

    if (foundProducts.length === 0) return null;
    foundProducts.sort((a, b) => a.price - b.price);

    let chosenProduct;
    if (strategy === 'cheapest') chosenProduct = foundProducts[0];
    else if (strategy === 'expensive') chosenProduct = foundProducts[foundProducts.length - 1];
    else if (strategy === 'median') chosenProduct = foundProducts[Math.floor(foundProducts.length / 2)];

    let container = chosenProduct.element;
    while (container.parentElement && (container.offsetWidth < 150 || container.offsetHeight < 100)) {
        container = container.parentElement;
        if (container.tagName === 'BODY') break;
    }
    return container;
}