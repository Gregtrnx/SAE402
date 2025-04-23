const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Images
const images = {
    fruit1: new Image(),
    fruit2: new Image(),
    fruit3: new Image(),
    bomb: new Image(),
    background: new Image(),
    rotateGif: new Image(),
    heart: new Image(),
    bonusBackground: new Image(),
    chestImage: new Image(),
    artworkImage: new Image(),
    introBackground: new Image(),
    characterImage: new Image()
};

// Chargement des images
images.fruit1.src = 'images/fruit1.png';
images.fruit2.src = 'images/fruit2.png';
images.fruit3.src = 'images/fruit3.png';
images.bomb.src = 'images/bomb.png';
images.background.src = 'images/background.png';
images.rotateGif.src = 'images/rotate.gif';
images.heart.src = 'images/coeur.png';
images.bonusBackground.src = 'images/grenier.png';
images.chestImage.src = 'images/coffre.png';
images.artworkImage.src = 'images/peinture.png';
images.introBackground.src = 'images/fondMusee.png';
images.characterImage.src = 'images/perso.png';

// Variables pour les boutons et UI
const buttonSize = 40;
const buttonPadding = 10;
const heartBgColor = '#EFB10F';
const cornerRadius = 5;
const crossButtonPos = { x: 0, y: buttonPadding };
const helpButtonPos = { x: 0, y: buttonPadding * 2 + buttonSize };

// Variable pour suivre le chargement des images
let imagesLoaded = 0;
const totalImages = Object.keys(images).length;

// Vérifier que TOUTES les images sont chargées avant de démarrer
Object.values(images).forEach(img => {
    img.onload = () => {
        imagesLoaded++;
        // Vérifier si TOUTES les images (y compris intro) sont chargées
        if (imagesLoaded === totalImages && Object.values(images).every(i => i.complete && i.naturalHeight !== 0)) {
             startGame(); // Démarrer seulement quand TOUT est prêt
        } else if (imagesLoaded === totalImages) {
            console.error("Certaines images n'ont pas pu être chargées correctement.");
            // Afficher un message d'erreur à l'utilisateur sur le canvas ?
            ctx.fillStyle = 'red';
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText("Erreur de chargement des images. Vérifiez la console.", canvas.width / 2, canvas.height / 2);
        }
    };
    img.onerror = (e) => {
        console.error(`Erreur de chargement de l'image: ${img.src}`, e);
        // Marquer comme "chargé" pour ne pas bloquer indéfiniment, mais le contrôle .complete échouera
        imagesLoaded++;
        if (imagesLoaded === totalImages) {
             console.error("Démarrage annulé à cause d'erreurs de chargement.");
             ctx.fillStyle = 'red';
             ctx.font = '20px Arial';
             ctx.textAlign = 'center';
             ctx.fillText("Erreur critique de chargement. Impossible de démarrer.", canvas.width / 2, canvas.height / 2);
        }
    };
});

// Ajuster la taille du canvas pour qu'il soit responsive
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    // Mettre à jour la position des boutons lors du redimensionnement
    crossButtonPos.x = canvas.width - buttonSize - buttonPadding;
    crossButtonPos.y = buttonPadding;
    helpButtonPos.x = canvas.width - buttonSize - buttonPadding;
    helpButtonPos.y = buttonPadding * 2 + buttonSize;

    // Redessiner immédiatement
    if (imagesLoaded === totalImages) {
       drawGame();
    }
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Détection de l'orientation
let isLandscape = window.innerWidth > window.innerHeight;
window.addEventListener('resize', () => {
    const ছিলLandscape = isLandscape;
    isLandscape = window.innerWidth > window.innerHeight;
    if (isLandscape !== ছিলLandscape && imagesLoaded === totalImages) {
        drawGame();
    }
});

