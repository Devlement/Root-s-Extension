console.log("[Rootine] Script prêt avec roue d'actions !");

const ASSETS_URL = chrome.runtime.getURL("assets/");
const ROOT_IDLE_GIF = ASSETS_URL + "root_idle.gif";
const ROOT_WALK_GIF = ASSETS_URL + "root_walk.gif";
const ROOT_THINK_GIF = ASSETS_URL + "root_think.gif";

let rootElement = null;
let wheelMenuElement = null;
let isRootActive = false;
let isWandering = false;
let wanderingTimeout = null;
let isCleanModeActive = false;
let mouseX = 0;
let mouseY = 0;
let isFollowingMouse = false;
let followInterval = null;


document.addEventListener('mousemove', (e) => {
    mouseX = window.scrollX + e.clientX;
    mouseY = window.scrollY + e.clientY;
});

const ROOT_SPEED = 150; 
const isAmazon = window.location.hostname.includes("amazon.");


chrome.storage.local.get(['rootWanderingEnabled'], (result) => {
    if (result.rootWanderingEnabled) {
        safeInitRoot();
    }
});

function safeInitRoot() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initRoot);
    } else {
        initRoot();
    }
}

function initRoot() {
    if (rootElement) return;
    createMascot();
    createWheelMenu();
    
    const startX = window.scrollX + Math.random() * (window.innerWidth - 100);
    const startY = window.scrollY + Math.random() * (window.innerHeight - 100);
    
    rootElement.style.setProperty('left', startX + 'px', 'important');
    rootElement.style.setProperty('top', startY + 'px', 'important');
    
    setTimeout(() => {
        rootElement.style.setProperty('opacity', '1', 'important');
        startWandering();
    }, 100);
}

function createMascot() {
    if (!rootElement) {
        rootElement = document.createElement('img');
        rootElement.id = 'root-mascot';
        rootElement.src = ROOT_IDLE_GIF;
        

        rootElement.style.position = 'absolute';
        rootElement.style.zIndex = '999999';
        rootElement.style.cursor = 'pointer';
        

        rootElement.style.width = '80px'; 
        rootElement.style.height = 'auto'; 
        

        rootElement.style.imageRendering = 'pixelated'; 
        
        rootElement.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleWheelMenu();
        });

        document.body.appendChild(rootElement);
    }
}


