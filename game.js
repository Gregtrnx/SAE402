const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Ajuster la taille du canvas pour qu'il soit responsive
function resizeCanvas() {
    canvas.width = window.innerWidth * 0.8;
    canvas.height = window.innerHeight * 0.8;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Classe pour les objets du jeu
class GameObject {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.radius = 20;
        
        // Ajustement des vitesses initiales
        this.speedY = -12; // Vitesse initiale verticale
        this.speedX = (Math.random() - 0.5) * 4; // Légère variation horizontale
        
        this.gravity = 0.5; // Gravité réduite
        this.initialY = y; // Stocker la position initiale pour la formule de gravité
        this.initialSpeedY = this.speedY; // Stocker la vitesse initiale
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.2;
        this.color = type === 'bomb' ? 'red' : 
                     type === 'fruit1' ? 'blue' :
                     type === 'fruit2' ? 'yellow' : 'green';
        this.spawnTime = Date.now(); // Ajouter le temps de spawn
    }

    update() {
        // Formule de gravité: y = y0 + v0*t + (1/2)*g*t^2
        // où t est le temps écoulé depuis le spawn
        const timeElapsed = (Date.now() - this.spawnTime) / 1000; // en secondes
        this.y = this.initialY + this.initialSpeedY * timeElapsed + 0.5 * this.gravity * timeElapsed * timeElapsed;
        
        // Mise à jour de la vitesse verticale
        this.speedY = this.initialSpeedY + this.gravity * timeElapsed;
        
        // Mise à jour de la position horizontale
        this.x += this.speedX;
        
        // Rotation
        this.rotation += this.rotationSpeed;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        ctx.beginPath();
        if (this.type === 'bomb') {
            // Dessiner une bombe (cercle)
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        } else {
            // Dessiner un fruit (triangle)
            ctx.moveTo(0, -this.radius);
            ctx.lineTo(this.radius, this.radius);
            ctx.lineTo(-this.radius, this.radius);
            ctx.closePath();
        }
        
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.restore();
    }

    isOffScreen() {
        return this.y > canvas.height + this.radius || 
               this.x < -this.radius || 
               this.x > canvas.width + this.radius;
    }
}

// Variables du jeu
let objects = [];
let score = 0;
let gameOver = false;
let lastSpawnTime = 0;
const spawnInterval = 1000; // Intervalle de spawn en millisecondes

// Gestionnaire d'événements pour le clic/toucher
canvas.addEventListener('click', handleClick);
canvas.addEventListener('touchstart', handleTouch);

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
                gameOver = true;
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
    newObject.spawnTime = Date.now(); // Ajouter le temps de spawn
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

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    objects.forEach(obj => obj.draw());
    
    // Afficher le score
    ctx.fillStyle = 'black';
    ctx.font = '24px Arial';
    ctx.fillText(`Score: ${score}`, 10, 30);
    
    if (gameOver) {
        ctx.fillStyle = 'red';
        ctx.font = '48px Arial';
        ctx.fillText('Game Over!', canvas.width/2 - 100, canvas.height/2);
    }
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop(); 