// --- Fonction Utiliaire: Dessiner un rectangle arrondi ---
function drawRoundedRect(x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.arcTo(x + width, y, x + width, y + radius, radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
    ctx.lineTo(x + radius, y + height);
    ctx.arcTo(x, y + height, x, y + height - radius, radius);
    ctx.lineTo(x, y + radius);
    ctx.arcTo(x, y, x + radius, y, radius);
    ctx.closePath();
    ctx.fill();
}
// --- Fin Fonction Utiliaire ---

// Classe pour les objets du jeu
class GameObject {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.radius = 50;
        
        this.speedY = -5;
        this.speedX = (Math.random() - 0.5) * 2;
        
        this.gravity = 0.02;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.1;
        this.color = type === 'bomb' ? 'red' : 
                     type === 'fruit1' ? 'blue' :
                     type === 'fruit2' ? 'yellow' : 'green';
    }

    update() {
        this.speedY += this.gravity;
        this.y += this.speedY;
        this.x += this.speedX;
        this.rotation += this.rotationSpeed;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        const img = this.type === 'bomb' ? images.bomb :
                   this.type === 'fruit1' ? images.fruit1 :
                   this.type === 'fruit2' ? images.fruit2 : images.fruit3;
        
        const size = this.radius * 2;
        ctx.drawImage(img, -size/2, -size/2, size, size);
        
        ctx.restore();
    }

    isOffScreen() {
        return this.y > canvas.height + this.radius || 
               this.x < -this.radius || 
               this.x > canvas.width + this.radius;
    }
}

// Classe pour les particules de flamme
class FlameParticle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 3 + 2;
        this.speedX = (Math.random() - 0.5) * 2;
        this.speedY = (Math.random() - 0.5) * 2;
        this.life = 1;
        this.decay = Math.random() * 0.02 + 0.01;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.life -= this.decay;
        this.size *= 0.95;
    }

    draw() {
        const gradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, this.size
        );
        gradient.addColorStop(0, `rgba(255, 255, 0, ${this.life})`);
        gradient.addColorStop(0.5, `rgba(255, 100, 0, ${this.life})`);
        gradient.addColorStop(1, `rgba(255, 0, 0, ${this.life})`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Variables du jeu
let gameMode = 'intro';
let objects = [];
let score = 0;
let lives = 3;
let gameOver = false;
let lastSpawnTime = 0;
const spawnInterval = 1000;
const scoreToWin = 200;
const scratchRadius = 50;

// Variables pour le suivi du mouvement
let isDrawing = false;
let lastX = 0;
let lastY = 0;
let cutLine = [];

// Variables pour les particules de flamme
let flameParticles = [];

// Variables spécifiques à l'intro
let introTextState = 0;
const introTexts = [
    "Vous pénétrez dans un lieu hors du temps, où chaque œuvre raconte une histoire... mais toutes ne sont pas destinées à survivre. Ce soir, une toile unique — oubliée, interdite, condamnée — doit être détruite à minuit. Mais vous, vous êtes là pour la sauver.", // Texte 0
    "Votre mission : infiltrer le musée, déjouer les systèmes de sécurité, et retrouver La Peinture Perdue avant qu'il ne soit trop tard. Le compte à rebours a déjà commencé... Bonne chance, et souvenez-vous : ici, l'art vous observe. ",         // Texte 1
    // Ajoutez d'autres textes si nécessaire
];
let bubbleRect = { x: 0, y: 0, width: 0, height: 0 }; // Zone cliquable de la bulle

// Gestionnaire d'événements pour le clic/toucher
canvas.addEventListener('click', handleCanvasClick);
canvas.addEventListener('touchstart', handleCanvasTouch);

// Gestionnaire d'événements pour le mouvement continu
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);

canvas.addEventListener('touchstart', handleTouchStart);
canvas.addEventListener('touchmove', handleTouchMove);
canvas.addEventListener('touchend', stopDrawing);

// Fonction pour afficher la popup
function showTutorialPopup() {
    console.log("Afficher la popup tutoriel");
    const popup = document.getElementById('tutorialPopup');
    if (popup) {
        popup.style.display = 'block';
    }
}

// Fonction pour masquer la popup
function hideTutorialPopup() {
    const popup = document.getElementById('tutorialPopup');
    if (popup) {
        popup.style.display = 'none';
    }
}

