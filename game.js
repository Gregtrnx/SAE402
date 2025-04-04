const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Images
const images = {
    fruit1: new Image(),
    fruit2: new Image(),
    fruit3: new Image(),
    bomb: new Image(),
    background: new Image(),
    rotateGif: new Image()
};

// Chargement des images
images.fruit1.src = 'images/fruit1.png';
images.fruit2.src = 'images/fruit2.png';
images.fruit3.src = 'images/fruit3.png';
images.bomb.src = 'images/bomb.png';
images.background.src = 'images/background.png';
images.rotateGif.src = 'images/rotate.gif';

// Variable pour suivre le chargement des images
let imagesLoaded = 0;
const totalImages = Object.keys(images).length;

// Vérifier que toutes les images sont chargées
Object.values(images).forEach(img => {
    img.onload = () => {
        imagesLoaded++;
        if (imagesLoaded === totalImages) {
            startGame();
        }
    };
    img.onerror = () => {
        console.error(`Erreur de chargement de l'image: ${img.src}`);
    };
});

// Ajuster la taille du canvas pour qu'il soit responsive
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Détection de l'orientation
let isLandscape = window.innerWidth > window.innerHeight;
window.addEventListener('resize', () => {
    isLandscape = window.innerWidth > window.innerHeight;
});

// Classe pour les objets du jeu
class GameObject {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.radius = 30; // Taille augmentée
        
        // Ajustement des vitesses initiales
        this.speedY = -5; // Vitesse initiale verticale
        this.speedX = (Math.random() - 0.5) * 2; // Variation horizontale réduite
        
        this.gravity = 0.02; // Gravité réduite pour une descente plus lente
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.2;
        this.color = type === 'bomb' ? 'red' : 
                     type === 'fruit1' ? 'blue' :
                     type === 'fruit2' ? 'yellow' : 'green';
    }

    update() {
        // Physique simplifiée
        this.speedY += this.gravity;
        this.y += this.speedY;
        this.x += this.speedX;
        this.rotation += this.rotationSpeed;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        // Dessiner l'image correspondante
        const img = this.type === 'bomb' ? images.bomb :
                   this.type === 'fruit1' ? images.fruit1 :
                   this.type === 'fruit2' ? images.fruit2 : images.fruit3;
        
        // Ajuster la taille de l'image
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
let objects = [];
let score = 0;
let lives = 3; // Ajout des vies
let gameOver = false;
let lastSpawnTime = 0;
const spawnInterval = 1000; // Intervalle de spawn en millisecondes

// Variables pour le suivi du mouvement
let isDrawing = false;
let lastX = 0;
let lastY = 0;
let cutLine = [];

// Variables pour les particules de flamme
let flameParticles = [];

// Gestionnaire d'événements pour le clic/toucher
canvas.addEventListener('click', handleClick);
canvas.addEventListener('touchstart', handleTouch);

// Gestionnaire d'événements pour le mouvement continu
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);

canvas.addEventListener('touchstart', handleTouchStart);
canvas.addEventListener('touchmove', handleTouchMove);
canvas.addEventListener('touchend', stopDrawing);

function handleClick(e) {
    if (gameOver) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    checkCollision(x, y);
}

function handleTouch(e) {
    e.preventDefault();
    if (gameOver) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const y = e.touches[0].clientY - rect.top;
    checkCollision(x, y);
}

function checkCollision(x, y) {
    for (let i = objects.length - 1; i >= 0; i--) {
        const obj = objects[i];
        const distance = Math.sqrt(
            Math.pow(x - obj.x, 2) + Math.pow(y - obj.y, 2)
        );
        
        if (distance < obj.radius) {
            if (obj.type === 'bomb') {
                lives--; // Perdre une vie quand on coupe une bombe
                if (lives <= 0) {
                    gameOver = true;
                }
            } else {
                score += 10;
            }
            objects.splice(i, 1);
        }
    }
}

