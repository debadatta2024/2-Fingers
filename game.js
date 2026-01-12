const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreElement = document.getElementById("scoreLabel");
const menuOverlay = document.getElementById("menuOverlay");
const aboutOverlay = document.getElementById("aboutOverlay");
const nameOverlay = document.getElementById("nameOverlay");
const startBtn = document.getElementById("startBtn");
const continueBtn = document.getElementById("continueBtn");
const submitNameBtn = document.getElementById("submitNameBtn");
const playerNameInput = document.getElementById("playerNameInput");
const leaderboardList = document.getElementById("leaderboardList");

// 1. IMAGE LOADING LOGIC
let imagesLoaded = 0;
const totalImages = 4;

function imageLoaded() {
    imagesLoaded++;
    if (imagesLoaded === totalImages) {
        console.log("All images ready!");
    }
}

const imgCarLeft = new Image();
imgCarLeft.onload = imageLoaded;
imgCarLeft.onerror = () => console.error("Failed to load car1.png");
imgCarLeft.src = 'car1.png';

const imgCarRight = new Image();
imgCarRight.onload = imageLoaded;
imgCarRight.onerror = () => console.error("Failed to load car2.png");
imgCarRight.src = 'car2.png';

const imgGood = new Image();
imgGood.onload = imageLoaded;
imgGood.onerror = () => console.error("Failed to load good.jpg");
imgGood.src = 'good.png';

const imgBad = new Image();
imgBad.onload = imageLoaded;
imgBad.onerror = () => console.error("Failed to load bad.jpeg");
imgBad.src = 'bad.png';

// State
let score = 0;
let gameActive = false;
let isPaused = false;
let gameSpeed = 5;
let roadOffset = 0;
let obstacles = [];
let playerName = "Player";

// Align bottoms at y=600
// Left Car Height: 88 -> y = 600 - 88 = 512
// Right Car Height: 100 -> y = 600 - 100 = 500
let leftCar = { lane: 0, x: 50, y: 512 };
let rightCar = { lane: 2, x: 250, y: 500 };

// Flow: About -> Name -> Menu -> Game
continueBtn.addEventListener("click", () => {
    aboutOverlay.style.display = "none";
    nameOverlay.style.display = "block";
});

submitNameBtn.addEventListener("click", () => {
    const name = playerNameInput.value.trim();
    if (name) {
        playerName = name;
        nameOverlay.style.display = "none";
        menuOverlay.style.display = "block";
        updateLeaderboardDisplay();
    } else {
        alert("Please enter your name!");
    }
});

startBtn.addEventListener("click", () => {
    if (imagesLoaded < totalImages) {
        alert("Images are still loading... please wait a second!");
        return;
    }
    resetGame();
    gameActive = true;
    menuOverlay.style.display = "none";
});

function resetGame() {
    score = 0;
    gameSpeed = 5;
    obstacles = [];
    scoreElement.innerText = "Score: 0";
}

window.addEventListener("keydown", (e) => {
    const key = e.key.toLowerCase();
    if (key === "p" && gameActive) isPaused = !isPaused;
    if (!gameActive || isPaused) return;
    if (key === "a") leftCar.lane = leftCar.lane === 0 ? 1 : 0;
    if (key === "d") rightCar.lane = rightCar.lane === 2 ? 3 : 2;
});

// Touch Controls
window.addEventListener("touchstart", (e) => {
    if (!gameActive || isPaused) return;
    const touchX = e.touches[0].clientX;
    const screenWidth = window.innerWidth;

    if (touchX < screenWidth / 2) {
        // Left side tap -> Toggle Left Car
        leftCar.lane = leftCar.lane === 0 ? 1 : 0;
    } else {
        // Right side tap -> Toggle Right Car
        rightCar.lane = rightCar.lane === 2 ? 3 : 2;
    }
}, { passive: false });

