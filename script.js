document.addEventListener('DOMContentLoaded', () => {
    // --- Elements ---
    const memoryGameView = document.getElementById('memory-game-view');
    const keyGameView = document.getElementById('key-game-view');
    const startModal = document.getElementById('start-modal');
    const winModal = document.getElementById('win-modal');
    const winMessage = document.getElementById('win-message');
    const funnyCommentDisplay = document.getElementById('funny-comment');
    const gameSubtitle = document.getElementById('game-subtitle');
    const leaderboardTitle = document.querySelector('.leaderboard-section h2');

    // Modal Inputs
    const initialNameInput = document.getElementById('initial-name');
    const initialAptInput = document.getElementById('initial-apt');
    const startGameBtn = document.getElementById('start-game-btn');
    const gameChoiceBtns = document.querySelectorAll('.game-choice-btn');

    // Memory Game Elements
    const gameGrid = document.getElementById('game-grid');
    const timerDisplay = document.getElementById('timer');
    const moveCounterDisplay = document.getElementById('move-counter');
    const restartBtn = document.getElementById('restart-btn');

    // Key Game Elements
    const keyTimerDisplay = document.getElementById('key-timer');
    const keyCounterDisplay = document.getElementById('key-counter');
    const keyRestartBtn = document.getElementById('key-restart-btn');
    const keyCanvas = document.getElementById('key-game-canvas');
    const ctx = keyCanvas.getContext('2d');

    // Global State
    let currentPlayer = { name: '', apt: '' };
    let selectedGame = 'memory';
    let gameActive = false;
    let timerRunning = false;
    let timerInterval;
    let seconds = 0;

    // --- General Logic ---

    function resetTimer() {
        clearInterval(timerInterval);
        seconds = 0;
        updateTimerDisplay();
    }

    function startTimer(display) {
        if (timerRunning) return;
        timerRunning = true;
        clearInterval(timerInterval);
        seconds = 0;
        timerInterval = setInterval(() => {
            seconds++;
            const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
            const ss = String(seconds % 60).padStart(2, '0');
            display.textContent = `${mm}:${ss}`;
        }, 1000);
    }

    function updateTimerDisplay() {
        const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
        const ss = String(seconds % 60).padStart(2, '0');
        timerDisplay.textContent = `${mm}:${ss}`;
        keyTimerDisplay.textContent = `${mm}:${ss}`;
    }

    // --- Memory Game Logic ---
    let cards = [];
    let flippedCards = [];
    let matchedPairs = 0;
    let moves = 0;
    const residentImages = Array.from({ length: 18 }, (_, i) => `assets/residents/${i + 1}.jpg`);

    function initMemoryGame() {
        gameActive = true;
        timerRunning = false;
        gameGrid.innerHTML = '';
        flippedCards = [];
        matchedPairs = 0;
        moves = 0;
        moveCounterDisplay.textContent = '0';
        resetTimer();

        updateGridColumns();
        const cardValues = [...residentImages, ...residentImages];
        shuffle(cardValues);

        cardValues.forEach((val, index) => {
            const card = createMemoryCard(val, index);
            gameGrid.appendChild(card);
        });

        updateLeaderboard('memory');
    }

    function createMemoryCard(imageUrl, index) {
        const card = document.createElement('div');
        card.classList.add('memory-card');
        card.dataset.value = imageUrl;
        const front = document.createElement('div');
        front.classList.add('card-face', 'card-front');
        const img = document.createElement('div');
        img.classList.add('card-image');
        img.style.backgroundImage = `url('${imageUrl}')`;
        img.style.backgroundSize = 'cover';
        img.style.backgroundPosition = 'center';
        front.appendChild(img);
        const back = document.createElement('div');
        back.classList.add('card-face', 'card-back');
        const backText = document.createElement('span');
        backText.classList.add('card-back-text');
        backText.textContent = 'אומן 2';
        back.appendChild(backText);
        card.appendChild(front);
        card.appendChild(back);
        card.addEventListener('click', () => {
            if (!gameActive || flippedCards.length >= 2 || card.classList.contains('flipped')) return;
            if (seconds === 0) startTimer(timerDisplay);
            card.classList.add('flipped');
            flippedCards.push(card);
            if (flippedCards.length === 2) {
                moves++;
                moveCounterDisplay.textContent = moves;
                setTimeout(checkMemoryMatch, 800);
            }
        });
        return card;
    }

    function checkMemoryMatch() {
        const [c1, c2] = flippedCards;
        if (c1.dataset.value === c2.dataset.value) {
            c1.classList.add('matched');
            c2.classList.add('matched');
            matchedPairs++;
            if (matchedPairs === residentImages.length) endCurrentGame('memory');
        } else {
            c1.classList.remove('flipped');
            c2.classList.remove('flipped');
        }
        flippedCards = [];
    }

    function updateGridColumns() {
        const width = window.innerWidth;
        let cols = width <= 480 ? 3 : (width <= 768 ? 4 : 6);
        gameGrid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    }

    // --- "Find the Key" Game Logic (Pac-Man Style) ---
    let keyPlayer = { x: 0, y: 0, radius: 15, speed: 4 };
    let keys = [];
    let missiles = [];
    let keysCollected = 0;
    const TOTAL_KEYS = 10;
    let keyGameLoop;
    let keysPressed = {};

    function initKeyGame() {
        gameActive = true;
        timerRunning = false;
        keysCollected = 0;
        keyCounterDisplay.textContent = `0/${TOTAL_KEYS}`;
        resetTimer();

        keyCanvas.width = 400;
        keyCanvas.height = 400;

        // Initial setup
        keyPlayer.x = 200;
        keyPlayer.y = 200;
        keys = [];
        missiles = [];
        for (let i = 0; i < TOTAL_KEYS; i++) spawnKey();
        for (let i = 0; i < 3; i++) spawnMissile();

        if (keyGameLoop) cancelAnimationFrame(keyGameLoop);
        keyGameLoop = requestAnimationFrame(updateKeyGame);

        updateLeaderboard('key');
    }

    function spawnKey() {
        keys.push({
            x: Math.random() * (keyCanvas.width - 20) + 10,
            y: Math.random() * (keyCanvas.height - 20) + 10,
            radius: 10
        });
    }

    function spawnMissile() {
        missiles.push({
            x: Math.random() * keyCanvas.width,
            y: Math.random() < 0.5 ? 0 : keyCanvas.height,
            vx: (Math.random() - 0.5) * 3,
            vy: (Math.random() - 0.5) * 3,
            radius: 12
        });
    }

    function updateKeyGame() {
        if (!gameActive) return;

        // Start timer on first movement or interaction
        if (!timerRunning && (keysPressed['ArrowUp'] || keysPressed['ArrowDown'] || keysPressed['ArrowLeft'] || keysPressed['ArrowRight'])) {
            startTimer(keyTimerDisplay);
        }

        // Move Player
        if (keysPressed['ArrowUp'] && keyPlayer.y > keyPlayer.radius) keyPlayer.y -= keyPlayer.speed;
        if (keysPressed['ArrowDown'] && keyPlayer.y < keyCanvas.height - keyPlayer.radius) keyPlayer.y += keyPlayer.speed;
        if (keysPressed['ArrowLeft'] && keyPlayer.x > keyPlayer.radius) keyPlayer.x -= keyPlayer.speed;
        if (keysPressed['ArrowRight'] && keyPlayer.x < keyCanvas.width - keyPlayer.radius) keyPlayer.x += keyPlayer.speed;

        // Move Missiles
        missiles.forEach(m => {
            m.x += m.vx;
            m.y += m.vy;
            if (m.x < 0 || m.x > keyCanvas.width) m.vx *= -1;
            if (m.y < 0 || m.y > keyCanvas.height) m.vy *= -1;

            // Collision with Player
            const dx = m.x - keyPlayer.x;
            const dy = m.y - keyPlayer.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < m.radius + keyPlayer.radius) {
                gameActive = false;
                clearInterval(timerInterval);
                alert("אופס, נתקעת בממד.. תקרא לגיא (דירה 17)");
                startModal.classList.add('show');
                return;
            }
        });

        // Check Key Collection
        for (let i = keys.length - 1; i >= 0; i--) {
            const k = keys[i];
            const dx = k.x - keyPlayer.x;
            const dy = k.y - keyPlayer.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < k.radius + keyPlayer.radius) {
                keys.splice(i, 1);
                keysCollected++;
                keyCounterDisplay.textContent = `${keysCollected}/${TOTAL_KEYS}`;
                if (keysCollected === TOTAL_KEYS) {
                    endCurrentGame('key');
                    return; // Stop current frame
                }
            }
        }

        drawKeyGame();
        keyGameLoop = requestAnimationFrame(updateKeyGame);
    }

    function drawKeyGame() {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, keyCanvas.width, keyCanvas.height);

        // Draw Stars/Background effect
        ctx.fillStyle = '#222';
        for (let i = 0; i < 10; i++) ctx.fillRect(i * 40, (i * 30) % 400, 2, 2);

        // Draw Player (Small House/Square)
        ctx.font = '30px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🏃', keyPlayer.x, keyPlayer.y);

        // Draw Keys
        keys.forEach(k => {
            ctx.font = '24px Arial';
            ctx.fillText('🔑', k.x, k.y);
        });

        // Draw Missiles (Tילים חמודים)
        missiles.forEach(m => {
            ctx.font = '28px Arial';
            ctx.fillText('🚀', m.x, m.y);

            // Subtle glow for missiles
            ctx.shadowBlur = 10;
            ctx.shadowColor = "red";
        });
        ctx.shadowBlur = 0; // reset
    }

    // --- End Game Logic ---

    function endCurrentGame(type) {
        gameActive = false;
        timerRunning = false;
        clearInterval(timerInterval);

        const finalTimeStr = (type === 'memory' ? timerDisplay : keyTimerDisplay).textContent;

        let msg = `כל הכבוד ${currentPlayer.name} מדירה ${currentPlayer.apt}! `;
        let comment = "";

        if (type === 'memory') {
            msg += `סיימתם את משחק הזיכרון ב-${moves} תנועות ובזמן של ${finalTimeStr}`;
            comment = "מי וועד הבית!? צריך כאן משחק חוזר דחוף!";
        } else {
            msg += `אספתם את כל המפתחות בזמן של ${finalTimeStr}!`;
            comment = "כל הכבוד גם אתם למדתם לשמור על מפתח בממד!";
        }

        winMessage.textContent = msg;
        funnyCommentDisplay.textContent = comment;

        winModal.classList.add('show');

        // Save score and update leaderboard
        saveScore(currentPlayer.name, currentPlayer.apt, finalTimeStr, seconds, type);
    }

    // --- Leaderboard API ---

    async function saveScore(name, apt, timeStr, timeSeconds, gameType) {
        try {
            await fetch('/api/scores', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, apt, timeStr, timeSeconds, game: gameType })
            });
            updateLeaderboard(gameType);
        } catch (e) { console.error(e); }
    }

    async function updateLeaderboard(gameType) {
        try {
            // Update title to show which game we are looking at
            const title = gameType === 'memory' ? 'משחק הזיכרון' : 'מצא את המפתח';
            leaderboardTitle.textContent = `טבלת שיאים - ${title}`;

            const res = await fetch(`/api/scores?gameType=${gameType}`);
            if (!res.ok) throw new Error('Failed to fetch scores');
            const scores = await res.json();

            const leaderboardBody = document.getElementById('leaderboard-body');
            leaderboardBody.innerHTML = '';

            if (scores.length === 0) {
                leaderboardBody.innerHTML = '<tr><td colspan="3">מחכה לשיא הראשון...</td></tr>';
                return;
            }

            scores.forEach((s, i) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${i + 1}</td>
                    <td>${s.name} (דירה ${s.apt})</td>
                    <td>${s.timeStr}</td>
                `;
                leaderboardBody.appendChild(row);
            });
        } catch (e) {
            console.error('Leaderboard error:', e);
        }
    }

    // --- Event Listeners ---

    gameChoiceBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            gameChoiceBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedGame = btn.dataset.game;
        });
    });

    startGameBtn.addEventListener('click', () => {
        const name = initialNameInput.value.trim();
        const apt = initialAptInput.value.trim();
        if (!name || !apt) return alert('נא להזין שם ודירה');

        currentPlayer = { name, apt };
        startModal.classList.remove('show');

        if (selectedGame === 'memory') {
            memoryGameView.style.display = 'block';
            keyGameView.style.display = 'none';
            gameSubtitle.textContent = 'מצאו את הזוגות כמה שיותר מהר!';
            initMemoryGame();
        } else {
            memoryGameView.style.display = 'none';
            keyGameView.style.display = 'block';
            gameSubtitle.textContent = 'אספו את כל המפתחות ושימרו עליהם בממד!';
            initKeyGame();
        }
    });

    restartBtn.addEventListener('click', () => { gameActive = false; startModal.classList.add('show'); });
    keyRestartBtn.addEventListener('click', () => { gameActive = false; startModal.classList.add('show'); });
    document.getElementById('close-modal-btn').addEventListener('click', () => winModal.classList.remove('show'));

    window.addEventListener('keydown', e => keysPressed[e.key] = true);
    window.addEventListener('keyup', e => delete keysPressed[e.key]);

    // Mobile buttons
    const bindBtn = (id, key) => {
        const el = document.getElementById(id);
        el.addEventListener('touchstart', (e) => { e.preventDefault(); keysPressed[key] = true; });
        el.addEventListener('touchend', (e) => { e.preventDefault(); delete keysPressed[key]; });
        el.addEventListener('mousedown', () => { keysPressed[key] = true; });
        el.addEventListener('mouseup', () => { delete keysPressed[key]; });
    };
    bindBtn('up-btn', 'ArrowUp');
    bindBtn('down-btn', 'ArrowDown');
    bindBtn('left-btn', 'ArrowLeft');
    bindBtn('right-btn', 'ArrowRight');

    function shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
});
