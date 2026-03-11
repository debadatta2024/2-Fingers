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

let imagesLoaded = 0;
const totalImages = 4;

function imageLoaded() {
    imagesLoaded++;
}

const imgCarLeft = new Image();
imgCarLeft.onload = imageLoaded;
imgCarLeft.src = "car1.png";

const imgCarRight = new Image();
imgCarRight.onload = imageLoaded;
imgCarRight.src = "car2.png";

const imgCoin = new Image();
imgCoin.onload = imageLoaded;
imgCoin.src = "coin.png";

const imgObstacle = new Image();
imgObstacle.onload = imageLoaded;
imgObstacle.src = "obstacle.png";

let score = 0;
let gameActive = false;
let isPaused = false;
let gameSpeed = 5;
let roadOffset = 0;
let obstacles = [];
let playerName = "Player";

let leftCar = { lane: 0, x: 50, y: 512 };
let rightCar = { lane: 2, x: 250, y: 500 };

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
        alert("Images loading...");
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

    if (!gameActive && (key === "r" || key === "enter")) {
        startBtn.click();
        return;
    }

    if (key === "p" && gameActive) isPaused = !isPaused;

    if (!gameActive || isPaused) return;

    if (key === "a" || key === "arrowleft") {
        leftCar.lane = leftCar.lane === 0 ? 1 : 0;
    }

    if (key === "d" || key === "arrowright") {
        rightCar.lane = rightCar.lane === 2 ? 3 : 2;
    }
});

window.addEventListener("touchstart", (e) => {

    if (!gameActive || isPaused) return;

    const touchX = e.touches[0].clientX;
    const screenWidth = window.innerWidth;

    if (touchX < screenWidth / 2) {
        leftCar.lane = leftCar.lane === 0 ? 1 : 0;
    } else {
        rightCar.lane = rightCar.lane === 2 ? 3 : 2;
    }

}, { passive: false });

function update() {

    if (!gameActive || isPaused) return;

    roadOffset += gameSpeed;

    if (roadOffset >= 40) roadOffset = 0;

    leftCar.x = (leftCar.lane * 100) + 50;
    rightCar.x = (rightCar.lane * 100) + 50;

    for (let i = obstacles.length - 1; i >= 0; i--) {

        let obs = obstacles[i];
        obs.y += gameSpeed;

        let car = (obs.lane < 2) ? leftCar : rightCar;

        if (obs.y > car.y - 50 && obs.y < car.y + 50 && obs.lane === car.lane) {

            if (obs.type === "coin") {

                score++;
                scoreElement.innerText = "Score: " + score;
                gameSpeed += 0.05;

                obstacles.splice(i, 1);

            } else {

                gameOver("Hit Obstacle!");

            }
        }

        if (obs.y > 600) {

            if (obs.type === "coin") gameOver("Missed Coin!");

            obstacles.splice(i, 1);
        }
    }
}

setInterval(() => {

    if (gameActive && !isPaused) {

        let lane = Math.floor(Math.random() * 4);
        let type = Math.random() > 0.5 ? "coin" : "obstacle";

        obstacles.push({
            x: lane * 100 + 50,
            y: -60,
            lane: lane,
            type: type
        });
    }

}, 1200);

function gameOver(reason) {

    gameActive = false;

    saveScore(score);

    document.getElementById("menuTitle").innerText = "GAME OVER";
    document.getElementById("menuScore").innerText =
        reason + " | Final Score: " + score;

    menuOverlay.style.display = "block";

    updateLeaderboardDisplay();
}

function getLeaderboard() {

    const stored = localStorage.getItem("2cars_leaderboard");

    return stored ? JSON.parse(stored) : [];
}

function saveScore(newScore) {

    let leaderboard = getLeaderboard();

    leaderboard.push({
        name: playerName,
        score: newScore
    });

    leaderboard.sort((a, b) => b.score - a.score);

    leaderboard = leaderboard.slice(0, 5);

    localStorage.setItem(
        "2cars_leaderboard",
        JSON.stringify(leaderboard)
    );
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

        li.innerHTML =
            `<span>${index + 1}. ${entry.name}</span> <span>${entry.score}</span>`;

        leaderboardList.appendChild(li);
    });
}

function draw() {

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.setLineDash([20, 20]);

    for (let i = 1; i < 4; i++) {

        ctx.beginPath();
        ctx.moveTo(i * 100, roadOffset - 40);
        ctx.lineTo(i * 100, 600 + roadOffset);
        ctx.stroke();
    }

    ctx.setLineDash([]);

    ctx.drawImage(imgCarLeft, leftCar.x - 40, leftCar.y, 80, 88);
    ctx.drawImage(imgCarRight, rightCar.x - 57, rightCar.y, 115, 100);

    obstacles.forEach(obs => {

        if (obs.type === "coin") {

            ctx.drawImage(imgCoin, obs.x - 35, obs.y, 70, 70);

        } else {

            ctx.drawImage(imgObstacle, obs.x - 40, obs.y, 80, 80);
        }
    });

    requestAnimationFrame(draw);

    update();
}

updateLeaderboardDisplay();
draw();