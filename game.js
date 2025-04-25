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
    characterImage: new Image(),
    handImage: new Image() // Ajouter l'image de la main
};

// Sons
const introMusic = new Audio('sons/intro-song.mp3');
introMusic.loop = true;
const gameMusic = new Audio('sons/game-song.mp3');
gameMusic.loop = true;
const bonusMusic = new Audio('sons/bonus-song.mp3');
bonusMusic.loop = true;

// Variable pour savoir si l'utilisateur a interagi
let userInteracted = false;

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
images.handImage.src = 'images/main.png';

// Variables pour les boutons
const buttonSize = 40;
const buttonPadding = 10;
const heartBgColor = '#EFB10F';
const cornerRadius = 5;
const crossButtonPos = { x: 0, y: buttonPadding };
const helpButtonPos = { x: 0, y: buttonPadding * 2 + buttonSize };

// Variable pour suivre le chargement des images
let imagesLoaded = 0;
const totalImages = Object.keys(images).length;

// Vérifier que toutes les images sont chargées avant de démarrer
Object.values(images).forEach(img => {
    img.onload = () => {
        imagesLoaded++;
        if (imagesLoaded === totalImages && Object.values(images).every(i => i.complete && i.naturalHeight !== 0)) {
            startGame();
        } else if (imagesLoaded === totalImages) {
            console.error("Certaines images n'ont pas pu être chargées correctement.");
            ctx.fillStyle = 'red';
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText("Erreur de chargement des images. Vérifiez la console.", canvas.width / 2, canvas.height / 2);
        }
    };
    img.onerror = (e) => {
        console.error(`Erreur de chargement de l'image: ${img.src}`, e);
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
    crossButtonPos.x = canvas.width - buttonSize - buttonPadding;
    crossButtonPos.y = buttonPadding;
    helpButtonPos.x = canvas.width - buttonSize - buttonPadding;
    helpButtonPos.y = buttonPadding * 2 + buttonSize;

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

//rectangle arrondi
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

//gestion de la musique
function stopAllMusic() {
    introMusic.pause();
    introMusic.currentTime = 0;
    gameMusic.pause();
    gameMusic.currentTime = 0;
    bonusMusic.pause();
    bonusMusic.currentTime = 0;
}

function playMusic(musicElement) {
    if (!userInteracted) return;
    
    // Arrêter toutes les musiques avant de jouer la nouvelle
    stopAllMusic();
    
    try {
        const playPromise = musicElement.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                // Ignorer les erreurs de lecture automatique
                if (error.name === 'NotAllowedError' || error.name === 'AbortError') {
                    console.log("Lecture de la musique différée jusqu'à l'interaction de l'utilisateur");
                } else {
                    console.error("Erreur lors de la lecture de la musique : ", error);
                }
            });
        }
    } catch (error) {
        console.error("Erreur lors de la lecture de la musique : ", error);
    }
}

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
        ctx.drawImage(img, -size / 2, -size / 2, size, size);

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
const scratchRadius = 30;

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
    "You enter a timeless place, where each work tells a story... but not all are destined to survive. Tonight, a unique painting, forgotten, forbidden, condemned, is to be destroyed at midnight. But you are here to save it. ▶", 
    "Your mission: infiltrate the museum, foil the security systems and find The Lost Painting before it's too late. The countdown has already begun... Good luck, and remember: art is watching you. ▶",
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

//Réinitialiser le jeu à l'état d'intro
function resetToIntro() {
    console.log("Réinitialisation vers l'intro...");
    gameMode = 'intro';
    score = 0;
    lives = 3;
    gameOver = false;
    objects = [];
    flameParticles = [];
    cutLine = [];
    introTextState = 0;
    isDrawing = false;
    chestScratched = false;
    chestScratchedTime = 0;
    handVisible = false;
    handY = 0;
    handStartY = 0;
    handAngle = 0;
    window.replayButton = null;

    stopAllMusic(); // Arrêter toutes les musiques

    if (userInteracted) {
        playMusic(introMusic);
    }

    if (window.offscreenCanvas) {
        window.offscreenCanvas = null;
        window.offscreenCtx = null;
    }

    bubbleRect = { x: 0, y: 0, width: 0, height: 0 };
    drawGame();
    requestAnimationFrame(gameLoop);
}