function update() {
    if (!gameActive || isPaused) return;

    // SCROLLING LOGIC
    roadOffset += gameSpeed;
    if (roadOffset >= 40) roadOffset = 0; // Reset offset to create loop

    leftCar.x = (leftCar.lane * 100) + 50;
    rightCar.x = (rightCar.lane * 100) + 50;

    for (let i = obstacles.length - 1; i >= 0; i--) {
        let obs = obstacles[i];
        obs.y += gameSpeed;

        let car = (obs.lane < 2) ? leftCar : rightCar;

        // Collision logic
        if (obs.y > car.y - 50 && obs.y < car.y + 50 && obs.lane === car.lane) {
            if (obs.type === "good") {
                score++;
                scoreElement.innerText = "Score: " + score;
                gameSpeed += 0.05;
                obstacles.splice(i, 1);
            } else {
                gameOver("Wrong Face!");
            }
        }

        if (obs.y > 600) {
            if (obs.type === "good") gameOver("Missed a Friend!");
            obstacles.splice(i, 1);
        }
    }
}

// Spawner
setInterval(() => {
    if (gameActive && !isPaused) {
        let lane = Math.floor(Math.random() * 4);
        let type = Math.random() > 0.5 ? "good" : "bad";
        obstacles.push({ x: lane * 100 + 50, y: -60, lane: lane, type: type });
    }
}, 1200);

function gameOver(reason) {
    gameActive = false;
    saveScore(score);
    document.getElementById("menuTitle").innerText = "GAME OVER";
    document.getElementById("menuScore").innerText = reason + " | Final Score: " + score;
    menuOverlay.style.display = "block";
    updateLeaderboardDisplay();
}

// Leaderboard Logic
function getLeaderboard() {
    const stored = localStorage.getItem('2cars_leaderboard');
    return stored ? JSON.parse(stored) : [];
}

function saveScore(newScore) {
    let leaderboard = getLeaderboard();
    leaderboard.push({ name: playerName, score: newScore });
    leaderboard.sort((a, b) => b.score - a.score);
    leaderboard = leaderboard.slice(0, 5); // Keep top 5
    localStorage.setItem('2cars_leaderboard', JSON.stringify(leaderboard));
}

function updateLeaderboardDisplay() {
    const leaderboard = getLeaderboard();
    leaderboardList.innerHTML = "";

    if (leaderboard.length === 0) {
        leaderboardList.innerHTML = "<li>No scores yet!</li>";
        return;
    }

    leaderboard.forEach((entry, index) => {
        const li = document.createElement("li");
        li.innerHTML = `<span>${index + 1}. ${entry.name}</span> <span>${entry.score}</span>`;
        leaderboardList.appendChild(li);
    });
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // DRAW SCROLLING ROAD LINES
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.setLineDash([20, 20]);
    for (let i = 1; i < 4; i++) {
        ctx.beginPath();
        // The roadOffset makes the dashes move
        ctx.moveTo(i * 100, roadOffset - 40);
        ctx.lineTo(i * 100, 600 + roadOffset);
        ctx.stroke();
    }
    ctx.setLineDash([]);

    // DRAW FACES
    if (imagesLoaded === totalImages) {
        ctx.drawImage(imgCarLeft, leftCar.x - 40, leftCar.y, 80, 88);
        ctx.drawImage(imgCarRight, rightCar.x - 57, rightCar.y, 115, 100);

        obstacles.forEach(obs => {
            if (obs.type === "good") {
                ctx.drawImage(imgGood, obs.x - 35, obs.y, 70, 70);
            } else {
                // Bad image slightly larger (85x85)
                ctx.drawImage(imgBad, obs.x - 42.5, obs.y, 85, 85);
            }
        });
    } else {
        // Loading text if images aren't ready
        ctx.fillStyle = "white";
        ctx.fillText("Loading Assets...", 150, 300);
    }

    requestAnimationFrame(draw);
    update();
}

// Initial Load
updateLeaderboardDisplay();
draw();