function createWheelMenu() {
    if (wheelMenuElement) return;

    wheelMenuElement = document.createElement('div');
    wheelMenuElement.id = 'root-wheel-menu';
    

    wheelMenuElement.style.setProperty('position', 'fixed', 'important');
    wheelMenuElement.style.setProperty('display', 'none', 'important'); 
    wheelMenuElement.style.setProperty('z-index', '2147483647', 'important');
    wheelMenuElement.style.setProperty('background', '#1a1a1a', 'important');
    wheelMenuElement.style.setProperty('border', '2px solid #ffffff', 'important');
    wheelMenuElement.style.setProperty('border-radius', '8px', 'important');
    wheelMenuElement.style.setProperty('padding', '6px', 'important');
    wheelMenuElement.style.setProperty('gap', '6px', 'important');
    wheelMenuElement.style.setProperty('box-shadow', '0 4px 10px rgba(0,0,0,0.5)', 'important');
    wheelMenuElement.style.setProperty('transition', 'opacity 0.2s ease', 'important');


    wheelMenuElement.innerHTML = `
        <button class="root-wheel-btn" data-action="follow" title="Suivre la souris">
            <svg width="20" height="20" viewBox="0 0 10 10" style="image-rendering: pixelated; shape-rendering: crispEdges;"><path d="M1 1h2v1H1zM1 2h3v1H1zM1 3h4v1H1zM1 4h5v1H1zM1 5h6v1H1zM1 6h4v1H1zM1 7h2v1H1zM4 7h1v1H4zM5 8h1v1H5z" fill="#FFFFFF"/></svg>
        </button>
        <button class="root-wheel-btn" data-action="clean" title="Mode Nettoyeur">
            <svg width="20" height="20" viewBox="0 0 10 10" style="image-rendering: pixelated; shape-rendering: crispEdges;"><path d="M1 1h2v2H1zM7 1h2v2H7zM3 3h4v2H3zM1 7h2v2H1zM7 7h2v2H7z" fill="#FFFFFF"/></svg>
        </button>
        <button class="root-wheel-btn" data-action="tp" title="Changer de place">
            <svg width="20" height="20" viewBox="0 0 10 10" style="image-rendering: pixelated; shape-rendering: crispEdges;"><path d="M4 1h2v2H4zM1 4h2v2H1zM7 4h2v2H7zM4 7h2v2H4zM2 2h1v1H2zM7 2h1v1H7zM2 7h1v1H2zM7 7h1v1H7z" fill="#FFFFFF"/></svg>
        </button>
        <button class="root-wheel-btn" data-action="hide" title="Faire disparaître Root">
            <svg width="20" height="20" viewBox="0 0 10 10" style="image-rendering: pixelated; shape-rendering: crispEdges;"><path d="M1 1h2v2H1zM7 1h2v2H7zM4 4h2v2H4zM1 7h2v2H1zM7 7h2v2H7z" fill="#FFFFFF"/></svg>
        </button>
    `;

    document.body.appendChild(wheelMenuElement);


    wheelMenuElement.querySelectorAll('.root-wheel-btn').forEach(btn => {
        btn.style.setProperty('background', '#2a2a2a', 'important');
        btn.style.setProperty('border', '1px solid #ffffff', 'important');
        btn.style.setProperty('border-radius', '4px', 'important');
        btn.style.setProperty('width', '36px', 'important');
        btn.style.setProperty('height', '36px', 'important');
        btn.style.setProperty('display', 'flex', 'important');
        btn.style.setProperty('align-items', 'center', 'important');
        btn.style.setProperty('justify-content', 'center', 'important');
        btn.style.setProperty('cursor', 'pointer', 'important');
        btn.style.setProperty('margin', '0', 'important');
        btn.style.setProperty('padding', '0', 'important');
        btn.style.setProperty('flex-shrink', '0', 'important');

        btn.addEventListener('mouseenter', () => btn.style.setProperty('background', '#444444', 'important'));
        btn.addEventListener('mouseleave', () => btn.style.setProperty('background', '#2a2a2a', 'important'));

        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const action = btn.getAttribute('data-action');
            executeAction(action);
            closeWheelMenu();
        });
    });

    document.addEventListener('click', (e) => {
        const isMascot = e.target.id === 'root-mascot';
        const isMenu = wheelMenuElement.contains(e.target);
        if (!isMascot && !isMenu) {
            closeWheelMenu();
        }
    });
}

function toggleWheelMenu() {
    if (!wheelMenuElement || !rootElement) return;
    

    const isVisible = wheelMenuElement.style.getPropertyValue('display') === 'flex';
    
    if (isVisible) {
        closeWheelMenu();
    } else {
        stopWandering();
        const rect = rootElement.getBoundingClientRect();
        

        const menuX = Math.max(10, rect.left + (rect.width / 2) - 90);
        const menuY = Math.max(10, rect.top - 60);

        wheelMenuElement.style.setProperty('left', menuX + 'px', 'important');
        wheelMenuElement.style.setProperty('top', menuY + 'px', 'important');
        

        wheelMenuElement.style.setProperty('display', 'flex', 'important'); 
        wheelMenuElement.style.setProperty('visibility', 'visible', 'important');
        

        requestAnimationFrame(() => {
            wheelMenuElement.style.setProperty('opacity', '1', 'important');
        });
    }
}