// --- Nouvelle fonction pour réinitialiser le jeu à l'état d'intro ---
function resetToIntro() {
    console.log("Réinitialisation vers l'intro...");
    gameMode = 'intro';
    score = 0;
    lives = 3; // Remettre les vies par défaut
    gameOver = false;
    objects = [];
    flameParticles = [];
    cutLine = [];
    introTextState = 0; // Revenir au premier texte de l'intro
    isDrawing = false; // Assurer que le dessin est stoppé

    // Si le canvas hors-écran existe (pour le mode bonus), on le nettoie
    if (window.offscreenCanvas) {
        window.offscreenCanvas = null;
        window.offscreenCtx = null;
    }

    // Pas besoin de redémarrer la gameLoop, elle continue de tourner en arrière plan
    // On peut forcer un dessin immédiat si on veut voir l'intro tout de suite
    drawGame();
}
// --- Fin fonction de réinitialisation ---

// --- Modifier les gestionnaires de clics/touchers ---
function handleCanvasClick(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Bouton Croix (Actif sauf pendant Game Over peut-être?)
    // Si on veut qu'il soit actif même en game over, retirer la condition !gameOver
    if (x >= crossButtonPos.x && x <= crossButtonPos.x + buttonSize &&
        y >= crossButtonPos.y && y <= crossButtonPos.y + buttonSize) {
        resetToIntro(); // Appeler la fonction de réinitialisation
        return;         // Important d'arrêter le traitement ici
    }

    // Bouton Aide (Actif sauf pendant Game Over?)
    if (!gameOver) { // Si on ne veut pas qu'il soit actif en Game Over
        if (x >= helpButtonPos.x && x <= helpButtonPos.x + buttonSize &&
            y >= helpButtonPos.y && y <= helpButtonPos.y + buttonSize) {
            showTutorialPopup();
            return;
        }
    }

    // Logique spécifique aux modes (si pas géré par les boutons ci-dessus)
    if (gameMode === 'intro') {
        if (x >= bubbleRect.x && x <= bubbleRect.x + bubbleRect.width &&
            y >= bubbleRect.y && y <= bubbleRect.y + bubbleRect.height) {
            handleIntroClick();
        }
    } else if (gameMode === 'playing' && !gameOver) {
        checkCollision(x, y);
    }
}

function handleCanvasTouch(e) {
    e.preventDefault();

    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    // Bouton Croix
    if (x >= crossButtonPos.x && x <= crossButtonPos.x + buttonSize &&
        y >= crossButtonPos.y && y <= crossButtonPos.y + buttonSize) {
        resetToIntro(); // Appeler la fonction de réinitialisation
        return;         // Arrêter ici
    }

    // Bouton Aide
    if (!gameOver) { // Si on ne veut pas qu'il soit actif en Game Over
        if (x >= helpButtonPos.x && x <= helpButtonPos.x + buttonSize &&
            y >= helpButtonPos.y && y <= helpButtonPos.y + buttonSize) {
            showTutorialPopup();
            return;
        }
    }

    // Logique spécifique aux modes
    if (gameMode === 'intro') {
        if (x >= bubbleRect.x && x <= bubbleRect.x + bubbleRect.width &&
            y >= bubbleRect.y && y <= bubbleRect.y + bubbleRect.height) {
            handleIntroClick();
        }
    } else if (gameMode === 'playing' && !gameOver) {
        checkCollision(x, y);
    }
}

// --- Nouvelle fonction pour gérer le clic sur la bulle d'intro ---
function handleIntroClick() {
    introTextState++;
    if (introTextState >= introTexts.length) {
        // Commencer le jeu
        gameMode = 'playing';
        // Réinitialiser les variables de jeu pour une nouvelle partie
        score = 0;
        lives = 3;
        gameOver = false;
        objects = [];
        flameParticles = [];
        cutLine = [];
        lastSpawnTime = Date.now(); // Important pour le premier spawn
        introTextState = 0; // Réinitialiser pour la prochaine fois
        // Pas besoin d'appeler gameLoop ici, elle tourne déjà
    }
    // Pas besoin de redessiner ici, drawGame le fera à la prochaine frame
}
// --- Fin nouvelle fonction ---

