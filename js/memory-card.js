// Memory Card Game JavaScript

class MemoryGame {
    constructor() {
        // Game state
        this.cards = [];
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.totalPairs = 0;
        this.moves = 0;
        this.gameActive = false;
        this.gamePaused = false;
        this.startTime = null;
        this.pausedTime = null;
        this.timerInterval = null;
        this.elapsedSeconds = 0;

        // Configuration
        this.difficulty = 'medium';
        this.theme = 'emoji';

        // DOM Elements
        this.gameBoard = document.getElementById('gameBoard');
        this.difficultySelect = document.getElementById('difficulty');
        this.themeSelect = document.getElementById('theme');
        this.startBtn = document.getElementById('startBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.timerDisplay = document.getElementById('timer');
        this.movesDisplay = document.getElementById('moves');
        this.pairsDisplay = document.getElementById('pairs');
        this.starsDisplay = document.getElementById('stars');
        this.winModal = document.getElementById('winModal');
        this.pauseModal = document.getElementById('pauseModal');

        // Event listeners
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.startBtn.addEventListener('click', () => this.startGame());
        this.pauseBtn.addEventListener('click', () => this.togglePause());
        this.resetBtn.addEventListener('click', () => this.resetGame());
        
        document.getElementById('playAgainBtn').addEventListener('click', () => this.startGame());
        document.getElementById('backHomeBtn').addEventListener('click', () => this.goHome());
        
        document.getElementById('resumeBtn').addEventListener('click', () => this.togglePause());
        document.getElementById('exitBtn').addEventListener('click', () => this.goHome());
        
        document.querySelector('.close-btn').addEventListener('click', () => this.hideWinModal());

        this.difficultySelect.addEventListener('change', (e) => {
            this.difficulty = e.target.value;
            this.resetGame();
        });

        this.themeSelect.addEventListener('change', (e) => {
            this.theme = e.target.value;
            if (this.gameActive || this.gamePaused) {
                this.resetGame();
            }
        });
    }

    // Theme data
    getThemeData() {
        const themes = {
            emoji: ['😀', '🎮', '🎨', '🎵', '🍕', '🚀', '⚡', '🎯', '🎁', '🍦', '🌟', '🎭', '🦄', '🐱', '🐶', '🌈', '🎪', '🎸'],
            numbers: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18'],
            letters: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R'],
            colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B88B', '#A9E2A9', '#FFB6C1', '#DDA0DD', '#20B2AA', '#FFD700', '#FF69B4', '#87CEEB', '#F0E68C', '#FF8C00']
        };
        return themes[this.theme] || themes.emoji;
    }

    // Grid configuration
    getGridConfig() {
        const configs = {
            easy: { cols: 3, rows: 4, pairs: 6 },
            medium: { cols: 4, rows: 4, pairs: 8 },
            hard: { cols: 6, rows: 4, pairs: 12 },
            expert: { cols: 6, rows: 6, pairs: 18 }
        };
        return configs[this.difficulty] || configs.medium;
    }

    // Initialize game
    startGame() {
        if (this.gameActive || this.gamePaused) {
            return;
        }

        this.initializeCards();
        this.gameActive = true;
        this.gamePaused = false;
        this.moves = 0;
        this.matchedPairs = 0;
        this.flippedCards = [];
        this.elapsedSeconds = 0;

        this.updateDisplay();
        this.startTimer();
        this.renderBoard();
        this.updateButtonStates();
        this.hideWinModal();
    }

    // Initialize card data
    initializeCards() {
        const config = this.getGridConfig();
        const themeData = this.getThemeData();
        this.totalPairs = config.pairs;

        const cardValues = themeData.slice(0, config.pairs);
        const deck = [...cardValues, ...cardValues]; // Duplicate each card for pairs

        // Shuffle
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }

        // Create card objects
        this.cards = deck.map((value, index) => ({
            id: index,
            value: value,
            flipped: false,
            matched: false
        }));
    }

    // Render game board
    renderBoard() {
        const config = this.getGridConfig();
        this.gameBoard.className = `game-board ${this.difficulty}`;
        this.gameBoard.innerHTML = '';

        this.cards.forEach(card => {
            const cardElement = document.createElement('button');
            cardElement.className = 'card';
            if (card.flipped) cardElement.classList.add('flipped');
            if (card.matched) cardElement.classList.add('matched');

            if (card.flipped || card.matched) {
                cardElement.innerHTML = `<span class="card-content">${
                    this.theme === 'colors' 
                        ? `<div style="width: 100%; height: 100%; background: ${card.value}; border-radius: 8px;"></div>`
                        : card.value
                }</span>`;
            }

            cardElement.addEventListener('click', () => this.flipCard(card.id, cardElement));
            this.gameBoard.appendChild(cardElement);
        });
    }

