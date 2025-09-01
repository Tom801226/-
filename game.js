class Minesweeper {
    constructor() {
        this.boardSize = 10;
        this.mineCount = 10;
        this.board = [];
        this.gameOver = false;
        this.firstClick = true;
        this.timer = 0;
        this.timerInterval = null;
        this.flaggedCells = 0;
        this.revealedCells = 0;
        
        this.difficultySettings = {
            easy: { size: 10, mines: 10 },
            medium: { size: 16, mines: 40 },
            hard: { size: 20, mines: 80 }
        };

        this.initElements();
        this.initEventListeners();
        this.newGame();
    }

    initElements() {
        this.gameBoard = document.getElementById('game-board');
        this.timerDisplay = document.getElementById('timer');
        this.minesLeftDisplay = document.getElementById('mines-left');
        this.difficultySelect = document.getElementById('difficulty');
        this.newGameBtn = document.getElementById('new-game');
        this.gameOverModal = document.getElementById('game-over');
        this.resultMessage = document.getElementById('result-message');
        this.playAgainBtn = document.getElementById('play-again');
    }

    initEventListeners() {
        this.newGameBtn.addEventListener('click', () => this.newGame());
        this.playAgainBtn.addEventListener('click', () => this.newGame());
        this.difficultySelect.addEventListener('change', () => this.newGame());
    }

    newGame() {
        const difficulty = this.difficultySelect.value;
        const settings = this.difficultySettings[difficulty];
        this.boardSize = settings.size;
        this.mineCount = settings.mines;
        
        this.resetGameState();
        this.createBoard();
        this.renderBoard();
        this.gameOverModal.classList.add('hidden');
    }

    resetGameState() {
        this.board = [];
        this.gameOver = false;
        this.firstClick = true;
        this.flaggedCells = 0;
        this.revealedCells = 0;
        this.clearTimer();
        this.timer = 0;
        this.updateTimer();
        this.updateMinesLeft();
    }

    createBoard() {
        this.board = Array(this.boardSize).fill().map(() => 
            Array(this.boardSize).fill().map(() => ({
                isMine: false,
                isRevealed: false,
                isFlagged: false,
                adjacentMines: 0
            }))
        );
    }

    placeMines(firstClickRow, firstClickCol) {
        let minesPlaced = 0;
        
        while (minesPlaced < this.mineCount) {
            const row = Math.floor(Math.random() * this.boardSize);
            const col = Math.floor(Math.random() * this.boardSize);
            
            // 确保第一次点击的位置及周围没有地雷
            if ((row === firstClickRow && col === firstClickCol) || 
                (Math.abs(row - firstClickRow) <= 1 && Math.abs(col - firstClickCol) <= 1)) {
                continue;
            }
            
            if (!this.board[row][col].isMine) {
                this.board[row][col].isMine = true;
                minesPlaced++;
            }
        }
        
        this.calculateAdjacentMines();
    }

    calculateAdjacentMines() {
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.board[row][col].isMine) continue;
                
                let count = 0;
                for (let r = Math.max(0, row - 1); r <= Math.min(this.boardSize - 1, row + 1); r++) {
                    for (let c = Math.max(0, col - 1); c <= Math.min(this.boardSize - 1, col + 1); c++) {
                        if (this.board[r][c].isMine) count++;
                    }
                }
                this.board[row][col].adjacentMines = count;
            }
        }
    }

    renderBoard() {
        this.gameBoard.innerHTML = '';
        this.gameBoard.style.gridTemplateColumns = `repeat(${this.boardSize}, 30px)`;
        this.gameBoard.style.gridTemplateRows = `repeat(${this.boardSize}, 30px)`;
        this.gameBoard.style.display = 'grid';
        this.gameBoard.style.gap = '1px';
        
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                cell.addEventListener('click', () => this.handleCellClick(row, col));
                cell.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    this.handleRightClick(row, col);
                });
                
                this.gameBoard.appendChild(cell);
            }
        }
    }

    handleCellClick(row, col) {
        if (this.gameOver || this.board[row][col].isRevealed || this.board[row][col].isFlagged) {
            return;
        }
        
        if (this.firstClick) {
            this.firstClick = false;
            this.placeMines(row, col);
            this.startTimer();
        }
        
        if (this.board[row][col].isMine) {
            this.revealAllMines();
            this.gameOver = true;
            this.endGame(false);
            return;
        }
        
        this.revealCell(row, col);
        
        if (this.checkWin()) {
            this.gameOver = true;
            this.endGame(true);
        }
    }

    handleRightClick(row, col) {
        if (this.gameOver || this.board[row][col].isRevealed) return;
        
        const cell = this.board[row][col];
        const cellElement = this.getCellElement(row, col);
        
        if (cell.isFlagged) {
            cell.isFlagged = false;
            cellElement.classList.remove('flagged');
            this.flaggedCells--;
        } else {
            cell.isFlagged = true;
            cellElement.classList.add('flagged');
            this.flaggedCells++;
        }
        
        this.updateMinesLeft();
    }

    revealCell(row, col) {
        if (row < 0 || row >= this.boardSize || col < 0 || col >= this.boardSize || 
            this.board[row][col].isRevealed || this.board[row][col].isFlagged) {
            return;
        }
        
        const cell = this.board[row][col];
        cell.isRevealed = true;
        this.revealedCells++;
        
        const cellElement = this.getCellElement(row, col);
        cellElement.classList.add('revealed');
        
        if (cell.adjacentMines > 0) {
            cellElement.textContent = cell.adjacentMines;
            cellElement.classList.add(`number-${cell.adjacentMines}`);
        } else {
            // 如果是空白格，递归揭示周围的格子
            for (let r = Math.max(0, row - 1); r <= Math.min(this.boardSize - 1, row + 1); r++) {
                for (let c = Math.max(0, col - 1); c <= Math.min(this.boardSize - 1, col + 1); c++) {
                    if (r !== row || c !== col) {
                        this.revealCell(r, c);
                    }
                }
            }
        }
    }

    getCellElement(row, col) {
        return document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
    }

    revealAllMines() {
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.board[row][col].isMine) {
                    const cellElement = this.getCellElement(row, col);
                    cellElement.classList.add('mine');
                    cellElement.textContent = '💣';
                }
            }
        }
    }

    checkWin() {
        return this.revealedCells === (this.boardSize * this.boardSize - this.mineCount);
    }

    endGame(isWin) {
        this.clearTimer();
        
        if (isWin) {
            this.resultMessage.textContent = `恭喜你赢了！用时: ${this.timer}秒`;
        } else {
            this.resultMessage.textContent = '游戏结束！你踩到地雷了！';
        }
        
        this.gameOverModal.classList.remove('hidden');
    }

    startTimer() {
        this.clearTimer();
        this.timerInterval = setInterval(() => {
            this.timer++;
            this.updateTimer();
        }, 1000);
    }

    clearTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    updateTimer() {
        this.timerDisplay.textContent = this.timer;
    }

    updateMinesLeft() {
        this.minesLeftDisplay.textContent = this.mineCount - this.flaggedCells;
    }
}

// 初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    new Minesweeper();
});