function checkCollision(x, y) {
    if (gameMode !== 'playing') return;

    for (let i = objects.length - 1; i >= 0; i--) {
        const obj = objects[i];
        const distance = Math.sqrt(
            Math.pow(x - obj.x, 2) + Math.pow(y - obj.y, 2)
        );
        
        if (distance < obj.radius) {
            if (obj.type === 'bomb') {
                lives--;
                if (lives <= 0) {
                    gameOver = true;
                }
            } else {
                score += 10;
                if (score >= scoreToWin && gameMode === 'playing') {
                    gameMode = 'bonus';
                    objects = [];
                    flameParticles = [];
                    cutLine = [];
                    // Réinitialiser le canvas hors-écran pour s'assurer qu'un nouveau coffre sera créé
                    if (window.offscreenCanvas) {
                        window.offscreenCanvas = null;
                        window.offscreenCtx = null;
                    }
                }
            }
            if (!gameOver) {
               objects.splice(i, 1);
            } else {
                break;
            }
        }
    }
}

function spawnObject() {
    if (gameMode !== 'playing' || gameOver) return;

    const x = Math.random() * (canvas.width - 40) + 20;
    const y = canvas.height + 20;
    
    const type = Math.random() < 0.2 ? 'bomb' : 
                 Math.random() < 0.33 ? 'fruit1' :
                 Math.random() < 0.5 ? 'fruit2' : 'fruit3';
    
    const newObject = new GameObject(x, y, type);
    objects.push(newObject);
}

function update() {
    if (gameOver) return;

    if (gameMode === 'playing') {
        const currentTime = Date.now();
        if (currentTime - lastSpawnTime > spawnInterval) {
            spawnObject();
            lastSpawnTime = currentTime;
        }

        objects = objects.filter(obj => !obj.isOffScreen());
        objects.forEach(obj => obj.update());

        flameParticles = flameParticles.filter(particle => {
            particle.update();
            return particle.life > 0;
        });
    }
}

function draw(e) {
    if (!isDrawing || gameOver) return;

    const pos = getMousePos(e);

    if (gameMode === 'playing') {
        cutLine.push({ x: pos.x, y: pos.y });
        addFlameParticles(pos.x, pos.y);
        checkLineCollision(lastX, lastY, pos.x, pos.y);
    }

    lastX = pos.x;
    lastY = pos.y;
}