function closeWheelMenu() {
    if (!wheelMenuElement) return;
    
    wheelMenuElement.style.setProperty('opacity', '0', 'important');
    wheelMenuElement.style.setProperty('visibility', 'hidden', 'important');
    wheelMenuElement.style.setProperty('display', 'none', 'important');
    

    if (!isRootActive && !isCleanModeActive && !isFollowingMouse) {
        startWandering();
    }
}

function executeAction(action) {
    if (action === 'follow') {
        toggleFollowMode();
    } 
    else if (action === 'clean') {
        toggleCleanMode();
    } 
    else if (action === 'tp') {
        teleportRoot();
    }
    else if (action === 'hide') {

        chrome.storage.local.set({ rootWanderingEnabled: false });
        

        removeMascot(); 
    }
}


function toggleCleanMode() {
    isCleanModeActive = !isCleanModeActive;
    if (isCleanModeActive) {
        stopWandering();
        document.body.style.cursor = 'crosshair';
        document.addEventListener('mouseover', handleCleanHover);
        document.addEventListener('click', handleCleanClick, true);
    } else {
        disableCleanMode();
    }
}

function handleCleanHover(e) {
    if (!isCleanModeActive || e.target.id === 'root-mascot' || e.target.closest('#root-wheel-menu')) return;
    e.target.classList.add('root-clean-hover');
    e.target.addEventListener('mouseout', () => e.target.classList.remove('root-clean-hover'), { once: true });
}

function handleCleanClick(e) {
    if (!isCleanModeActive) return;
    if (e.target.id === 'root-mascot' || e.target.closest('#root-wheel-menu')) return;

    e.preventDefault();
    e.stopPropagation();

    e.target.style.transition = 'all 0.4s ease';
    e.target.style.transform = 'scale(0) rotate(10deg)';
    e.target.style.opacity = '0';
    
    setTimeout(() => {
        if (e.target.parentNode) e.target.parentNode.removeChild(e.target);
    }, 400);

    disableCleanMode();
}

function disableCleanMode() {
    isCleanModeActive = false;
    document.body.style.cursor = 'default';
    document.querySelectorAll('.root-clean-hover').forEach(el => el.classList.remove('root-clean-hover'));
    document.removeEventListener('mouseover', handleCleanHover);
    document.removeEventListener('click', handleCleanClick, true);
    startWandering();
}


function teleportRoot() {
    if (!rootElement) return;
    
    stopWandering();
    spawnParticles();

    const newX = window.scrollX + Math.random() * (window.innerWidth - 120);
    const newY = window.scrollY + Math.random() * (window.innerHeight - 120);

    rootElement.style.setProperty('transition', 'none', 'important');
    rootElement.style.setProperty('opacity', '0', 'important');

    setTimeout(() => {
        rootElement.style.setProperty('left', newX + 'px', 'important');
        rootElement.style.setProperty('top', newY + 'px', 'important');
        rootElement.style.setProperty('transition', 'opacity 0.3s ease', 'important');
        rootElement.style.setProperty('opacity', '1', 'important');
        spawnParticles();
        setTimeout(startWandering, 1000);
    }, 300);
}

function spawnParticles() {
    const rect = rootElement.getBoundingClientRect();
    const centerX = window.scrollX + rect.left + rect.width / 2;
    const centerY = window.scrollY + rect.top + rect.height / 2;

    for (let i = 0; i < 12; i++) {
        const particle = document.createElement('div');
        particle.className = 'root-sparkle';
        particle.style.left = centerX + 'px';
        particle.style.top = centerY + 'px';

        const angle = (i / 12) * Math.PI * 2;
        const dist = 40 + Math.random() * 30;
        particle.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
        particle.style.setProperty('--dy', `${Math.sin(angle) * dist}px`);

        document.body.appendChild(particle);
        setTimeout(() => particle.remove(), 600);
    }
}


function freezePosition() {
    if (!rootElement) return;
    const rect = rootElement.getBoundingClientRect();
    rootElement.style.setProperty('transition', 'none', 'important');
    rootElement.style.setProperty('left', (window.scrollX + rect.left) + 'px', 'important');
    rootElement.style.setProperty('top', (window.scrollY + rect.top) + 'px', 'important');
}

