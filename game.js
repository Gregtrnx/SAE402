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
    artworkImage: new Image()
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

// Vérifier que toutes les images sont chargées
Object.values(images).forEach(img => {
    img.onload = () => {
        imagesLoaded++;
        if (imagesLoaded === totalImages) {
            if (images.background.complete && images.fruit1.complete && images.bomb.complete && images.heart.complete && images.rotateGif.complete) {
                 startGame();
            } else {
                console.error("Certaines images essentielles n'ont pas pu être chargées.");
            }
        }
    };
    img.onerror = (e) => {
        console.error(`Erreur de chargement de l'image: ${img.src}`, e);
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
let gameMode = 'playing';
let objects = [];
let score = 0;
let lives = 3;
let gameOver = false;
let lastSpawnTime = 0;
const spawnInterval = 1000;
const scoreToWin = 200;
const scratchRadius = 25;

// Variables pour le suivi du mouvement
let isDrawing = false;
let lastX = 0;
let lastY = 0;
let cutLine = [];

// Variables pour les particules de flamme
let flameParticles = [];

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

function handleCanvasClick(e) {
    if (gameOver) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (x >= crossButtonPos.x && x <= crossButtonPos.x + buttonSize &&
        y >= crossButtonPos.y && y <= crossButtonPos.y + buttonSize) {
        console.log("Clic sur bouton Croix");
        return;
    }

    if (x >= helpButtonPos.x && x <= helpButtonPos.x + buttonSize &&
        y >= helpButtonPos.y && y <= helpButtonPos.y + buttonSize) {
        showTutorialPopup();
        return;
    }

    if (gameMode === 'playing') {
        checkCollision(x, y);
    }
}

function handleCanvasTouch(e) {
    e.preventDefault();
    if (gameOver) return;

    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    if (x >= crossButtonPos.x && x <= crossButtonPos.x + buttonSize &&
        y >= crossButtonPos.y && y <= crossButtonPos.y + buttonSize) {
        console.log("Toucher sur bouton Croix");
        return;
    }

    if (x >= helpButtonPos.x && x <= helpButtonPos.x + buttonSize &&
        y >= helpButtonPos.y && y <= helpButtonPos.y + buttonSize) {
        showTutorialPopup();
        return;
    }

    if (gameMode === 'playing') {
        checkCollision(x, y);
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
                }
            } else {
                score += 10;
                if (score >= scoreToWin && gameMode === 'playing') {
                    gameMode = 'bonus';
                    objects = [];
                    flameParticles = [];
                    cutLine = [];
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
    } else if (gameMode === 'bonus') {
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

    if (gameMode === 'playing') {
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

        ctx.drawImage(images.artworkImage, artworkX, artworkY, artworkWidth, artworkHeight);

        ctx.drawImage(images.chestImage, artworkX, artworkY, artworkWidth, artworkHeight);

        if (isDrawing) {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.fillStyle = 'rgba(0,0,0,1)';
            ctx.beginPath();
            ctx.arc(lastX, lastY, scratchRadius, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalCompositeOperation = 'source-over';
        }

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
    update();
    drawGame();
    if (!gameOver) {
      requestAnimationFrame(gameLoop);
    }
}

function startGame() {
    resizeCanvas();
    lastSpawnTime = Date.now();
    gameLoop();
}

function addFlameParticles(x, y) {
     if (gameMode !== 'playing') return;
    for (let i = 0; i < 5; i++) {
        flameParticles.push(new FlameParticle(x, y));
    }
}

gameLoop(); 