function drawGame() {
    if (isLandscape) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        const gifSize = Math.min(canvas.width, canvas.height) * 0.3;
        if (images.rotateGif.complete && images.rotateGif.naturalHeight !== 0) {
           ctx.drawImage(images.rotateGif, canvas.width / 2 - gifSize / 2, canvas.height / 2 - gifSize / 2, gifSize, gifSize);
        }
        ctx.fillStyle = 'white';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Veuillez tourner votre téléphone', canvas.width / 2, canvas.height / 2 + gifSize / 2 + 30);
        return;
    }

    ctx.save();

    if (gameMode === 'intro') {
        // --- Mode Intro ---
        ctx.drawImage(images.introBackground, 0, 0, canvas.width, canvas.height);

        // Personnage
        const charScale = 0.9;
        const charWidth = images.characterImage.width * charScale;
        const charHeight = images.characterImage.height * charScale;
        const charX = canvas.width / 2 - charWidth / 1.8;
        const charY = canvas.height / 2 - charHeight / 2.3; // Remonté
        ctx.drawImage(images.characterImage, charX, charY, charWidth, charHeight);

        // --- Dessin de la bulle et du texte (Nouvelle Logique) ---
        const textMaxWidth = canvas.width * 0.75;
        const textPadding = 20;
        const lineHeight = 24;
        const bubbleBottomMargin = 30;
        const bubbleBgColor = 'white';
        const bubbleBorderRadius = 10;

        // 1. Préparer le contexte pour la mesure du texte
        ctx.font = '16px Arial'; // Définir la police AVANT mesure
        ctx.textAlign = 'left'; // Alignement pour le dessin ligne par ligne
        ctx.textBaseline = 'top'; // Aligner en haut pour dessiner les lignes

        // 2. Calculer la disposition du texte et sa hauteur SANS dessiner
        const currentText = introTexts[introTextState];
        const layout = calculateTextLayout(ctx, currentText, textMaxWidth, lineHeight);
        const actualTextHeight = layout.height;

        // 3. Calculer les dimensions et la position de la bulle
        const bubbleWidth = textMaxWidth + 2 * textPadding;
        // Ajuster légèrement la hauteur de la bulle si plusieurs lignes
        const bubbleHeight = actualTextHeight + (layout.linesArray.length > 1 ? textPadding * 1.5 : textPadding * 2) ;
        const bubbleX = (canvas.width - bubbleWidth) / 2; // Centrer la bulle horizontalement
        const bubbleY = canvas.height - bubbleHeight - bubbleBottomMargin;

        // 4. Dessiner la bulle (rectangle arrondi blanc)
        ctx.fillStyle = bubbleBgColor;
        drawRoundedRect(bubbleX, bubbleY, bubbleWidth, bubbleHeight, bubbleBorderRadius);

        // 5. Dessiner le texte ligne par ligne DANS la bulle
        ctx.fillStyle = 'black'; // Couleur du texte
        const textStartX = bubbleX + textPadding; // X de départ du texte dans la bulle
        let currentY = bubbleY + textPadding;     // Y de départ de la première ligne
        for (const line of layout.linesArray) {
            ctx.fillText(line, textStartX, currentY);
            currentY += lineHeight; // Passer à la ligne suivante
        }

        // 6. Mettre à jour la zone cliquable avec les dimensions finales de la bulle
        bubbleRect = { x: bubbleX, y: bubbleY, width: bubbleWidth, height: bubbleHeight };

        // Dessiner les boutons
        drawButtons();
        ctx.textBaseline = 'alphabetic'; // Remettre la baseline par défaut

    } else if (gameMode === 'playing') {
        ctx.drawImage(images.background, 0, 0, canvas.width, canvas.height);
        objects.forEach(obj => obj.draw());

        flameParticles.forEach(particle => particle.draw());

        if (isDrawing && cutLine.length > 1) {
            ctx.beginPath();
            ctx.moveTo(cutLine[0].x, cutLine[0].y);
            for (let i = 1; i < cutLine.length; i++) {
                ctx.lineTo(cutLine[i].x, cutLine[i].y);
            }
            ctx.strokeStyle = 'rgba(255, 200, 0, 0.5)';
            ctx.lineWidth = 3;
            ctx.stroke();
        }

        drawUI();

    } else if (gameMode === 'bonus') {
        ctx.drawImage(images.bonusBackground, 0, 0, canvas.width, canvas.height);

        const artworkWidth = Math.min(canvas.width * 0.6, images.artworkImage.width);
        const artworkHeight = (artworkWidth / images.artworkImage.width) * images.artworkImage.height;
        const artworkX = canvas.width / 2 - artworkWidth / 2;
        const artworkY = canvas.height / 2 - artworkHeight / 2;

        // Augmenter la taille du coffre de 50%
        const chestScale = 2;
        const chestWidth = artworkWidth * chestScale;
        const chestHeight = artworkHeight * chestScale;
        const chestX = canvas.width / 2 - chestWidth / 2;
        const chestY = canvas.height / 2 - chestHeight / 2;

        // Dessiner d'abord l'oeuvre d'art (qui sera révélée par le grattage)
        ctx.drawImage(images.artworkImage, artworkX, artworkY, artworkWidth, artworkHeight);

        // Initialiser le canvas hors-écran pour le coffre lors du premier passage en mode bonus
        if (!window.offscreenCanvas) {
            window.offscreenCanvas = document.createElement('canvas');
            window.offscreenCanvas.width = canvas.width;
            window.offscreenCanvas.height = canvas.height;
            window.offscreenCtx = window.offscreenCanvas.getContext('2d');
            
            // Remplir le canvas hors-écran avec une couleur transparente
            window.offscreenCtx.clearRect(0, 0, window.offscreenCanvas.width, window.offscreenCanvas.height);
            
            // Dessiner le coffre sur le canvas hors-écran
            window.offscreenCtx.drawImage(images.chestImage, chestX, chestY, chestWidth, chestHeight);
        }
        
        // Si le joueur est en train de gratter
        if (isDrawing) {
            // Effacer une partie du coffre à la position du curseur/doigt
            window.offscreenCtx.globalCompositeOperation = 'destination-out';
            window.offscreenCtx.beginPath();
            window.offscreenCtx.arc(lastX, lastY, scratchRadius, 0, Math.PI * 2);
            window.offscreenCtx.fill();
            window.offscreenCtx.globalCompositeOperation = 'source-over';
        }
        
        // Dessiner le canvas hors-écran (avec le coffre et les zones grattées) sur le canvas principal
        ctx.drawImage(window.offscreenCanvas, 0, 0);

        drawButtons();

    }

    if (gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'red';
        ctx.font = 'bold 48px "Luckiest Guy"';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'black';
        ctx.shadowBlur = 5;
        ctx.fillText('Game Over!', canvas.width/2, canvas.height/2);
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
    }

    ctx.restore();
}

