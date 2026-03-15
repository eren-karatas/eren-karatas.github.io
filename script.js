const board = document.getElementById('board');
const cells = document.querySelectorAll('.cell');
const statusText = document.getElementById('status');
const resetBtn = document.getElementById('resetBtn');
const difficultySelect = document.getElementById('difficulty');
const sadOverlay = document.getElementById('sadOverlay');

let gameActive = true;
const HUMAN_PLAYER = 'X';
const AI_PLAYER = 'O';
let currentPlayer = HUMAN_PLAYER;
let gameState = ['', '', '', '', '', '', '', '', ''];

const winningConditions = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6]             // Diagonals
];

const winningMessage = (winner) => winner === HUMAN_PLAYER ? `Tebrikler, Kazandın!` : `Yapay Zeka Kazandı!`;
const drawMessage = () => `Oyun Berabere Bitti!`;
const currentPlayerTurn = () => currentPlayer === HUMAN_PLAYER ? `Senin Sıran (X)` : `Yapay Zeka Düşünüyor...`;

function handleCellPlayed(cellIndex, player) {
    gameState[cellIndex] = player;
    const cell = cells[cellIndex];
    cell.innerHTML = player;
    cell.classList.add(player.toLowerCase());
    cell.classList.add('pop');
}

function checkWin(boardState, player) {
    return winningConditions.some(condition => {
        return condition.every(index => boardState[index] === player);
    });
}

function checkDraw(boardState) {
    return !boardState.includes('');
}