    // Flip card
    flipCard(cardId, cardElement) {
        if (!this.gameActive || this.gamePaused || this.flippedCards.length >= 2) {
            return;
        }

        const card = this.cards[cardId];
        if (card.flipped || card.matched || this.flippedCards.includes(cardId)) {
            return;
        }

        // Play flip sound
        this.playSound('flip');

        card.flipped = true;
        this.flippedCards.push(cardId);

        cardElement.classList.add('flipped');
        if (this.theme === 'colors') {
            cardElement.innerHTML = `<div style="width: 100%; height: 100%; background: ${card.value}; border-radius: 8px;"></div>`;
        } else {
            cardElement.innerHTML = `<span class="card-content">${card.value}</span>`;
        }

        if (this.flippedCards.length === 2) {
            this.checkMatch();
        }
    }

    // Check for match
    checkMatch() {
        const firstCardId = this.flippedCards[0];
        const secondCardId = this.flippedCards[1];
        const firstCard = this.cards[firstCardId];
        const secondCard = this.cards[secondCardId];

        this.moves++;
        this.updateDisplay();

        const isMatch = firstCard.value === secondCard.value;

        setTimeout(() => {
            if (isMatch) {
                this.handleMatch(firstCardId, secondCardId);
            } else {
                this.handleMismatch(firstCardId, secondCardId);
            }
        }, 600);
    }

    // Handle match
    handleMatch(firstCardId, secondCardId) {
        this.playSound('match');

        this.cards[firstCardId].matched = true;
        this.cards[secondCardId].matched = true;
        this.matchedPairs++;

        // Celebration animation
        const cards = document.querySelectorAll('.card');
        cards[firstCardId].classList.add('celebrate');
        cards[secondCardId].classList.add('celebrate');

        this.flippedCards = [];
        this.updateDisplay();

        if (this.matchedPairs === this.totalPairs) {
            this.endGame();
        }
    }

    // Handle mismatch
    handleMismatch(firstCardId, secondCardId) {
        this.playSound('mismatch');

        this.cards[firstCardId].flipped = false;
        this.cards[secondCardId].flipped = false;

        const cards = document.querySelectorAll('.card');
        cards[firstCardId].classList.remove('flipped');
        cards[secondCardId].classList.remove('flipped');
        cards[firstCardId].innerHTML = '';
        cards[secondCardId].innerHTML = '';

        this.flippedCards = [];
    }

    // Calculate stars
    getStarRating() {
        const config = this.getGridConfig();
        const optimalMoves = config.pairs * 1.2; // Optimal performance
        const goodMoves = config.pairs * 1.5;
        const acceptableMoves = config.pairs * 2;

        if (this.moves <= optimalMoves) return '⭐⭐⭐';
        if (this.moves <= goodMoves) return '⭐⭐';
        if (this.moves <= acceptableMoves) return '⭐';
        return '⭐';
    }

    // Update display
    updateDisplay() {
        this.timerDisplay.textContent = this.formatTime(this.elapsedSeconds);
        this.movesDisplay.textContent = this.moves;
        this.pairsDisplay.textContent = `${this.matchedPairs}/${this.totalPairs}`;
        this.starsDisplay.textContent = this.getStarRating();
    }

    // Timer
    startTimer() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.startTime = Date.now() - (this.elapsedSeconds * 1000);