function drawUI() {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 3;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    const scoreX = 15;
    const scoreY = 40;
    ctx.font = 'bold 30px "Luckiest Guy"';
    ctx.fillStyle = '#EFB10F';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 0.2;
    ctx.textAlign = 'left';
    ctx.fillText(`Score : ${score}`, scoreX, scoreY);
    ctx.strokeText(`Score : ${score}`, scoreX, scoreY);

    const heartSize = 30;
    const heartPadding = 5;
    const heartsY = 65;
    const heartsTotalWidth = lives * heartSize + Math.max(0, lives - 1) * heartPadding;
    const heartsBgX = scoreX - 5;
    const heartsBgY = heartsY - 5;
    const heartsBgWidth = heartsTotalWidth + 10;
    const heartsBgHeight = heartSize + 10;
    const heartsStartX = heartsBgX + 5;

    ctx.fillStyle = heartBgColor;
    drawRoundedRect(heartsBgX, heartsBgY, heartsBgWidth, heartsBgHeight, cornerRadius);

    for (let i = 0; i < lives; i++) {
        if (images.heart.complete && images.heart.naturalHeight !== 0) {
             ctx.drawImage(images.heart, heartsStartX + i * (heartSize + heartPadding), heartsY, heartSize, heartSize);
        }
    }

    drawButtons();

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.textBaseline = 'alphabetic';
    ctx.lineWidth = 1;
}

function drawButtons() {
    ctx.fillStyle = heartBgColor;
    drawRoundedRect(crossButtonPos.x, crossButtonPos.y, buttonSize, buttonSize, cornerRadius);
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(crossButtonPos.x + buttonPadding, crossButtonPos.y + buttonPadding);
    ctx.lineTo(crossButtonPos.x + buttonSize - buttonPadding, crossButtonPos.y + buttonSize - buttonPadding);
    ctx.moveTo(crossButtonPos.x + buttonSize - buttonPadding, crossButtonPos.y + buttonPadding);
    ctx.lineTo(crossButtonPos.x + buttonPadding, crossButtonPos.y + buttonSize - buttonPadding);
    ctx.stroke();

    ctx.fillStyle = heartBgColor;
    drawRoundedRect(helpButtonPos.x, helpButtonPos.y, buttonSize, buttonSize, cornerRadius);
    ctx.fillStyle = 'white';
    ctx.font = 'bold 30px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('?', helpButtonPos.x + buttonSize / 2, helpButtonPos.y + buttonSize / 2 + 2);
    ctx.textBaseline = 'alphabetic';
}

function startDrawing(e) {
    if (gameOver) return;
    isDrawing = true;
    const pos = getMousePos(e);
    lastX = pos.x;
    lastY = pos.y;
    if (gameMode === 'playing') {
        cutLine = [{ x: lastX, y: lastY }];
    }
}

