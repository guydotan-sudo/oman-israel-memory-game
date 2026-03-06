document.addEventListener('DOMContentLoaded', () => {
    const gameGrid = document.getElementById('game-grid');
    const timerDisplay = document.getElementById('timer');
    const moveCounterDisplay = document.getElementById('move-counter');
    const restartBtn = document.getElementById('restart-btn');
    const winModal = document.getElementById('win-modal');
    const winMessage = document.getElementById('win-message');
    const funnyCommentDisplay = document.getElementById('funny-comment');
    const startModal = document.getElementById('start-modal');
    const startGameBtn = document.getElementById('start-game-btn');
    const initialNameInput = document.getElementById('initial-name');
    const initialAptInput = document.getElementById('initial-apt');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const leaderboardBody = document.getElementById('leaderboard-body');

    let currentPlayer = { name: '', apt: '' };

    // --- Firebase Configuration ---
    const firebaseConfig = {
        apiKey: "AIzaSyBn3LCqsd9TUmF917SavpiskyDyN0g4Yk0",
        authDomain: "uman-israel.firebaseapp.com",
        databaseURL: "https://uman-israel-default-rtdb.firebaseio.com",
        projectId: "uman-israel",
        storageBucket: "uman-israel.firebasestorage.app",
        messagingSenderId: "1008900380559",
        appId: "1:1008900380559:web:af2e9e3d0c173cd76a1dfa",
        measurementId: "G-DWFE1ZES8Y"
    };

    // Initialize Firebase if config is provided
    let database = null;
    if (firebaseConfig.apiKey !== "YOUR_API_KEY") {
        firebase.initializeApp(firebaseConfig);
        database = firebase.database();
    }

    let cards = [];
    let flippedCards = [];
    let matchedPairs = 0;
    let moves = 0;
    let timerInterval;
    let seconds = 0;
    let isGameStarted = false;
    let canFlip = true;

    // List of resident images (we'll update this automatically later or hardcode for now)
    const residentImages = [
        'assets/residents/1.jpg',
        'assets/residents/2.jpg',
        'assets/residents/3.jpg',
        'assets/residents/4.jpg',
        'assets/residents/5.jpg',
        'assets/residents/6.jpg',
        'assets/residents/7.jpg',
        'assets/residents/8.jpg',
        'assets/residents/9.jpg',
        'assets/residents/10.jpg',
        'assets/residents/11.jpg',
        'assets/residents/12.jpg',
        'assets/residents/13.jpg',
        'assets/residents/14.jpg',
        'assets/residents/15.jpg',
        'assets/residents/16.jpg',
        'assets/residents/17.jpg',
        'assets/residents/18.jpg'
    ];

    let totalPairs = residentImages.length;

    function initGame() {
        // Reset variables
        gameGrid.innerHTML = '';
        flippedCards = [];
        matchedPairs = 0;
        moves = 0;
        seconds = 0;
        isGameStarted = false;
        canFlip = true;
        moveCounterDisplay.textContent = '0';
        timerDisplay.textContent = '00:00';
        clearInterval(timerInterval);
        winModal.classList.remove('show');

        // Adjust grid columns based on number of pairs
        updateGridColumns();

        // Prepare card data
        const cardValues = [];
        for (let i = 0; i < totalPairs; i++) {
            cardValues.push(residentImages[i]);
            cardValues.push(residentImages[i]);
        }

        // Shuffle
        shuffle(cardValues);

        // Create cards
        cardValues.forEach((val, index) => {
            const card = createCard(val, index);
            gameGrid.appendChild(card);
        });

        updateLeaderboard();
    }

    function createCard(imageUrl, index) {
        const card = document.createElement('div');
        card.classList.add('memory-card');
        card.dataset.value = imageUrl;

        // Front face (image)
        const front = document.createElement('div');
        front.classList.add('card-face', 'card-front');

        const img = document.createElement('div');
        img.classList.add('card-image');
        img.style.backgroundImage = `url('${imageUrl}')`;
        img.style.backgroundSize = 'cover';
        img.style.backgroundPosition = 'center';

        front.appendChild(img);

        // Back face (pattern)
        const back = document.createElement('div');
        back.classList.add('card-face', 'card-back');

        const backText = document.createElement('span');
        backText.classList.add('card-back-text');
        backText.textContent = 'אומן 2';
        back.appendChild(backText);

        card.appendChild(front);
        card.appendChild(back);

        card.addEventListener('click', () => flipCard(card));
        return card;
    }

    function updateGridColumns() {
        const totalCards = totalPairs * 2;
        const width = window.innerWidth;
        let cols = 6;

        if (width <= 480) {
            cols = 3;
        } else if (width <= 768) {
            cols = 4;
        } else {
            if (totalCards <= 12) cols = 4;
            else if (totalCards <= 20) cols = 5;
            else cols = 6;
        }

        gameGrid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    }

    window.addEventListener('resize', updateGridColumns);

    function flipCard(card) {
        if (!canFlip || flippedCards.includes(card) || card.classList.contains('flipped') || card.classList.contains('matched')) {
            return;
        }

        if (!isGameStarted) {
            startTimer();
            isGameStarted = true;
        }

        card.classList.add('flipped');
        flippedCards.push(card);

        if (flippedCards.length === 2) {
            moves++;
            moveCounterDisplay.textContent = moves;
            checkMatch();
        }
    }

    function checkMatch() {
        const [card1, card2] = flippedCards;
        const val1 = card1.dataset.value;
        const val2 = card2.dataset.value;

        if (val1 === val2) {
            // Match found
            card1.classList.add('matched');
            card2.classList.add('matched');
            matchedPairs++;
            flippedCards = [];

            if (matchedPairs === totalPairs) {
                endGame();
            }
        } else {
            // No match
            canFlip = false;
            setTimeout(() => {
                card1.classList.remove('flipped');
                card2.classList.remove('flipped');
                flippedCards = [];
                canFlip = true;
            }, 1000);
        }
    }

    function startTimer() {
        timerInterval = setInterval(() => {
            seconds++;
            const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
            const ss = String(seconds % 60).padStart(2, '0');
            timerDisplay.textContent = `${mm}:${ss}`;
        }, 1000);
    }

    function endGame() {
        clearInterval(timerInterval);
        const finalTime = timerDisplay.textContent;
        winMessage.textContent = `כל הכבוד ${currentPlayer.name} מדירה ${currentPlayer.apt}! סיימתם ב-${moves} תנועות ובזמן של ${finalTime}`;

        // Pick a funny comment
        const funnyComments = [
            "רק ריינשרייבר יכול לנהל כאן את הקרב הזה!",
            "דירה " + currentPlayer.apt + " בדרך להיות וועד הבית הבא...",
            "מה קורה עם לאה? היא עדיין תקועה בלובי?",
            "מי וועד הבית!? צריך כאן משחק חוזר דחוף!",
            "דירה 12 כבר מתחילה להזיע, מישהו עוקף אותם!",
            "קצב מצוין! אפילו המעלית של אומן 2 עובדת יותר לאט...",
            "נראה שיש לנו אלוף חדש בבניין! ריינשרייבר, לטיפולך.",
            "משחק נקי, בלי חריגות בנייה ובלי תלונות לשכנים.",
            "האם שמענו את לאה אומרת שזה היה מזל של מתחילים?",
            "וועד הבית מאשר: תוצאה חוקית למהדרין!"
        ];
        const randomComment = funnyComments[Math.floor(Math.random() * funnyComments.length)];
        funnyCommentDisplay.textContent = randomComment;

        // Save score automatically now that we have player info
        saveScore(currentPlayer.name, currentPlayer.apt, finalTime, seconds);

        setTimeout(() => {
            winModal.classList.add('show');
        }, 500);
    }

    function shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    // Leaderboard Logic (Shared via Firebase)
    function saveScore(name, apt, timeStr, timeSeconds) {
        const entryName = `${name} (דירה ${apt})`;

        // Save locally for backup
        let localLeaderboard = JSON.parse(localStorage.getItem('oman_israel_leaderboard') || '[]');
        localLeaderboard.push({ name: entryName, timeStr, timeSeconds });
        localLeaderboard.sort((a, b) => a.timeSeconds - b.timeSeconds);
        localStorage.setItem('oman_israel_leaderboard', JSON.stringify(localLeaderboard.slice(0, 5)));

        // Save to Firebase (Shared)
        if (database) {
            const scoresRef = database.ref('scores');
            scoresRef.push({
                name: name,
                apt: apt,
                displayName: entryName,
                timeStr: timeStr,
                timeSeconds: timeSeconds,
                timestamp: Date.now()
            });
        }
    }

    function updateLeaderboard() {
        if (!database) {
            displayLeaderboard(JSON.parse(localStorage.getItem('oman_israel_leaderboard') || '[]'));
            return;
        }

        const scoresRef = database.ref('scores');
        scoresRef.orderByChild('timeSeconds').limitToFirst(10).on('value', (snapshot) => {
            const scores = [];
            snapshot.forEach((childSnapshot) => {
                const data = childSnapshot.val();
                scores.push({
                    name: data.displayName || `${data.name} (דירה ${data.apt})`,
                    timeStr: data.timeStr
                });
            });
            displayLeaderboard(scores);
        });
    }

    function displayLeaderboard(leaderboard) {
        if (leaderboard.length === 0) {
            leaderboard = [{ name: 'מחכה לשיא הראשון...', timeStr: '--:--' }];
        }

        leaderboardBody.innerHTML = '';
        leaderboard.forEach((entry, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${entry.name}</td>
                <td>${entry.timeStr}</td>
            `;
            leaderboardBody.appendChild(row);
        });
    }

    startGameBtn.addEventListener('click', () => {
        const name = initialNameInput.value.trim();
        const apt = initialAptInput.value.trim();

        if (name && apt) {
            currentPlayer = { name, apt };
            startModal.classList.remove('show');
            initGame();
        } else {
            alert('בבקשה הכניסו שם ומספר דירה כדי להתחיל');
        }
    });

    closeModalBtn.addEventListener('click', () => {
        winModal.classList.remove('show');
    });

    restartBtn.addEventListener('click', initGame);

    // Initial load
    updateLeaderboard();
});