//Modifier les gestionnaires de clics/touchers 
function handleCanvasClick(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;


    if (!userInteracted) {
        userInteracted = true;
    }

    // Bouton Croix
    if (x >= crossButtonPos.x && x <= crossButtonPos.x + buttonSize &&
        y >= crossButtonPos.y && y <= crossButtonPos.y + buttonSize) {
        resetToIntro(); 
        return;         
    }

    // Bouton Aide 
    if (!gameOver) { 
        if (x >= helpButtonPos.x && x <= helpButtonPos.x + buttonSize &&
            y >= helpButtonPos.y && y <= helpButtonPos.y + buttonSize) {
            showTutorialPopup();
            return;
        }
    }

    // Bouton Rejouer
    if (gameOver && window.replayButton) {
        if (x >= window.replayButton.x && x <= window.replayButton.x + window.replayButton.width &&
            y >= window.replayButton.y && y <= window.replayButton.y + window.replayButton.height) {
            resetToIntro();
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

function handleCanvasTouch(e) {
    e.preventDefault();

    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;


    if (!userInteracted) {
        userInteracted = true;
    }

    // Bouton Croix
    if (x >= crossButtonPos.x && x <= crossButtonPos.x + buttonSize &&
        y >= crossButtonPos.y && y <= crossButtonPos.y + buttonSize) {
        resetToIntro();
        return;         
    }

    // Bouton Aide
    if (!gameOver) { 
        if (x >= helpButtonPos.x && x <= helpButtonPos.x + buttonSize &&
            y >= helpButtonPos.y && y <= helpButtonPos.y + buttonSize) {
            showTutorialPopup();
            return;
        }
    }

    // Bouton Rejouer
    if (gameOver && window.replayButton) {
        if (x >= window.replayButton.x && x <= window.replayButton.x + window.replayButton.width &&
            y >= window.replayButton.y && y <= window.replayButton.y + window.replayButton.height) {
            resetToIntro();
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

//clic sur la bulle d'intro
function handleIntroClick() {
    if (userInteracted && introMusic.paused) {
        playMusic(introMusic);
    }

    introTextState++;
    if (introTextState >= introTexts.length) {
        gameMode = 'playing';
        playMusic(gameMusic);
        score = 0;
        lives = 3;
        gameOver = false;
        objects = [];
        flameParticles = [];
        cutLine = [];
        lastSpawnTime = Date.now(); 
        introTextState = 0; 
 
    }

}


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
                    stopAllMusic();
                }
            } else {
                score += 10;
                if (score >= scoreToWin && gameMode === 'playing') {
                    gameMode = 'bonus';
                    stopAllMusic(); // S'assurer que la musique du jeu est arrêtée
                    playMusic(bonusMusic);
                    objects = [];
                    flameParticles = [];
                    cutLine = [];
                    
                    if (window.offscreenCanvas) {
                        window.offscreenCanvas = null;
                        window.offscreenCtx = null;
                    }

                    resetHandAnimation();
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

let chestScratched = false;
let chestScratchedTime = 0;

function checkChestScratched() {
    if (gameMode !== 'bonus' || chestScratched || !window.offscreenCtx) return;
    
    try {
        // Vérifier si le coffre est suffisamment gratté
        const scratchedPixels = window.offscreenCtx.getImageData(0, 0, window.offscreenCanvas.width, window.offscreenCanvas.height).data;
        let transparentPixels = 0;
        let totalPixels = 0;
        
        for (let i = 0; i < scratchedPixels.length; i += 4) {
            if (scratchedPixels[i + 3] === 0) {
                transparentPixels++;
            }
            totalPixels++;
        }
        
        const scratchedPercentage = (transparentPixels / totalPixels) * 100;
        
        if (scratchedPercentage > 30) {
            chestScratched = true;
            chestScratchedTime = Date.now();
            
            // Afficher un message de félicitations
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#EFB10F';
            ctx.font = 'bold 48px "Luckiest Guy"';
            ctx.textAlign = 'center';
            ctx.fillText('Félicitations!', canvas.width / 2, canvas.height / 2 - 30);
            ctx.font = '24px Arial';
            ctx.fillText('Redirection dans 5 secondes...', canvas.width / 2, canvas.height / 2 + 30);
        }
    } catch (error) {
        console.error("Erreur lors de la vérification du coffre : ", error);
    }
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
    } else if (gameMode === 'bonus') {
        updateHandAnimation();
        checkChestScratched();
        
        if (chestScratched && Date.now() - chestScratchedTime >= 5000) {
            window.location.href = '../index.html?etape=3#map';
        }
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
        ctx.drawImage(images.introBackground, 0, 0, canvas.width, canvas.height);

        // Personnage
        const charScale = 0.9;
        const charWidth = images.characterImage.width * charScale;
        const charHeight = images.characterImage.height * charScale;
        const charX = canvas.width / 2 - charWidth / 1.8;
        const charY = canvas.height / 2 - charHeight / 2.3; 
        ctx.drawImage(images.characterImage, charX, charY, charWidth, charHeight);


        const textMaxWidth = canvas.width * 0.75;
        const textPadding = 20;
        const lineHeight = 24;
        const bubbleBottomMargin = 30;
        const bubbleBgColor = 'white';
        const bubbleBorderRadius = 10;

 
        ctx.font = '16px Arial'; 
        ctx.textAlign = 'left'; 
        ctx.textBaseline = 'top'; 

        const currentText = introTexts[introTextState];
        const layout = calculateTextLayout(ctx, currentText, textMaxWidth, lineHeight);
        const actualTextHeight = layout.height;


        const bubbleWidth = textMaxWidth + 2 * textPadding;
        const bubbleHeight = actualTextHeight + (layout.linesArray.length > 1 ? textPadding * 1.5 : textPadding * 2);
        const bubbleX = (canvas.width - bubbleWidth) / 2; 
        const bubbleY = canvas.height - bubbleHeight - bubbleBottomMargin;


        ctx.fillStyle = bubbleBgColor;
        drawRoundedRect(bubbleX, bubbleY, bubbleWidth, bubbleHeight, bubbleBorderRadius);

   
        ctx.fillStyle = 'black'; 
        const textStartX = bubbleX + textPadding; 
        let currentY = bubbleY + textPadding;   
        for (const line of layout.linesArray) {
            ctx.fillText(line, textStartX, currentY);
            currentY += lineHeight; 
        }

        bubbleRect = { x: bubbleX, y: bubbleY, width: bubbleWidth, height: bubbleHeight };

        // Dessiner les boutons
        drawButtons();
        ctx.textBaseline = 'alphabetic'; 

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

        const chestScale = 2.5;
        const chestWidth = artworkWidth * chestScale;
        const chestHeight = artworkHeight * chestScale;
        const chestX = canvas.width / 2 - chestWidth / 2;
        const chestY = canvas.height / 2 - chestHeight / 2;

   
        ctx.drawImage(images.artworkImage, artworkX, artworkY, artworkWidth, artworkHeight);

    
        if (!window.offscreenCanvas) {
            window.offscreenCanvas = document.createElement('canvas');
            window.offscreenCanvas.width = canvas.width;
            window.offscreenCanvas.height = canvas.height;
            window.offscreenCtx = window.offscreenCanvas.getContext('2d');

            window.offscreenCtx.clearRect(0, 0, window.offscreenCanvas.width, window.offscreenCanvas.height);

            window.offscreenCtx.drawImage(images.chestImage, chestX, chestY, chestWidth, chestHeight);
        }


        if (isDrawing) {
            window.offscreenCtx.globalCompositeOperation = 'destination-out';
            window.offscreenCtx.beginPath();
            window.offscreenCtx.arc(lastX, lastY, scratchRadius, 0, Math.PI * 2);
            window.offscreenCtx.fill();
            window.offscreenCtx.globalCompositeOperation = 'source-over';
        }

        ctx.drawImage(window.offscreenCanvas, 0, 0);


        if (handVisible && images.handImage.complete && images.handImage.naturalHeight !== 0) {
            const handScale = 0.5; 
            const handWidth = images.handImage.width * handScale;
            const handHeight = images.handImage.height * handScale;

            const handX = canvas.width / 2 - handWidth / 2;

            ctx.drawImage(images.handImage, handX, handY, handWidth, handHeight);
        }


        drawButtons();

    }

    if (gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Message Game Over
        ctx.fillStyle = 'red';
        ctx.font = 'bold 48px "Luckiest Guy"';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'black';
        ctx.shadowBlur = 5;
        ctx.fillText('Game Over!', canvas.width / 2, canvas.height / 2 - 50);
        
        // Bouton Rejouer
        const buttonWidth = 200;
        const buttonHeight = 50;
        const buttonX = canvas.width / 2 - buttonWidth / 2;
        const buttonY = canvas.height / 2 + 20;
        
        // Dessiner le bouton
        ctx.fillStyle = '#EFB10F';
        drawRoundedRect(buttonX, buttonY, buttonWidth, buttonHeight, 10);
        
        // Texte du bouton
        ctx.fillStyle = 'black';
        ctx.font = 'bold 24px Arial';
        ctx.fillText('Restart', canvas.width / 2, buttonY + buttonHeight / 2 + 8);
        
        // Stocker la position du bouton pour la détection de clic
        window.replayButton = {
            x: buttonX,
            y: buttonY,
            width: buttonWidth,
            height: buttonHeight
        };
        
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
    } else if (gameMode === 'bonus') {
        handVisible = false; 
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
                    stopAllMusic(); // S'assurer que la musique du jeu est arrêtée
                    playMusic(bonusMusic);
                    objects = [];
                    flameParticles = [];
                    cutLine = [];

                    if (window.offscreenCanvas) {
                        window.offscreenCanvas = null;
                        window.offscreenCtx = null;
                    }

                    resetHandAnimation();
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

    if (gameMode === 'playing' || gameMode === 'bonus') {
        update();
    }

    drawGame();


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

let handVisible = false;
let handY = 0;
let handStartY = 0;
let handAmplitude = 10;
let handSpeed = 0.05;
let handAngle = 0;

//Réinitialiser l'animation de la main
function resetHandAnimation() {
    handVisible = true;
    const chestCenterY = canvas.height / 2;
    const handHeight = images.handImage.height * 0.5; 
    handStartY = chestCenterY - handHeight / 2 - handAmplitude;
    handY = handStartY;
    handAngle = 0; 
}

//Mettre à jour l'animation de la main
function updateHandAnimation() {
    if (!handVisible) return;
    handAngle += handSpeed;
    handY = handStartY + Math.sin(handAngle) * handAmplitude;
}

startGame(); 