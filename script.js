document.addEventListener('DOMContentLoaded', () => {
    // --- Elements ---
    const memoryGameView = document.getElementById('memory-game-view');
    const keyGameView = document.getElementById('key-game-view');
    const puzzleGameView = document.getElementById('puzzle-game-view');
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

    // Puzzle Game Elements
    const puzzleGrid = document.getElementById('puzzle-grid');
    const puzzleTimerDisplay = document.getElementById('puzzle-timer');
    const puzzleMovesDisplay = document.getElementById('puzzle-moves');
    const puzzleRestartBtn = document.getElementById('puzzle-restart-btn');
    const puzzleHintBtn = document.getElementById('puzzle-hint-btn');
    const puzzlePreview = document.getElementById('puzzle-preview');

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
        const str = `${mm}:${ss}`;
        if (timerDisplay) timerDisplay.textContent = str;
        if (keyTimerDisplay) keyTimerDisplay.textContent = str;
        if (puzzleTimerDisplay) puzzleTimerDisplay.textContent = str;
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
            if (!timerRunning) startTimer(timerDisplay);
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

    // --- "Find the Key" Game Logic ---
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

        if (!timerRunning && (keysPressed['ArrowUp'] || keysPressed['ArrowDown'] || keysPressed['ArrowLeft'] || keysPressed['ArrowRight'])) {
            startTimer(keyTimerDisplay);
        }

        if (keysPressed['ArrowUp'] && keyPlayer.y > keyPlayer.radius) keyPlayer.y -= keyPlayer.speed;
        if (keysPressed['ArrowDown'] && keyPlayer.y < keyCanvas.height - keyPlayer.radius) keyPlayer.y += keyPlayer.speed;
        if (keysPressed['ArrowLeft'] && keyPlayer.x > keyPlayer.radius) keyPlayer.x -= keyPlayer.speed;
        if (keysPressed['ArrowRight'] && keyPlayer.x < keyCanvas.width - keyPlayer.radius) keyPlayer.x += keyPlayer.speed;

        missiles.forEach(m => {
            m.x += m.vx;
            m.y += m.vy;
            if (m.x < 0 || m.x > keyCanvas.width) m.vx *= -1;
            if (m.y < 0 || m.y > keyCanvas.height) m.vy *= -1;

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
                    return;
                }
            }
        }

        drawKeyGame();
        keyGameLoop = requestAnimationFrame(updateKeyGame);
    }

    function drawKeyGame() {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, keyCanvas.width, keyCanvas.height);
        ctx.fillStyle = '#222';
        for (let i = 0; i < 10; i++) ctx.fillRect(i * 40, (i * 30) % 400, 2, 2);
        ctx.font = '30px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🏃', keyPlayer.x, keyPlayer.y);
        keys.forEach(k => {
            ctx.font = '24px Arial';
            ctx.fillText('🔑', k.x, k.y);
        });
        missiles.forEach(m => {
            ctx.font = '28px Arial';
            ctx.fillText('🚀', m.x, m.y);
            ctx.shadowBlur = 10;
            ctx.shadowColor = "red";
        });
        ctx.shadowBlur = 0;
    }

    // --- Sliding Puzzle Logic ---
    let puzzleTiles = [];
    let puzzleMoves = 0;
    let puzzleImage = '';
    const PUZZLE_SIZE = 3;

    function initPuzzleGame() {
        gameActive = true;
        timerRunning = false;
        puzzleMoves = 0;
        puzzleMovesDisplay.textContent = '0';
        resetTimer();

        // Pick random resident image
        puzzleImage = residentImages[Math.floor(Math.random() * residentImages.length)];
        puzzlePreview.style.backgroundImage = `url('${puzzleImage}')`;

        // Initialize tiles in solved state
        puzzleTiles = Array.from({ length: PUZZLE_SIZE * PUZZLE_SIZE }, (_, i) => i);

        // Shuffle by making random valid moves from solved state
        shufflePuzzleSolvable();
        renderPuzzle();
        updateLeaderboard('puzzle');
    }

    function shufflePuzzleSolvable() {
        // Start from solved state
        let emptyPos = PUZZLE_SIZE * PUZZLE_SIZE - 1;
        for (let i = 0; i < 200; i++) {
            const neighbors = getNeighbors(emptyPos);
            const move = neighbors[Math.floor(Math.random() * neighbors.length)];
            [puzzleTiles[emptyPos], puzzleTiles[move]] = [puzzleTiles[move], puzzleTiles[emptyPos]];
            emptyPos = move;
        }
    }

    function getNeighbors(pos) {
        const neighbors = [];
        const r = Math.floor(pos / PUZZLE_SIZE);
        const c = pos % PUZZLE_SIZE;
        if (r > 0) neighbors.push(pos - PUZZLE_SIZE);
        if (r < PUZZLE_SIZE - 1) neighbors.push(pos + PUZZLE_SIZE);
        if (c > 0) neighbors.push(pos - 1);
        if (c < PUZZLE_SIZE - 1) neighbors.push(pos + 1);
        return neighbors;
    }

    function renderPuzzle() {
        puzzleGrid.innerHTML = '';
        puzzleTiles.forEach((tileValue, index) => {
            const tile = document.createElement('div');
            tile.classList.add('puzzle-tile');

            if (tileValue === PUZZLE_SIZE * PUZZLE_SIZE - 1) {
                tile.classList.add('empty');
            } else {
                tile.style.backgroundImage = `url('${puzzleImage}')`;
                const r = Math.floor(tileValue / PUZZLE_SIZE);
                const c = tileValue % PUZZLE_SIZE;
                // Calculate background position based on 300% size (3x3)
                tile.style.backgroundPosition = `${(c / (PUZZLE_SIZE - 1)) * 100}% ${(r / (PUZZLE_SIZE - 1)) * 100}%`;
                tile.addEventListener('click', () => movePuzzleTile(index));
            }
            puzzleGrid.appendChild(tile);
        });
    }

    function movePuzzleTile(index) {
        if (!gameActive) return;
        const emptyPos = puzzleTiles.indexOf(PUZZLE_SIZE * PUZZLE_SIZE - 1);
        const neighbors = getNeighbors(index);

        if (neighbors.includes(emptyPos)) {
            if (!timerRunning) startTimer(puzzleTimerDisplay);
            [puzzleTiles[index], puzzleTiles[emptyPos]] = [puzzleTiles[emptyPos], puzzleTiles[index]];
            puzzleMoves++;
            puzzleMovesDisplay.textContent = puzzleMoves;
            renderPuzzle();
            checkPuzzleWin();
        }
    }

    function checkPuzzleWin() {
        const isWin = puzzleTiles.every((val, i) => val === i);
        if (isWin) {
            endCurrentGame('puzzle');
        }
    }

    // --- End Game Logic ---

    function endCurrentGame(type) {
        gameActive = false;
        timerRunning = false;
        clearInterval(timerInterval);

        let display = timerDisplay;
        if (type === 'key') display = keyTimerDisplay;
        if (type === 'puzzle') display = puzzleTimerDisplay;

        const finalTimeStr = display.textContent;

        let msg = `כל הכבוד ${currentPlayer.name} מדירה ${currentPlayer.apt}! `;
        let comment = "";

        if (type === 'memory') {
            msg += `סיימתם את משחק הזיכרון ב-${moves} תנועות ובזמן של ${finalTimeStr}`;
            comment = "מי וועד הבית!? צריך כאן משחק חוזר דחוף!";
        } else if (type === 'key') {
            msg += `אספתם את כל המפתחות בזמן של ${finalTimeStr}!`;
            comment = "כל הכבוד גם אתם למדתם לשמור על מפתח בממד!";
        } else if (type === 'puzzle') {
            msg += `פתרתם את הפאזל ב-${puzzleMoves} תנועות ובזמן של ${finalTimeStr}!`;
            comment = "כל הכבוד דייר/ת למופת, אין ספק שאתה משקיע בבניין! רוצה משחק חדש או אחר?";
        }

        winMessage.textContent = msg;
        funnyCommentDisplay.textContent = comment;
        winModal.classList.add('show');

        // Save score and update leaderboard with moves count included in the time string
        let scoreReport = finalTimeStr;
        if (type === 'puzzle') scoreReport = `${finalTimeStr} (${puzzleMoves} תנועות)`;
        if (type === 'memory') scoreReport = `${finalTimeStr} (${moves} תנועות)`;

        saveScore(currentPlayer.name, currentPlayer.apt, scoreReport, seconds, type);
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
            const title = gameType === 'memory' ? 'משחק הזיכרון' : (gameType === 'key' ? 'מצא את המפתח' : 'פאזל הזזה');
            leaderboardTitle.textContent = `טבלת שיאים - ${title}`;

            // Add a timestamp to prevent caching
            const res = await fetch(`/api/scores?gameType=${gameType}&t=${Date.now()}`);
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
                row.innerHTML = `<td>${i + 1}</td><td>${s.name} (דירה ${s.apt})</td><td>${s.timeStr}</td>`;
                leaderboardBody.appendChild(row);
            });
        } catch (e) { console.error('Leaderboard error:', e); }
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

        memoryGameView.style.display = 'none';
        keyGameView.style.display = 'none';
        puzzleGameView.style.display = 'none';

        if (selectedGame === 'memory') {
            memoryGameView.style.display = 'block';
            gameSubtitle.textContent = 'מצאו את הזוגות כמה שיותר מהר!';
            initMemoryGame();
        } else if (selectedGame === 'key') {
            keyGameView.style.display = 'block';
            gameSubtitle.textContent = 'אספו את כל המפתחות ושימרו עליהם בממד!';
            initKeyGame();
        } else if (selectedGame === 'puzzle') {
            puzzleGameView.style.display = 'block';
            gameSubtitle.textContent = 'החליקו את החלקים וסדרו את התמונה!';
            initPuzzleGame();
        }
    });

    restartBtn.addEventListener('click', () => { gameActive = false; startModal.classList.add('show'); });
    keyRestartBtn.addEventListener('click', () => { gameActive = false; startModal.classList.add('show'); });
    puzzleRestartBtn.addEventListener('click', () => { gameActive = false; startModal.classList.add('show'); });

    puzzleHintBtn.addEventListener('mousedown', () => puzzlePreview.classList.add('show'));
    puzzleHintBtn.addEventListener('mouseup', () => puzzlePreview.classList.remove('show'));
    puzzleHintBtn.addEventListener('touchstart', (e) => { e.preventDefault(); puzzlePreview.classList.add('show'); });
    puzzleHintBtn.addEventListener('touchend', (e) => { e.preventDefault(); puzzlePreview.classList.remove('show'); });

    document.getElementById('close-modal-btn').addEventListener('click', () => winModal.classList.remove('show'));

    window.addEventListener('keydown', e => keysPressed[e.key] = true);
    window.addEventListener('keyup', e => delete keysPressed[e.key]);

    const bindBtn = (id, key) => {
        const el = document.getElementById(id);
        if (!el) return;
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