function removeMascot() {
    stopWandering();
    closeWheelMenu();
    if (rootElement) {
        rootElement.style.setProperty('transition', 'opacity 0.5s ease', 'important');
        rootElement.style.setProperty('opacity', '0', 'important');
        setTimeout(() => {
            if (rootElement && rootElement.parentNode) rootElement.parentNode.removeChild(rootElement);
            if (wheelMenuElement && wheelMenuElement.parentNode) wheelMenuElement.parentNode.removeChild(wheelMenuElement);
            rootElement = null;
            wheelMenuElement = null;
            isRootActive = false;
        }, 500);
    }
}

function startWandering() {

    if (isRootActive || isCleanModeActive || isWandering || isFollowingMouse) return;
    isWandering = true;
    wanderLoop();
}

function stopWandering() {
    isWandering = false;
    clearTimeout(wanderingTimeout);
    freezePosition(); 
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
    rootElement.style.setProperty('transition', `top ${duration}s linear, left ${duration}s linear`, 'important');

    window.requestAnimationFrame(() => {
        rootElement.style.setProperty('left', destX + 'px', 'important');
        rootElement.style.setProperty('top', destY + 'px', 'important');
    });

    wanderingTimeout = setTimeout(() => {
        if (isWandering && rootElement) {
            rootElement.src = ROOT_IDLE_GIF;
            freezePosition(); 
            wanderingTimeout = setTimeout(wanderLoop, 500);
        }
    }, duration * 1000);
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "toggle_wandering") {
        if (request.enabled) safeInitRoot();
        else removeMascot();
        
        // CORRECTION : On rassure Chrome en lui confirmant que l'action est faite
        sendResponse({ status: "ok" }); 
        return true;
    }

    if (request.action === "start_root") {
        if (!isAmazon) {
            // CORRECTION : On répond à Chrome même si on annule l'action
            sendResponse({ status: "ignored" }); 
            return true;
        }
        if (!rootElement) safeInitRoot();

        stopWandering(); 
        closeWheelMenu();
        isRootActive = true;
        if (rootElement) rootElement.src = ROOT_THINK_GIF; 
        
        setTimeout(() => {
            startRootSequence(request.strategy, request.keyword, request.filters);
        }, 1500);
        
        sendResponse({ status: "ok" });
    }
    
    return true; 
});

function startRootSequence(strategy, keyword, filters) {
    document.querySelectorAll('.root-winner-highlight').forEach(el => el.classList.remove('root-winner-highlight'));
    const winner = findBestAmazonProduct(strategy, keyword, filters);
    
    if (winner) {
        winner.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => { moveToTarget(winner); }, 1000);
    } else {
        rootElement.src = ROOT_THINK_GIF;
        setTimeout(() => {
            isRootActive = false;
            startWandering(); 
        }, 3000);
    }
}

