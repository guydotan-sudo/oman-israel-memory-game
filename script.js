document.addEventListener('DOMContentLoaded', () => {
    // --- Elements ---
    const memoryGameView = document.getElementById('memory-game-view');
    const keyGameView = document.getElementById('key-game-view');
    const puzzleGameView = document.getElementById('puzzle-game-view');
    const snakesGameView = document.getElementById('snakes-game-view');
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

    // Snakes and Ladders Elements
    const snakesBoard = document.getElementById('snakes-board');
    const diceResult = document.getElementById('dice-result');
    const rollDiceBtn = document.getElementById('roll-dice-btn');
    const snakesTimerDisplay = document.getElementById('snakes-timer');
    const snakesMovesDisplay = document.getElementById('snakes-moves');
    const snakesRestartBtn = document.getElementById('snakes-restart-btn');

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
        if (snakesTimerDisplay) snakesTimerDisplay.textContent = str;
    }

    // --- Memory Game Logic ---
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

    // --- Key Game (Pac-Man) Logic ---
    let keyPlayer = { x: 0, y: 0, radius: 15, speed: 4 };
    let keysPositions = [];
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
        keysPositions = [];
        missiles = [];
        for (let i = 0; i < TOTAL_KEYS; i++) spawnKey();
        for (let i = 0; i < 3; i++) spawnMissile();

        if (keyGameLoop) cancelAnimationFrame(keyGameLoop);
        keyGameLoop = requestAnimationFrame(updateKeyGame);

        updateLeaderboard('key');
    }

    function spawnKey() {
        keysPositions.push({
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
            m.x += m.vx; m.y += m.vy;
            if (m.x < 0 || m.x > keyCanvas.width) m.vx *= -1;
            if (m.y < 0 || m.y > keyCanvas.height) m.vy *= -1;

            const dx = m.x - keyPlayer.x, dy = m.y - keyPlayer.y;
            if (Math.sqrt(dx * dx + dy * dy) < m.radius + keyPlayer.radius) {
                gameActive = false;
                clearInterval(timerInterval);
                alert("אופס, נתקעת בממד.. תקרא לגיא (דירה 17)");
                startModal.classList.add('show');
            }
        });

        for (let i = keysPositions.length - 1; i >= 0; i--) {
            const k = keysPositions[i];
            const dx = k.x - keyPlayer.x, dy = k.y - keyPlayer.y;
            if (Math.sqrt(dx * dx + dy * dy) < k.radius + keyPlayer.radius) {
                keysPositions.splice(i, 1);
                keysCollected++;
                keyCounterDisplay.textContent = `${keysCollected}/${TOTAL_KEYS}`;
                if (keysCollected === TOTAL_KEYS) endCurrentGame('key');
            }
        }

        ctx.fillStyle = '#000'; ctx.fillRect(0, 0, keyCanvas.width, keyCanvas.height);
        ctx.font = '30px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('🏃', keyPlayer.x, keyPlayer.y);
        keysPositions.forEach(k => ctx.fillText('🔑', k.x, k.y));
        missiles.forEach(m => ctx.fillText('🚀', m.x, m.y));
        keyGameLoop = requestAnimationFrame(updateKeyGame);
    }

    // --- Sliding Puzzle Logic ---
    let puzzleTiles = [];
    let puzzleMoves = 0;
    let puzzleImage = '';
    const PUZZLE_SIZE = 3;

    function initPuzzleGame() {
        gameActive = true; timerRunning = false; puzzleMoves = 0; puzzleMovesDisplay.textContent = '0';
        resetTimer();
        puzzleImage = residentImages[Math.floor(Math.random() * residentImages.length)];
        puzzlePreview.style.backgroundImage = `url('${puzzleImage}')`;
        puzzleTiles = Array.from({ length: 9 }, (_, i) => i);
        shufflePuzzleSolvable();
        renderPuzzle();
        updateLeaderboard('puzzle');
    }

    function shufflePuzzleSolvable() {
        let emptyPos = 8;
        for (let i = 0; i < 200; i++) {
            const neighbors = getNeighbors(emptyPos, PUZZLE_SIZE);
            const move = neighbors[Math.floor(Math.random() * neighbors.length)];
            [puzzleTiles[emptyPos], puzzleTiles[move]] = [puzzleTiles[move], puzzleTiles[emptyPos]];
            emptyPos = move;
        }
    }

    function getNeighbors(pos, size) {
        const neighbors = [], r = Math.floor(pos / size), c = pos % size;
        if (r > 0) neighbors.push(pos - size);
        if (r < size - 1) neighbors.push(pos + size);
        if (c > 0) neighbors.push(pos - 1);
        if (c < size - 1) neighbors.push(pos + 1);
        return neighbors;
    }

    function renderPuzzle() {
        puzzleGrid.innerHTML = '';
        puzzleTiles.forEach((val, i) => {
            const tile = document.createElement('div');
            tile.classList.add('puzzle-tile');
            if (val === 8) tile.classList.add('empty');
            else {
                tile.style.backgroundImage = `url('${puzzleImage}')`;
                const r = Math.floor(val / 3), c = val % 3;
                tile.style.backgroundPosition = `${c * 50}% ${r * 50}%`;
                tile.addEventListener('click', () => movePuzzleTile(i));
            }
            puzzleGrid.appendChild(tile);
        });
    }

    function movePuzzleTile(index) {
        if (!gameActive) return;
        const emptyPos = puzzleTiles.indexOf(8);
        if (getNeighbors(index, 3).includes(emptyPos)) {
            if (!timerRunning) startTimer(puzzleTimerDisplay);
            [puzzleTiles[index], puzzleTiles[emptyPos]] = [puzzleTiles[emptyPos], puzzleTiles[index]];
            puzzleMoves++; puzzleMovesDisplay.textContent = puzzleMoves;
            renderPuzzle();
            if (puzzleTiles.every((v, i) => v === i)) endCurrentGame('puzzle');
        }
    }

    // --- Snakes and Ladders Logic ---
    let snakesPlayerPos = 0; // 0-99
    let snakesMoves = 0;
    const ladersSnakes = {
        // Ladders (Jump Up)
        12: 35, // Blood Donation example
        45: 78,
        60: 88,
        // Snakes (Fall Down)
        98: 10, // Committee Dues example
        75: 35,
        25: 5
    };

    function initSnakesGame() {
        gameActive = true; timerRunning = false; snakesMoves = 0; snakesPlayerPos = 0;
        snakesMovesDisplay.textContent = '0'; diceResult.textContent = '?';
        resetTimer();
        createSnakesBoard();
        updateLeaderboard('snakes');
    }

    function createSnakesBoard() {
        snakesBoard.innerHTML = '';
        // Create 100 tiles
        for (let i = 99; i >= 0; i--) {
            // Zig-zag pattern
            const row = Math.floor(i / 10);
            const col = (row % 2 === 0) ? (i % 10) : (9 - (i % 10));
            const tileNum = i + 1;
            const tile = document.createElement('div');
            tile.classList.add('snakes-tile');
            tile.id = `tile-${i}`;
            tile.textContent = tileNum;

            if (ladersSnakes[i]) {
                if (ladersSnakes[i] > i) {
                    tile.classList.add('special-ladder');
                    tile.innerHTML = `<span>${tileNum}</span><div class="tile-icon">🪜</div>`;
                } else {
                    tile.classList.add('special-snake');
                    tile.innerHTML = `<span>${tileNum}</span><div class="tile-icon">🐍</div>`;
                }
            }
            if (i === 99) {
                tile.classList.add('finish-tile');
                tile.style.backgroundImage = "url('assets/building.jpg')";
                tile.innerHTML = `<span>100</span><div class="tile-icon">🏠</div>`;
            }
            snakesBoard.appendChild(tile);
        }
        // Add player piece
        const player = document.createElement('div');
        player.id = 'player-piece';
        player.classList.add('player-piece');
        player.textContent = '👤';
        snakesBoard.appendChild(player);
        updatePlayerPos();
    }

    function updatePlayerPos() {
        const player = document.getElementById('player-piece');
        const tile = document.getElementById(`tile-${snakesPlayerPos}`);
        if (!tile) return;

        // Rect of tile relative to board
        const tileRect = tile.getBoundingClientRect();
        const boardRect = snakesBoard.getBoundingClientRect();

        player.style.left = `${tileRect.left - boardRect.left + (tileRect.width / 2 - 17.5)}px`;
        player.style.top = `${tileRect.top - boardRect.top + (tileRect.height / 2 - 17.5)}px`;
    }

    async function rollDice() {
        if (!gameActive || rollDiceBtn.disabled) return;
        if (!timerRunning) startTimer(snakesTimerDisplay);

        rollDiceBtn.disabled = true;
        diceResult.classList.add('rolling');

        const roll = Math.floor(Math.random() * 6) + 1;

        setTimeout(() => {
            diceResult.classList.remove('rolling');
            diceResult.textContent = roll;
            snakesMoves++;
            snakesMovesDisplay.textContent = snakesMoves;
            movePlayer(roll);
        }, 1000);
    }

    async function movePlayer(steps) {
        for (let i = 0; i < steps; i++) {
            if (snakesPlayerPos >= 99) break;
            snakesPlayerPos++;
            updatePlayerPos();
            await new Promise(r => setTimeout(r, 200));
        }

        // Check for special tiles
        if (ladersSnakes[snakesPlayerPos]) {
            const dest = ladersSnakes[snakesPlayerPos];
            const isLadder = dest > snakesPlayerPos;

            setTimeout(() => {
                alert(isLadder ? "איזו נתינה! תרמת דם וקפצת למעלה!" : "אופס! חוב לוועד הבית... יורדים למטה.");
                snakesPlayerPos = dest;
                updatePlayerPos();
                rollDiceBtn.disabled = false;
            }, 600);
        } else if (snakesPlayerPos === 99) {
            endCurrentGame('snakes');
        } else {
            rollDiceBtn.disabled = false;
        }
    }

    // --- Shared Logic ---
    function endCurrentGame(type) {
        gameActive = false; timerRunning = false; clearInterval(timerInterval);
        const display = type === 'memory' ? timerDisplay : (type === 'key' ? keyTimerDisplay : (type === 'puzzle' ? puzzleTimerDisplay : snakesTimerDisplay));
        const finalTimeStr = display.textContent;
        let msg = `כל הכבוד ${currentPlayer.name} (דירה ${currentPlayer.apt})! `;
        let comment = "";

        if (type === 'memory') {
            msg += `סיימתם ב-${moves} תנועות ובזמן של ${finalTimeStr}`;
            comment = "מי וועד הבית!? צריך כאן משחק חוזר דחוף!";
        } else if (type === 'key') {
            msg += `אספתם את כל המפתחות בזמן של ${finalTimeStr}!`;
            comment = "כל הכבוד גם אתם למדתם לשמור על מפתח בממד!";
        } else if (type === 'puzzle') {
            msg += `פתרתם את הפאזל ב-${puzzleMoves} תנועות ובזמן של ${finalTimeStr}!`;
            comment = "כל הכבוד דייר/ת למופת, אין ספק שאתה משקיע בבניין!";
        } else if (type === 'snakes') {
            msg += `הגעתם לממ"ד ב-${snakesMoves} צעדים ובזמן של ${finalTimeStr}!`;
            comment = "ניצחתם את הסולמות והנחשים של אומן 2!";
        }

        winMessage.textContent = msg; funnyCommentDisplay.textContent = comment; winModal.classList.add('show');
        const scoreReport = (type === 'snakes' ? `${finalTimeStr} (${snakesMoves} צעדים)` : (type === 'puzzle' ? `${finalTimeStr} (${puzzleMoves} תנועות)` : finalTimeStr));
        saveScore(currentPlayer.name, currentPlayer.apt, scoreReport, seconds, type);
    }

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
            const title = gameType === 'memory' ? 'זיכרון' : (gameType === 'key' ? 'מפתחות' : (gameType === 'puzzle' ? 'פאזל' : 'סולמות ונחשים'));
            leaderboardTitle.textContent = `טבלת שיאים - ${title}`;
            const res = await fetch(`/api/scores?gameType=${gameType}&t=${Date.now()}`);
            const scores = await res.json();
            const body = document.getElementById('leaderboard-body');
            body.innerHTML = scores.length ? '' : '<tr><td colspan="3">מחכה לשיא הראשון...</td></tr>';
            scores.forEach((s, i) => {
                const row = document.createElement('tr');
                row.innerHTML = `<td>${i + 1}</td><td>${s.name} (דירה ${s.apt})</td><td>${s.timeStr}</td>`;
                body.appendChild(row);
            });
        } catch (e) { console.error(e); }
    }

    function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]]; } }

    gameChoiceBtns.forEach(btn => btn.addEventListener('click', () => {
        gameChoiceBtns.forEach(b => b.classList.remove('active')); btn.classList.add('active'); selectedGame = btn.dataset.game;
    }));

    startGameBtn.addEventListener('click', () => {
        const n = initialNameInput.value.trim(), a = initialAptInput.value.trim();
        if (!n || !a) return alert('נא להזין שם ודירה');
        currentPlayer = { name: n, apt: a }; startModal.classList.remove('show');
        [memoryGameView, keyGameView, puzzleGameView, snakesGameView].forEach(v => v.style.display = 'none');
        if (selectedGame === 'memory') { memoryGameView.style.display = 'block'; initMemoryGame(); }
        else if (selectedGame === 'key') { keyGameView.style.display = 'block'; initKeyGame(); }
        else if (selectedGame === 'puzzle') { puzzleGameView.style.display = 'block'; initPuzzleGame(); }
        else if (selectedGame === 'snakes') { snakesGameView.style.display = 'block'; initSnakesGame(); }
    });

    [restartBtn, keyRestartBtn, puzzleRestartBtn, snakesRestartBtn].forEach(b => b.addEventListener('click', () => { gameActive = false; startModal.classList.add('show'); }));
    rollDiceBtn.addEventListener('click', rollDice);
    document.getElementById('close-modal-btn').addEventListener('click', () => winModal.classList.remove('show'));
    window.addEventListener('keydown', e => keysPressed[e.key] = true); window.addEventListener('keyup', e => delete keysPressed[e.key]);
});
