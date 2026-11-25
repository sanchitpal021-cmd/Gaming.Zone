// GameZone - script.js

document.addEventListener('DOMContentLoaded', () => {

    const $ = (selector, root = document) =>
        root.querySelector(selector);

    const $$ = (selector, root = document) =>
        [...root.querySelectorAll(selector)];

    const safeGet = (key, fallback) => {
        try {
            const value = localStorage.getItem(key);
            return value === null ? fallback : JSON.parse(value);
        } catch {
            return fallback;
        }

    };

    const save = (key, value) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch { }
    };

    //Theme Toggle

    const themeButton = $('#themeButton');

    if (safeGet('gamezone-dark', false)) {
        document.body.classList.add('dark-theme');
    }

    const updateThemeButton = () => {
        if (themeButton) {
            themeButton.textContent =
                document.body.classList.contains('dark-theme')
                    ? '☀️'
                    : '🌙';
        }
    };

    updateThemeButton();

    themeButton?.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');

        save(
            'gamezone-dark',
            document.body.classList.contains('dark-theme')
        );

        updateThemeButton();
    });

    //Scoreboard

    const stats = {
        ticWins: safeGet('gamezone-tic-wins', 0),
        snakeBest: safeGet('gamezone-snake-best', 0),
        rpsWins: safeGet('gamezone-rps-wins', 0),
    };

    const renderStats = () => {
        $('#ticWins').textContent = stats.ticWins;
        $('#snakeBest').textContent = stats.snakeBest;
        $('#rpsWins').textContent = stats.rpsWins;
    };

    const addStat = (name) => {
        stats[name]++;

        save(
            `gamezone-${name.replace(/[A-Z]/g, m => '-' + m.toLowerCase())}`,
            stats[name]
        );

        renderStats();
    };

    renderStats();

    //Game Navigation

    const arcade = $('.arcade-section');
    const gameTitle = $('#gameTitle');

    const screens = {
        tic: $('#ticGame'),
        snake: $('#snakeGame'),
        rps: $('#rpsGame')
    };

    let currentGame = 'tic';

    const showGame = (game) => {
        if (!screens[game]) return;

        currentGame = game;

        Object.entries(screens).forEach(([name, screen]) => {
            screen.classList.toggle('hidden', name !== game);
        });

        gameTitle.textContent =
            game === 'tic'
                ? 'Tic-Tac-Toe'
                : game === 'snake'
                    ? 'Snake Rush'
                    : 'Rock Paper Scissors';

        arcade.classList.remove('hidden');

        arcade.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });


        if (game === 'snake') drawSnake();
    };

    $$('.play-button, .play-button').forEach(button => {
        button.addEventListener('click', () => {
            showGame(button.dataset.game);
        });
    });

    $('#closeGame')?.addEventListener('click', () => {
        stopSnake();

        arcade.classList.add('hidden');

        $('#games').scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    });

    //Tic Tac Toe

    const ticCells = $$('.tic-cell');
    const ticStatus = $('#ticStatus');

    let ticBoard = Array(9).fill('');
    let ticTurn = 'X';
    let ticFinished = false;

    const winningLines = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6]
    ];

    const reseTic = () => {
        ticBoard = Array(9).fill('');
        ticTurn = 'X'
        ticFinished = false;

        ticCells.forEach(cell => {
            cell.textContent = '';
            cell.disabled = false;
            cell.classList.remove('winner');
        });

        ticStatus.textContent = "Player x's turn";
    };

    const checkTicWinner = () =>
        winningLines.find(line =>
            line.every(index => ticBoard[index] === ticTurn)
        );

    ticCells.forEach(cell => {

        cell.addEventListener('click', () => {

            const index = Number(cell.dataset.cell);

            if (ticFinished || ticBoard[index]) return;

            ticBoard[index] = ticTurn;
            cell.textContent = ticTurn;
            cell.disabled = true;

            const line = checkTicWinner();

            if (line) {

                ticFinished = true;

                line.forEach(i =>
                    ticCells[i].classList.add('winner')
                );

                ticStatus.textContent =
                    `Player ${ticTurn} wins! 🎉`;

                if (ticTurn === 'X') {
                    addStat('ticWins');
                }

                ticCells.forEach(c => c.disabled = true);

            } else if (ticBoard.every(Boolean)) {

                ticFinished = true;
                ticStatus.textContent = "It's a draw! 🤝";

            } else {

                ticTurn = ticTurn === 'X' ? 'O' : 'X';

                ticStatus.textContent =
                    `Player ${ticTurn}'s turn`;
            }

        });

    });


    $('#ticReset')?.addEventListener('click', reseTic);


    //Snake Rush

    const canvas = $('#snakeCanvas');
    const ctx = canvas?.getContext('2d');

    const gridSize = 20;
    const tileCount = canvas ? canvas.width / gridSize : 20;

    let snake = [
        { x: 10, y: 10 },
        { x: 9, y: 10 },
        { x: 8, y: 10 },
    ];

    let food = { x: 15, y: 10 };

    let direction = { x: 1, y: 0 };
    let nextDirection = { x: 1, y: 0 };

    let snakeScore = 0;
    let snakeTimer = null;
    let snakeRunning = false;

    const randomFood = () => {

        let candidate;

        do {
            candidate = {
                x: Math.floor(Math.random() * tileCount),
                y: Math.floor(Math.random() * tileCount)
            };

        } while (
            snake.some(part =>
                part.x === candidate.x &&
                part.y === candidate.y
            )
        );

        return candidate;
    };


    function drawSnake() {

        if (!ctx) return;

        ctx.fillStyle = '#10251e'

        ctx.fillRect(
            0,
            0,
            canvas.width,
            canvas.height
        );


        //Food

        ctx.fillStyle = '#f5a623'

        ctx.beginPath();

        ctx.arc(
            food.x * gridSize + gridSize / 2,
            food.y * gridSize + gridSize / 2,
            gridSize / 2 - 2,
            0,
            Math.PI * 2
        );

        ctx.fill();

        //Snake

        snake.forEach((part, index) => {

            ctx.fillStyle =
                index === 0
                    ? '#8df0a8'
                    : '#36c979';

            ctx.fillRect(
                part.x * gridSize + 1,
                part.y * gridSize + 1,
                gridSize - 2,
                gridSize - 2
            );

        });

    }


    const uptadeSnakeScore = () => {
        $('#snakeScore').textContent = snakeScore;
    };


    function resetSnake() {

        stopSnake();

        snake = [
            { x: 10, y: 10 },
            { x: 9, y: 10 },
            { x: 8, y: 10 }
        ];

        food = randomFood();

        direction = { x: 1, y: 0 };
        nextDirection = { x: 1, y: 0 };

        snakeScore = 0;

        uptadeSnakeScore();
        drawSnake();
    }

    function stopSnake() {

        if (snakeTimer) {
            clearInterval(snakeTimer);
        }

        snakeTimer = null;
        snakeRunning = false;
    }

    function snakeStep() {

        direction = nextDirection;

        const head = {
            x: snake[0].x + direction.x,
            y: snake[0].y + direction.y
        };

        const eating =
            head.x === food.x &&
            head.y === food.y;

        const bodyToCheck =
            eating ? snake : snake.slice(0, -1); 4


        // Collision Detection

        if (
            head.x < 0 ||
            head.y < 0 ||
            head.x >= tileCount ||
            head.y >= tileCount ||
            bodyToCheck.some(part =>
                part.x === head.x &&
                part.y === head.y
            )
        ) {

            stopSnake();

            $('#snakeStart').textContent = 'Play Again';

            if (snakeScore > stats.snakeBest) {

                stats.snakeBest = snakeScore;

                save(
                    'gamezone-snake-best',
                    stats.snakeBest
                );

                renderStats();
            }

            $('#snakeGame .game-status').textContent =
                `Game over! Final scorel ${snakeScore}`;


            return;
        }

        snake.unshift(head);

        if (eating) {
            snakeScore += 10;

            uptadeSnakeScore();

            food = randomFood();

        } else {

            snake.pop();
        }

        drawSnake();
    }

    $('#snakeStart')?.addEventListener('click', () => {

        if (snakeRunning) return;

        resetSnake();

        snakeRunning = true;

        $('#snakeStart').textContent = 'Playing...';

        $('#snakeGame .game-status').textContent =
            'Use arrow keys or WASD to move.';

        snakeTimer = setInterval(snakeStep, 125);

    });


    //Snake Direction

    const setSnakeDirection = (name) => {
    const directions = {
        up: { x: 0, y: -1 },
        down: { x: 0, y: 1 },
        left: { x: -1, y: 0 },
        right: { x: 1, y: 0 }
    };

    const chosen = directions[name];

    if (!chosen) return;

    if (
        chosen.x !== -direction.x ||
        chosen.y !== -direction.y
    ) {
        nextDirection = chosen;
    }
};
    
    //Keyboard Controls

    document.addEventListener('keydown', event => {

        const keyMap = {

            ArrowUp: 'up',
            w: 'up',
            W: 'up',

            ArrowDown: 'down',
            s: 'down',
            S: 'down',

            ArrowLeft: 'left',
            a: 'left',
            A: 'left',

            ArrowRight: 'right',
            d: 'right',
            D: 'right'

        };

        const move = keyMap[event.key];

        if (
            move &&
            currentGame === 'snake' &&
            !screens.snake.classList.contains('hidden')
        ) {

            event.preventDefault();

            setSnakeDirection(move);
        }

    });


    // Mobile Snake Controls

    $$('.snake-control button').forEach(button => {

        button.addEventListener('click', () => {

            setSnakeDirection(button.dataset.direction);

        });

    });

    resetSnake();


    // Rock Paper Scissors           

    let playerScore = 0;
    let computerScore = 0;

    const scoreRps = () => {

        $('#playerScore').textContent = playerScore;

        $('#computerScore').textContent = computerScore;

    };

    const rpsMoves = [
        'rock',
        'paper',
        'scissors'
    ];

    const moveEmoji = {
        rock: '✊',
        paper: '✋',
        scissors: '✌️'
    };

    $$('.rps-choice').forEach(button => {

        button.addEventListener('click', () => {

            const player = button.dataset.choice;

            const computer =
                rpsMoves[
                Math.floor(Math.random() * rpsMoves.length)
                ];

            let message;

            if (player === computer) {


                message = "It's a draw!";

            } else if (

                (player === 'rock' && computer === 'scissors') ||

                (player === 'paper' && computer === 'rock') ||

                (player === 'scissors' && computer === 'paper')

            ) {

                playerScore++;

                message = 'You Win this round! 🎉';

                addStat('rpsWins');

            } else {

                computerScore++;

                message = 'Computer wins this round!';

            }

            scoreRps();

            $('#rpsResult').textContent =
                `${moveEmoji[player]} You - ${moveEmoji[computer]} Computer. ${message}`

        });

    });

    // Reset Rps Score

    $('#rpsReset')?.addEventListener('click', () => {

        playerScore = 0;
        computerScore =0;

        scoreRps();

        $('#rpsResult').textContent =
          'Your move is waiting...';
    
    });
    
    scoreRps();

});
