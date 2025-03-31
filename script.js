document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const cells = document.querySelectorAll('.cell');
    const statusDisplay = document.getElementById('status-message');
    const xScoreDisplay = document.getElementById('x-score');
    const oScoreDisplay = document.getElementById('o-score');
    const xWinsDisplay = document.getElementById('x-wins');
    const oWinsDisplay = document.getElementById('o-wins');
    const drawsDisplay = document.getElementById('draws');
    const newGameBtn = document.getElementById('new-game-btn');
    const resetScoreBtn = document.getElementById('reset-score-btn');
    const themeSwitch = document.getElementById('theme-switch');
    const effectsSwitch = document.getElementById('effects-switch');
    const soundBtn = document.getElementById('sound-btn');
    const modeButtons = document.querySelectorAll('.mode-btn');
    const difficultySelect = document.getElementById('difficulty');
    const difficultyContainer = document.getElementById('difficulty-container');
    const playerXInfo = document.querySelector('.player-info.x-turn');
    const playerOInfo = document.querySelectorAll('.player-info')[1];
    
    // Audio elements
    const clickSound = document.getElementById('click-sound');
    const winSound = document.getElementById('win-sound');
    const drawSound = document.getElementById('draw-sound');
    
    // Game variables
    let gameState = ['', '', '', '', '', '', '', '', ''];
    let currentPlayer = 'X';
    let gameActive = true;
    let gameMode = 'player'; // 'player' or 'ai'
    let aiDifficulty = 'medium'; // 'easy', 'medium', 'hard'
    let soundEnabled = true;
    let effectsEnabled = true;
    
    const scores = {
        xWins: 0,
        oWins: 0,
        draws: 0,
        xScore: 0,
        oScore: 0
    };
    
    const winningConditions = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
        [0, 4, 8], [2, 4, 6]             // diagonals
    ];
    
    // Initialize the game
    function init() {
        // Load saved preferences
        loadPreferences();
        
        // Set up event listeners
        cells.forEach(cell => cell.addEventListener('click', handleCellClick));
        newGameBtn.addEventListener('click', startNewGame);
        resetScoreBtn.addEventListener('click', resetScores);
        themeSwitch.addEventListener('change', toggleTheme);
        effectsSwitch.addEventListener('change', toggleEffects);
        soundBtn.addEventListener('click', toggleSound);
        modeButtons.forEach(btn => btn.addEventListener('click', changeGameMode));
        difficultySelect.addEventListener('change', changeDifficulty);
        
        // Initialize game board
        updateBoard();
    }
    
    // Load user preferences from localStorage
    function loadPreferences() {
        const savedTheme = localStorage.getItem('ticTacToeTheme');
        if (savedTheme === 'dark') {
            themeSwitch.checked = true;
            document.documentElement.setAttribute('data-theme', 'dark');
        }
        
        const savedEffects = localStorage.getItem('ticTacToeEffects');
        if (savedEffects === 'false') {
            effectsSwitch.checked = false;
            effectsEnabled = false;
        }
        
        const savedSound = localStorage.getItem('ticTacToeSound');
        if (savedSound === 'false') {
            soundEnabled = false;
            soundBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
        }
        
        const savedScores = localStorage.getItem('ticTacToeScores');
        if (savedScores) {
            Object.assign(scores, JSON.parse(savedScores));
            updateScoreDisplay();
        }
        
        const savedMode = localStorage.getItem('ticTacToeMode');
        if (savedMode) {
            gameMode = savedMode;
            document.querySelector(`.mode-btn[data-mode="${savedMode}"]`).classList.add('active');
            difficultyContainer.style.display = savedMode === 'ai' ? 'flex' : 'none';
        }
        
        const savedDifficulty = localStorage.getItem('ticTacToeDifficulty');
        if (savedDifficulty) {
            aiDifficulty = savedDifficulty;
            difficultySelect.value = savedDifficulty;
        }
    }
    
    // Handle cell click
    function handleCellClick(e) {
        if (!gameActive) return;
        
        const clickedCell = e.target;
        const clickedCellIndex = parseInt(clickedCell.getAttribute('data-index'));
        
        // If cell is already filled or game is not active, ignore click
        if (gameState[clickedCellIndex] !== '') return;
        
        // Play click sound
        if (soundEnabled) {
            clickSound.currentTime = 0;
            clickSound.play();
        }
        
        // Make move for human player
        makeMove(clickedCellIndex, currentPlayer);
        
        // Check if game is over
        const gameWon = checkWin();
        const gameDraw = checkDraw();
        
        if (gameWon || gameDraw) {
            gameActive = false;
            return;
        }
        
        // If playing against AI and it's AI's turn
        if (gameMode === 'ai' && currentPlayer === 'O') {
            setTimeout(() => {
                const aiMove = getAIMove();
                makeMove(aiMove, 'O');
                
                checkWin();
                checkDraw();
            }, 500);
        }
    }
    
    // Make a move on the board
    function makeMove(cellIndex, player) {
        // Update game state
        gameState[cellIndex] = player;
        
        // Update UI
        const cell = document.querySelector(`.cell[data-index="${cellIndex}"]`);
        
        // Remove any existing classes to avoid duplication
        cell.classList.remove('x', 'o');
        
        // Add the appropriate class
        cell.classList.add(player.toLowerCase());
        
        // Add animation effect
        if (effectsEnabled) {
            cell.style.animation = 'none';
            void cell.offsetWidth; // Trigger reflow
            cell.style.animation = 'popIn 0.3s ease';
        }
        
        // Switch player
        currentPlayer = player === 'X' ? 'O' : 'X';
        updateStatus();
    }
    
    // Check if current player has won
    function checkWin() {
        for (let i = 0; i < winningConditions.length; i++) {
            const [a, b, c] = winningConditions[i];
            
            if (gameState[a] === '' || gameState[b] === '' || gameState[c] === '') {
                continue;
            }
            
            if (gameState[a] === gameState[b] && gameState[b] === gameState[c]) {
                // Game won
                gameActive = false;
                
                // Highlight winning cells
                if (effectsEnabled) {
                    document.querySelector(`.cell[data-index="${a}"]`).classList.add('winning-cell');
                    document.querySelector(`.cell[data-index="${b}"]`).classList.add('winning-cell');
                    document.querySelector(`.cell[data-index="${c}"]`).classList.add('winning-cell');
                }
                
                // Update scores
                const winner = gameState[a];
                if (winner === 'X') {
                    scores.xWins++;
                    scores.xScore += 5;
                    statusDisplay.textContent = 'Player X Wins!';
                } else {
                    scores.oWins++;
                    scores.oScore += 5;
                    statusDisplay.textContent = 'Player O Wins!';
                }
                
                // Play win sound
                if (soundEnabled) {
                    winSound.currentTime = 0;
                    winSound.play();
                }
                
                // Update score display
                updateScoreDisplay();
                saveScores();
                
                return true;
            }
        }
        return false;
    }
    
    // Check if game is a draw
    function checkDraw() {
        if (!gameState.includes('')) {
            // Game is a draw
            gameActive = false;
            scores.draws++;
            statusDisplay.textContent = 'Game Ended in a Draw!';
            
            // Play draw sound
            if (soundEnabled) {
                drawSound.currentTime = 0;
                drawSound.play();
            }
            
            // Update score display
            updateScoreDisplay();
            saveScores();
            
            return true;
        }
        return false;
    }
    
    // Update game status display
    function updateStatus() {
        if (gameActive) {
            if (gameMode === 'ai' && currentPlayer === 'O') {
                statusDisplay.textContent = 'AI is thinking...';
            } else {
                statusDisplay.textContent = `Player ${currentPlayer}'s Turn`;
            }
            
            // Update player turn indicator
            if (currentPlayer === 'X') {
                playerXInfo.classList.add('x-turn');
                playerOInfo.classList.remove('x-turn');
            } else {
                playerXInfo.classList.remove('x-turn');
                playerOInfo.classList.add('x-turn');
            }
        }
    }
    
    // Update score displays
    function updateScoreDisplay() {
        xWinsDisplay.textContent = scores.xWins;
        oWinsDisplay.textContent = scores.oWins;
        drawsDisplay.textContent = scores.draws;
        xScoreDisplay.textContent = scores.xScore;
        oScoreDisplay.textContent = scores.oScore;
    }
    
    // Start a new game
    function startNewGame() {
        // Reset game state
        gameState = ['', '', '', '', '', '', '', '', ''];
        gameActive = true;
        currentPlayer = 'X';
        
        // Reset board UI
        cells.forEach(cell => {
            cell.className = 'cell';
            cell.style.animation = '';
        });
        
        // Update status
        updateStatus();
        
        // If AI starts first
        if (gameMode === 'ai' && currentPlayer === 'O') {
            setTimeout(() => {
                const aiMove = getAIMove();
                makeMove(aiMove, 'O');
            }, 500);
        }
    }
    
    // Reset all scores
    function resetScores() {
        if (!confirm('Are you sure you want to reset all scores?')) return;
        
        scores.xWins = 0;
        scores.oWins = 0;
        scores.draws = 0;
        scores.xScore = 0;
        scores.oScore = 0;
        
        updateScoreDisplay();
        saveScores();
        startNewGame();
    }
    
    // Toggle dark/light theme
    function toggleTheme() {
        if (themeSwitch.checked) {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('ticTacToeTheme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('ticTacToeTheme', 'light');
        }
    }
    
    // Toggle special effects
    function toggleEffects() {
        effectsEnabled = effectsSwitch.checked;
        localStorage.setItem('ticTacToeEffects', effectsEnabled.toString());
    }
    
    // Toggle sound
    function toggleSound() {
        soundEnabled = !soundEnabled;
        if (soundEnabled) {
            soundBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
        } else {
            soundBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
        }
        localStorage.setItem('ticTacToeSound', soundEnabled.toString());
    }
    
    // Change game mode (Player vs Player or Player vs AI)
    function changeGameMode(e) {
        const selectedMode = e.target.dataset.mode;
        gameMode = selectedMode;
        
        // Update UI
        modeButtons.forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        
        // Show/hide difficulty selector
        difficultyContainer.style.display = selectedMode === 'ai' ? 'flex' : 'none';
        
        // Save preference
        localStorage.setItem('ticTacToeMode', selectedMode);
        
        // Start new game with new mode
        startNewGame();
    }
    
    // Change AI difficulty
    function changeDifficulty() {
        aiDifficulty = difficultySelect.value;
        localStorage.setItem('ticTacToeDifficulty', aiDifficulty);
    }
    
    // Save scores to localStorage
    function saveScores() {
        localStorage.setItem('ticTacToeScores', JSON.stringify(scores));
    }
    
    // AI move logic
    function getAIMove() {
        // Easy difficulty - random moves
        if (aiDifficulty === 'easy') {
            return getRandomMove();
        }
        
        // Medium difficulty - sometimes smart, sometimes random
        if (aiDifficulty === 'medium') {
            return Math.random() < 0.7 ? getSmartMove() : getRandomMove();
        }
        
        // Hard difficulty - always smart
        return getSmartMove();
    }
    
    // Get a random available move
    function getRandomMove() {
        const availableMoves = [];
        gameState.forEach((cell, index) => {
            if (cell === '') availableMoves.push(index);
        });
        
        if (availableMoves.length > 0) {
            return availableMoves[Math.floor(Math.random() * availableMoves.length)];
        }
        return -1;
    }
    
    // Get a smart move (tries to win or block player)
    function getSmartMove() {
        // 1. First check if AI can win in the next move
        for (let i = 0; i < winningConditions.length; i++) {
            const [a, b, c] = winningConditions[i];
            if (gameState[a] === 'O' && gameState[b] === 'O' && gameState[c] === '') return c;
            if (gameState[a] === 'O' && gameState[c] === 'O' && gameState[b] === '') return b;
            if (gameState[b] === 'O' && gameState[c] === 'O' && gameState[a] === '') return a;
        }
        
        // 2. Check if player can win in next move and block them
        for (let i = 0; i < winningConditions.length; i++) {
            const [a, b, c] = winningConditions[i];
            if (gameState[a] === 'X' && gameState[b] === 'X' && gameState[c] === '') return c;
            if (gameState[a] === 'X' && gameState[c] === 'X' && gameState[b] === '') return b;
            if (gameState[b] === 'X' && gameState[c] === 'X' && gameState[a] === '') return a;
        }
        
        // 3. Try to take center if available
        if (gameState[4] === '') return 4;
        
        // 4. Try to take a corner if available
        const corners = [0, 2, 6, 8];
        const availableCorners = corners.filter(corner => gameState[corner] === '');
        if (availableCorners.length > 0) {
            return availableCorners[Math.floor(Math.random() * availableCorners.length)];
        }
        
        // 5. Take any available edge
        const edges = [1, 3, 5, 7];
        const availableEdges = edges.filter(edge => gameState[edge] === '');
        if (availableEdges.length > 0) {
            return availableEdges[Math.floor(Math.random() * availableEdges.length)];
        }
        
        // Fallback to random move
        return getRandomMove();
    }
    
    // Initialize the game
    init();
});