function moveToTarget(targetElement) {
    if (!rootElement || !targetElement) return;

    // Récupération des dimensions du produit et de la mascotte
    const rect = targetElement.getBoundingClientRect();
    const rootRect = rootElement.getBoundingClientRect();

    // Calcul du centre de la carte du produit
    const targetCenterX = window.scrollX + rect.left + (rect.width / 2);
    const targetTopY = window.scrollY + rect.top;

    // On centre Root pile au-dessus du produit (on soustrait la moitié de sa largeur)
    // Le +20 permet à Root de "mordre" légèrement sur le cadre orange pour être bien visible
    const destX = Math.max(0, targetCenterX - (rootRect.width / 2));
    const destY = Math.max(0, targetTopY - rootRect.height + 20); 

    const startX = window.scrollX + rootRect.left;
    const startY = window.scrollY + rootRect.top;

    // Gestion du retournement (pour qu'il regarde dans la bonne direction)
    if (destX < startX) rootElement.classList.add('flip');
    else rootElement.classList.remove('flip');

    const searchSpeed = ROOT_SPEED * 3;
    const distance = Math.sqrt(Math.pow(destX - startX, 2) + Math.pow(destY - startY, 2));
    
    // Sécurité : on s'assure que l'animation dure au moins 0.5s pour éviter les téléportations étranges
    const duration = Math.max(0.5, distance / searchSpeed);

    rootElement.src = ROOT_WALK_GIF;
    rootElement.style.setProperty('transition', `top ${duration}s ease-in-out, left ${duration}s ease-in-out`, 'important');

    window.requestAnimationFrame(() => {
        rootElement.style.setProperty('left', destX + 'px', 'important');
        rootElement.style.setProperty('top', destY + 'px', 'important');
    });

    setTimeout(() => {
        if (!rootElement) return;
        rootElement.src = ROOT_IDLE_GIF;
        rootElement.classList.remove('flip'); 
        freezePosition(); 
        
        targetElement.classList.add('root-winner-highlight');
        
        setTimeout(() => {
            isRootActive = false;
            startWandering(); 
        }, 2000); 

    }, duration * 1000); 
}

function findBestAmazonProduct(strategy, keyword, filters) {
    const productCards = document.querySelectorAll('[data-component-type="s-search-result"]');
    const priceRegex = /[\d\s]+[,.]?\d*/;
    const ratingRegex = /(\d[.,]\d|\d)\s*(?:sur|\/)\s*5/i; 
    let foundProducts = [];
    const lowerKeyword = keyword ? keyword.toLowerCase() : "";

    productCards.forEach(card => {
        const rect = card.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;

        const text = (card.innerText || card.textContent || "").toLowerCase();
        
        if (lowerKeyword && !text.includes(lowerKeyword)) return;
        if (filters.noSponsored && (text.includes("sponsorisé") || text.includes("sponsored"))) return;
        
        const isPrime = text.includes("prime") || card.querySelector('.a-icon-prime');
        if (filters.primeOnly && !isPrime) return;

        let rating = 0;
        let ratingMatch = text.match(ratingRegex);
        if (ratingMatch) rating = parseFloat(ratingMatch[1].replace(',', '.'));
        if (filters.minFourStars && rating < 4.0) return;

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


function toggleFollowMode() {
    isFollowingMouse = !isFollowingMouse;
    
    if (isFollowingMouse) {
        stopWandering();
        walkToMouse();
        

        followInterval = setInterval(walkToMouse, 5000);
    } else {

        clearInterval(followInterval);
        followInterval = null;
        startWandering();
    }
}

function walkToMouse() {
    if (!isFollowingMouse) return;
    

    walkToSpecificPoint(mouseX, mouseY, () => {

    });
}

function walkToSpecificPoint(destX, destY, onComplete) {
    if (!rootElement) return;
    
    const rootRect = rootElement.getBoundingClientRect();
    const startX = window.scrollX + rootRect.left + (rootRect.width / 2);
    const startY = window.scrollY + rootRect.top + (rootRect.height / 2);


    if (destX < startX) rootElement.classList.add('flip');
    else rootElement.classList.remove('flip');

    const distance = Math.sqrt(Math.pow(destX - startX, 2) + Math.pow(destY - startY, 2));
    const duration = distance / ROOT_SPEED;

    rootElement.src = ROOT_WALK_GIF;
    rootElement.style.setProperty('transition', `top ${duration}s linear, left ${duration}s linear`, 'important');

    window.requestAnimationFrame(() => {

        rootElement.style.setProperty('left', (destX - rootRect.width / 2) + 'px', 'important');
        rootElement.style.setProperty('top', (destY - rootRect.height / 2) + 'px', 'important');
    });

    clearTimeout(wanderingTimeout);
    wanderingTimeout = setTimeout(() => {
        rootElement.src = ROOT_IDLE_GIF;
        freezePosition();
        if (onComplete) onComplete();
    }, duration * 1000);
}