function triggerConfetti() {
    var duration = 3000;
    var animationEnd = Date.now() + duration;
    var defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

    function randomInRange(min, max) {
      return Math.random() * (max - min) + min;
    }

    var interval = setInterval(function() {
      var timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      var particleCount = 50 * (timeLeft / duration);
      confetti({
        ...defaults, particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults, particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);
}

function highlightWinningCells(boardState, player) {
    for (let i = 0; i < winningConditions.length; i++) {
        const [a, b, c] = winningConditions[i];
        if (boardState[a] === player && boardState[b] === player && boardState[c] === player) {
            [a, b, c].forEach(index => {
                cells[index].style.background = '#f1f5f9';
                cells[index].style.transform = 'scale(1.05)';
                cells[index].style.boxShadow = `0 0 20px ${player === 'X' ? '#0ea5e9' : '#ec4899'}`;
                cells[index].style.borderColor = player === 'X' ? '#0ea5e9' : '#ec4899';
            });
            break;
        }
    }
}

function handleResultValidation() {
    if (checkWin(gameState, currentPlayer)) {
        statusText.innerHTML = winningMessage(currentPlayer);
        statusText.style.color = currentPlayer === HUMAN_PLAYER ? '#0ea5e9' : '#ec4899';
        highlightWinningCells(gameState, currentPlayer);
        gameActive = false;
        
        if (currentPlayer === HUMAN_PLAYER) {
            triggerConfetti();
        } else {
            setTimeout(() => {
                sadOverlay.classList.add('show');
            }, 600);
        }
        
        return true;
    }

    if (checkDraw(gameState)) {
        statusText.innerHTML = drawMessage();
        statusText.style.color = '#334155';
        gameActive = false;
        return true;
    }

    currentPlayer = currentPlayer === HUMAN_PLAYER ? AI_PLAYER : HUMAN_PLAYER;
    statusText.innerHTML = currentPlayerTurn();
    statusText.style.color = currentPlayer === HUMAN_PLAYER ? '#0ea5e9' : '#ec4899';
    return false;
}

function getAvailableMoves(boardState) {
    return boardState.map((cell, index) => cell === '' ? index : null).filter(val => val !== null);
}

// Minimax algorithm for unbeatable AI
function minimax(boardState, depth, isMaximizing) {
    if (checkWin(boardState, AI_PLAYER)) return 10 - depth;
    if (checkWin(boardState, HUMAN_PLAYER)) return depth - 10;
    if (checkDraw(boardState)) return 0;

    const availableMoves = getAvailableMoves(boardState);

    if (isMaximizing) {
        let bestScore = -Infinity;
        for (let i = 0; i < availableMoves.length; i++) {
            const move = availableMoves[i];
            boardState[move] = AI_PLAYER;
            const score = minimax(boardState, depth + 1, false);
            boardState[move] = '';
            bestScore = Math.max(score, bestScore);
        }
        return bestScore;
    } else {
        let bestScore = Infinity;
        for (let i = 0; i < availableMoves.length; i++) {
            const move = availableMoves[i];
            boardState[move] = HUMAN_PLAYER;
            const score = minimax(boardState, depth + 1, true);
            boardState[move] = '';
            bestScore = Math.min(score, bestScore);
        }
        return bestScore;
    }
}

// AI Turn Logic Based on Difficulty
function makeAIMove() {
    if (!gameActive) return;

    const difficulty = difficultySelect.value;
    const availableMoves = getAvailableMoves(gameState);
    let bestMove;

    if (difficulty === 'easy') {
        // Random move
        const randomIndex = Math.floor(Math.random() * availableMoves.length);
        bestMove = availableMoves[randomIndex];
    } else if (difficulty === 'medium') {
        // 50% chance optimal, 50% chance random
        if (Math.random() < 0.5) {
            bestMove = getBestMove(gameState);
        } else {
            const randomIndex = Math.floor(Math.random() * availableMoves.length);
            bestMove = availableMoves[randomIndex];
        }
    } else {
        // Hard: 100% optimal move via MiniMax
        bestMove = getBestMove(gameState);
    }

    // Simulate thinking time for better user experience
    setTimeout(() => {
        handleCellPlayed(bestMove, AI_PLAYER);
        handleResultValidation();
    }, 500);
}

function getBestMove(boardState) {
    let bestScore = -Infinity;
    let move;
    const availableMoves = getAvailableMoves(boardState);

    // Speed up first move if AI starts (not applicable since Human always starts for now, but good for completeness)
    if (availableMoves.length === 9) {
        return Math.floor(Math.random() * 9);
    }

    for (let i = 0; i < availableMoves.length; i++) {
        const index = availableMoves[i];
        boardState[index] = AI_PLAYER;
        const score = minimax(boardState, 0, false);
        boardState[index] = '';
        if (score > bestScore) {
            bestScore = score;
            move = index;
        }
    }
    return move;
}

function handleCellClick(clickedCellEvent) {
    if (!gameActive || currentPlayer === AI_PLAYER) return;

    const clickedCell = clickedCellEvent.target;
    const clickedCellIndex = parseInt(clickedCell.getAttribute('data-index'));

    if (gameState[clickedCellIndex] !== '') return;

    handleCellPlayed(clickedCellIndex, HUMAN_PLAYER);
    const gameEnded = handleResultValidation();

    if (!gameEnded) {
        makeAIMove();
    }
}

function handleRestartGame() {
    gameActive = true;
    currentPlayer = HUMAN_PLAYER;
    gameState = ['', '', '', '', '', '', '', '', ''];
    statusText.innerHTML = currentPlayerTurn();
    statusText.style.color = '#0ea5e9';
    
    cells.forEach(cell => {
        cell.innerHTML = '';
        cell.className = 'cell'; // Reset classes
        cell.style.background = '';
        cell.style.transform = '';
        cell.style.boxShadow = '';
        cell.style.borderColor = '#e2e8f0';
    });
    
    if(sadOverlay) {
        sadOverlay.classList.remove('show');
    }
}

cells.forEach(cell => cell.addEventListener('click', handleCellClick));
resetBtn.addEventListener('click', handleRestartGame);
difficultySelect.addEventListener('change', handleRestartGame); // Restart game when difficulty changes

// Initial color for X
statusText.style.color = '#0ea5e9';