function spawnObject() {
    // Spawn uniquement depuis le bas
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

    const currentTime = Date.now();
    if (currentTime - lastSpawnTime > spawnInterval) {
        spawnObject();
        lastSpawnTime = currentTime;
    }

    objects = objects.filter(obj => !obj.isOffScreen());
    objects.forEach(obj => obj.update());
}

function draw(e) {
    if (!isDrawing) return;
    
    const pos = getMousePos(e);
    cutLine.push({x: pos.x, y: pos.y});
    
    // Ajouter des particules de flamme
    addFlameParticles(pos.x, pos.y);
    
    // Vérifier les collisions avec la ligne de coupe
    checkLineCollision(lastX, lastY, pos.x, pos.y);
    
    lastX = pos.x;
    lastY = pos.y;
}

function drawGame() {
    // Vérifier l'orientation
    if (isLandscape) {
        // Afficher le message de rotation
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Dessiner le gif de rotation
        const gifSize = Math.min(canvas.width, canvas.height) * 0.3;
        ctx.drawImage(images.rotateGif, 
            canvas.width/2 - gifSize/2, 
            canvas.height/2 - gifSize/2, 
            gifSize, gifSize);
        
        // Afficher le message
        ctx.fillStyle = 'white';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Veuillez tourner votre téléphone', canvas.width/2, canvas.height/2 + gifSize/2 + 30);
        return;
    }
    
    // Dessiner le background
    ctx.drawImage(images.background, 0, 0, canvas.width, canvas.height);
    
    objects.forEach(obj => obj.draw());
    
    // Mettre à jour et dessiner les particules de flamme
    flameParticles = flameParticles.filter(particle => {
        particle.update();
        particle.draw();
        return particle.life > 0;
    });
    
    // Dessiner la ligne de coupe si on est en train de dessiner
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
    
    // Afficher le score et les vies
    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score}`, 10, 30);
    ctx.fillText(`Vies: ${lives}`, 10, 60);
    
    if (gameOver) {
        ctx.fillStyle = 'red';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over!', canvas.width/2, canvas.height/2);
    }
}

function startDrawing(e) {
    if (gameOver) return;
    isDrawing = true;
    const pos = getMousePos(e);
    lastX = pos.x;
    lastY = pos.y;
    cutLine = [{x: lastX, y: lastY}];
}

function stopDrawing() {
    isDrawing = false;
    cutLine = [];
    flameParticles = [];
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
    for (let i = objects.length - 1; i >= 0; i--) {
        const obj = objects[i];
        if (lineCircleCollision(x1, y1, x2, y2, obj.x, obj.y, obj.radius)) {
            if (obj.type === 'bomb') {
                lives--; // Perdre une vie quand on coupe une bombe
                if (lives <= 0) {
                    gameOver = true;
                }
            } else {
                score += 10;
            }
            objects.splice(i, 1);
        }
    }
}

function lineCircleCollision(x1, y1, x2, y2, cx, cy, r) {
    // Vecteur de la ligne
    const dx = x2 - x1;
    const dy = y2 - y1;
    
    // Vecteur du point au début de la ligne
    const fx = x1 - cx;
    const fy = y1 - cy;
    
    // Calcul de la distance minimale
    const a = dx * dx + dy * dy;
    const b = 2 * (fx * dx + fy * dy);
    const c = fx * fx + fy * fy - r * r;
    
    const discriminant = b * b - 4 * a * c;
    
    if (discriminant < 0) return false;
    
    const t1 = (-b - Math.sqrt(discriminant)) / (2 * a);
    const t2 = (-b + Math.sqrt(discriminant)) / (2 * a);
    
    return (t1 >= 0 && t1 <= 1) || (t2 >= 0 && t2 <= 1);
}

function gameLoop() {
    update();
    drawGame();
    requestAnimationFrame(gameLoop);
}

// Fonction pour démarrer le jeu une fois les images chargées
function startGame() {
    gameLoop();
}

// Fonction pour ajouter des particules de flamme
function addFlameParticles(x, y) {
    for (let i = 0; i < 5; i++) {
        flameParticles.push(new FlameParticle(x, y));
    }
}

gameLoop(); 