        this.timerInterval = setInterval(() => {
            this.elapsedSeconds = Math.floor((Date.now() - this.startTime) / 1000);
            this.updateDisplay();
        }, 100);
    }

    // Format time
    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    // Pause/Resume
    togglePause() {
        if (!this.gameActive) return;

        if (this.gamePaused) {
            this.gamePaused = false;
            this.startTimer();
            this.pauseModal.classList.add('hidden');
            this.gameBoard.style.opacity = '1';
            this.gameBoard.style.pointerEvents = 'auto';
        } else {
            this.gamePaused = true;
            if (this.timerInterval) clearInterval(this.timerInterval);
            this.pauseModal.classList.remove('hidden');
            this.gameBoard.style.opacity = '0.5';
            this.gameBoard.style.pointerEvents = 'none';
        }

        this.updateButtonStates();
    }

    // Reset game
    resetGame() {
        this.gameActive = false;
        this.gamePaused = false;
        this.cards = [];
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.moves = 0;
        this.elapsedSeconds = 0;
        if (this.timerInterval) clearInterval(this.timerInterval);

        this.gameBoard.innerHTML = '';
        this.updateDisplay();
        this.updateButtonStates();
        this.hideWinModal();
        this.pauseModal.classList.add('hidden');
        this.gameBoard.style.opacity = '1';
        this.gameBoard.style.pointerEvents = 'auto';
    }

    // End game
    endGame() {
        this.gameActive = false;
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.playSound('win');

        this.saveScore();
        this.showWinModal();
        this.updateButtonStates();
    }

    // Save score to local storage
    saveScore() {
        const scoreKey = `memory-game-${this.difficulty}-${this.theme}`;
        let scores = JSON.parse(localStorage.getItem(scoreKey) || '[]');

        scores.push({
            time: this.elapsedSeconds,
            moves: this.moves,
            stars: this.getStarRating(),
            date: new Date().toLocaleString()
        });

        scores.sort((a, b) => a.time - b.time);
        scores = scores.slice(0, 5); // Keep only top 5

        localStorage.setItem(scoreKey, JSON.stringify(scores));
    }

    // Show win modal
    showWinModal() {
        document.getElementById('finalTime').textContent = this.formatTime(this.elapsedSeconds);
        document.getElementById('finalMoves').textContent = this.moves;
        document.getElementById('finalStars').textContent = this.getStarRating();

        this.displayBestTimes();
        this.winModal.classList.remove('hidden');
    }

    // Hide win modal
    hideWinModal() {
        this.winModal.classList.add('hidden');
    }

    // Display best times
    displayBestTimes() {
        const scoreKey = `memory-game-${this.difficulty}-${this.theme}`;
        const scores = JSON.parse(localStorage.getItem(scoreKey) || '[]');
        const bestTimesList = document.getElementById('bestTimes');

        if (scores.length === 0) {
            bestTimesList.innerHTML = '<li>No records yet</li>';
            return;
        }

        bestTimesList.innerHTML = scores.map((score, index) => 
            `<li>${index + 1}. ${this.formatTime(score.time)} - ${score.moves} moves - ${score.stars}</li>`
        ).join('');
    }

    // Update button states
    updateButtonStates() {
        this.difficultySelect.disabled = this.gameActive || this.gamePaused;
        this.themeSelect.disabled = this.gameActive || this.gamePaused;
        this.startBtn.disabled = this.gameActive || this.gamePaused;
        this.pauseBtn.disabled = !this.gameActive || this.gamePaused;
        this.resetBtn.disabled = !this.gameActive && !this.gamePaused;

        if (this.gamePaused) {
            this.pauseBtn.textContent = 'Resume';
        } else {
            this.pauseBtn.textContent = 'Pause';
        }
    }

    // Go home
    goHome() {
        window.location.href = 'index.html';
    }

    // Sound effects (Web Audio API)
    playSound(type) {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gain = audioContext.createGain();

            oscillator.connect(gain);
            gain.connect(audioContext.destination);

            const now = audioContext.currentTime;

            switch (type) {
                case 'flip':
                    oscillator.frequency.setValueAtTime(800, now);
                    oscillator.frequency.setValueAtTime(600, now + 0.1);
                    gain.gain.setValueAtTime(0.3, now);
                    gain.gain.setValueAtTime(0, now + 0.1);
                    oscillator.start(now);
                    oscillator.stop(now + 0.1);
                    break;

                case 'match':
                    // Play a pleasant two-tone beep
                    oscillator.frequency.setValueAtTime(523.25, now); // C
                    oscillator.frequency.setValueAtTime(659.25, now + 0.1); // E
                    gain.gain.setValueAtTime(0.3, now);
                    gain.gain.setValueAtTime(0, now + 0.2);
                    oscillator.start(now);
                    oscillator.stop(now + 0.2);
                    break;

                case 'mismatch':
                    oscillator.frequency.setValueAtTime(400, now);
                    oscillator.frequency.setValueAtTime(300, now + 0.15);
                    gain.gain.setValueAtTime(0.2, now);
                    gain.gain.setValueAtTime(0, now + 0.15);
                    oscillator.start(now);
                    oscillator.stop(now + 0.15);
                    break;

                case 'win':
                    // Play ascending tones
                    const frequencies = [523.25, 659.25, 783.99, 1046.50];
                    frequencies.forEach((freq, index) => {
                        const osc = audioContext.createOscillator();
                        const g = audioContext.createGain();
                        osc.connect(g);
                        g.connect(audioContext.destination);
                        osc.frequency.setValueAtTime(freq, now + (index * 0.1));
                        g.gain.setValueAtTime(0.2, now + (index * 0.1));
                        g.gain.setValueAtTime(0, now + (index * 0.1) + 0.15);
                        osc.start(now + (index * 0.1));
                        osc.stop(now + (index * 0.1) + 0.15);
                    });
                    break;
            }
        } catch (e) {
            // Fallback if Web Audio API is not available
            console.log('Sound not available, but game continues');
        }
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const game = new MemoryGame();
    console.log('Memory Card Game loaded!');
});