function stopDrawing() {
    isDrawing = false;
    if (gameMode === 'playing') {
        cutLine = [];
    }
}

function handleTouchStart(e) {
    e.preventDefault();
    startDrawing(e.touches[0]);
}

function handleTouchMove(e) {
    e.preventDefault();
    draw(e.touches[0]);
}

function getMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };
}

function checkLineCollision(x1, y1, x2, y2) {
    if (gameMode !== 'playing') return;

    // Vérifier que toutes les coordonnées sont des nombres valides
    if (x1 === undefined || y1 === undefined || x2 === undefined || y2 === undefined || 
        isNaN(x1) || isNaN(y1) || isNaN(x2) || isNaN(y2)) {
        return;
    }

    for (let i = objects.length - 1; i >= 0; i--) {
        const obj = objects[i];
        const lineBounds = {
            minX: Math.min(x1, x2), maxX: Math.max(x1, x2),
            minY: Math.min(y1, y2), maxY: Math.max(y1, y2)
        };
        if (lineBounds.maxX < obj.x - obj.radius || lineBounds.minX > obj.x + obj.radius ||
            lineBounds.maxY < obj.y - obj.radius || lineBounds.minY > obj.y + obj.radius) {
            continue;
        }

        if (lineCircleCollision(x1, y1, x2, y2, obj.x, obj.y, obj.radius)) {
             if (obj.type === 'bomb') {
                lives--;
                if (lives <= 0) {
                    gameOver = true;
                }
            } else {
                score += 10;
                if (score >= scoreToWin && gameMode === 'playing') {
                    gameMode = 'bonus';
                    objects = [];
                    flameParticles = [];
                    cutLine = [];
                    // Réinitialiser le canvas hors-écran pour s'assurer qu'un nouveau coffre sera créé
                    if (window.offscreenCanvas) {
                        window.offscreenCanvas = null;
                        window.offscreenCtx = null;
                    }
                }
            }
             if (!gameOver) {
                objects.splice(i, 1);
             } else {
                 break;
             }
        }
    }
}

function lineCircleCollision(x1, y1, x2, y2, cx, cy, r) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;

    // Éviter division par zéro si les points sont confondus
    if (lenSq === 0) return false;

    const t = ((cx - x1) * dx + (cy - y1) * dy) / lenSq;

    let closestX, closestY;

    if (t < 0) {
        closestX = x1;
        closestY = y1;
    } else if (t > 1) {
        closestX = x2;
        closestY = y2;
    } else {
        closestX = x1 + t * dx;
        closestY = y1 + t * dy;
    }

    const distX = cx - closestX;
    const distY = cy - closestY;
    const distanceSq = distX * distX + distY * distY;

    return distanceSq <= r * r;
}

function gameLoop() {
    // Mettre à jour seulement si on joue ou en bonus
    if (gameMode === 'playing' || gameMode === 'bonus') {
      update();
    }
    // Toujours dessiner l'état actuel
    drawGame();

    // Continuer la boucle tant que ce n'est pas game over
    if (!gameOver) {
      requestAnimationFrame(gameLoop);
    }
}

function startGame() {
    resizeCanvas();
    drawGame();
    requestAnimationFrame(gameLoop);
}

function addFlameParticles(x, y) {
     if (gameMode !== 'playing') return;
    for (let i = 0; i < 5; i++) {
        flameParticles.push(new FlameParticle(x, y));
    }
}

function calculateTextLayout(context, text, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    let lines = [];
    let testLine;
    let metrics;
    let testWidth;

    for (let n = 0; n < words.length; n++) {
        testLine = line + words[n] + ' ';
        metrics = context.measureText(testLine);
        testWidth = metrics.width;
        if (testWidth > maxWidth && line.length > 0) {
            lines.push(line.trim());
            line = words[n] + ' ';
        } else {
            line = testLine;
        }
    }
    lines.push(line.trim());

    const totalHeight = lines.length * lineHeight;
    return { linesArray: lines, height: totalHeight };
}

startGame(); 