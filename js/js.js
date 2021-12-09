;(function() {
    const PieceType = {
        I: 0,
        L: 1,
        J: 2,
        Z: 3,
        S: 4,
        T: 5,
        O: 6
    };

    const Rotation = {
        Right: 0,
        Left: 1
    };

    const State = {
        Idle: 0,
        Clear: 1,
        Play: 2,
        Line: 3,
        Lose: 4
    };

    const TimerContext = createTimerContext();
    const InputContext = createInputContext();

    const fieldContext = createFieldContext("field", 10);

    let state = State.Idle;
    let figure = {};
    let figureNext = {};

    let glass = [
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    ];

    let score = 0;
    let lines = 0;
    let level = 0;

    const BaseGameInterval = 1000;
    const LinesPerLevel = 10;
    const MaxLevel = 20;

    const PointsForOneLine = 100;
    const PointsForTwoLines = 200;
    const PointsForThreeLines = 500;
    const PointsForFourLines = 1000;

    const StartSound = new  Audio("assets/start.mp3");
    const EndSound = new  Audio("assets/gameover.mp3");
    const RotateSound = new  Audio("assets/rotate.mp3");
    const FallSound = new  Audio("assets/drop.mp3");
    const LineSound = new  Audio("assets/line.mp3");

    let clearLine = 19;

    //------------------------------------

    let fieldObject = createFieldObject();
    let nextObject = createNextObject();

    let stateObject = createStateObject();
    let scoreObject = createScoreObject();
    let linesObject = createLinesObject();
    let levelObject = createLevelObject();

    //------------------------------------

    function gameLoop(time) {
        window.requestAnimationFrame(gameLoop);

        update();
        render();

        InputContext.clear();
        TimerContext.update(time);
    }

    function update() {
        scoreObject.update();
        linesObject.update();
        levelObject.update();

        switch(state)
        {
            case State.Idle:
                if(InputContext.start) {
                    state = State.Clear;

                    EndSound.pause();
                    EndSound.currentTime = 0;

                    StartSound.volume = 0.2;
                    StartSound.play();
                }

                break;

            case State.Clear:
                if(clearLine === -21) {
                    clearLine = 19;

                    newGame();

                    state = State.Play;
                } else {
                    if(clearLine >= 0) {
                        glass[clearLine] = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
                    } else {
                        glass[-clearLine - 1] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                    }

                    clearLine--;
                }

                break;

            case State.Play:
                figure.y++;

                if(hasCollisions(figure) && figure.y < 0) {
                    state = State.Lose;

                    EndSound.volume = 0.2;
                    EndSound.play();

                    return;
                }
                else
                {
                    figure.y--;
                }

                if(InputContext.left) {
                    figure.x--;

                    if(hasCollisions(figure)) {
                        figure.x++;
                    }
                }

                if(InputContext.right) {
                    figure.x++;

                    if(hasCollisions(figure)) {
                        figure.x--;
                    }
                }

                if(InputContext.top) {
                    figure.rotate(Rotation.Right);

                    if(hasCollisions(figure)) {
                        figure.rotate(Rotation.Left);
                    } else {
                        RotateSound.volume = 0.2;
                        RotateSound.play();
                    }
                }

                if(gameTimer.time() || InputContext.bottom) {
                    figure.y++;

                    if(hasCollisions(figure)) {
                        figure.y--;

                        putFigure();

                        FallSound.pause();
                        FallSound.currentTime = 0;

                        FallSound.volume = 0.2;
                        FallSound.play();

                        score += 50;

                        this.fullLines = getFullLines();

                        if(this.fullLines.length > 0) {
                            this.lineX = 0;

                            state = State.Line;

                            LineSound.volume = 0.2;
                            LineSound.play();
                        } else {
                            nextFigure();
                        }
                    }
                }

                break;

            case State.Line:
                if(this.lineX === 10) {
                    state = State.Play;

                    nextFigure();

                    glass = glass.filter((line, index) => !this.fullLines.some(x => x === index));

                    let count = this.fullLines.length;

                    for (let i = 0; i < count; ++i) {
                        glass.unshift([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
                    }

                    lines += count;

                    switch(count)
                    {
                        case 1:
                            score += PointsForOneLine;
                            break;
                        case 2:
                            score += PointsForTwoLines;
                            break;
                        case 3:
                            score += PointsForThreeLines;
                            break;
                        case 4:
                            score += PointsForFourLines;
                            break;
                        default:
                            break;
                    }

                    let newLevel = Math.min(MaxLevel, Math.floor(lines / LinesPerLevel));

                    if(level !== newLevel) {
                        level = newLevel;
                        gameTimer = TimerContext.create(Math.floor(BaseGameInterval / (1 + level / 5)));
                    }

                } else {
                    for (const line of this.fullLines) {
                        glass[line][this.lineX] = 0;
                    }

                    this.lineX++;
                }

                break;

            case State.Lose:
                if(InputContext.start) {
                    state = State.Clear;

                    EndSound.pause();
                    EndSound.currentTime = 0;

                    StartSound.volume = 0.2;
                    StartSound.play();
                }

                break;
        }

        stateObject.set(state);
        scoreObject.set(score);
        linesObject.set(lines);
        levelObject.set(level);
    }

    function render() {
        stateObject.draw();
        scoreObject.draw();
        linesObject.draw();
        levelObject.draw();

        switch(state) {
            case State.Idle:
                break;

            case State.Clear:
                fieldContext.clear();

                drawGlass();

                break;

            case State.Play:
                fieldContext.clear();

                drawFigure();
                nextObject.draw();
                drawGlass();

                break;

            case State.Line:
                fieldContext.clear();
                drawGlass();

                break;

            case State.Lose:
                break;
        }
    }

    window.requestAnimationFrame(gameLoop);

    //---Utils-----

    function createTimerContext() {
        let now = 0;

        return {
            create: function(timeout) {
                let next = now + timeout;

                return {
                    time: function() {
                        if(now > next) {
                            next = now + timeout;

                            return true;
                        }
                    }
                };
            },

            update: function(time) {
                now = time;
            }
        };
    }

    function createInputContext() {
        const state = {
            start: false,
            left: false,
            right: false,
            top: false,
            bottom: false,

            clear: function() {
                this.start = false;
                this.left = false;
                this.right = false;
                this.top = false;
                this.bottom = false;
            }
        }

        window.addEventListener("keydown", onKeydown, true);

        function onKeydown(e) {
            switch (e.code) {
                case "KeyE":
                    state.start = true;
                    break;
                case "KeyA":
                    state.left = true;
                    break;
                case "KeyD":
                    state.right = true;
                    break;
                case "KeyW":
                    state.top = true;
                    break;
                case "KeyS":
                    state.bottom = true;
                    break;
                default:
                    break;
            }
        }

        return state;
    }

    //---Utils-----

    //---Objects-----

    function createFieldObject() {
        const $next = document.getElementById("next");
        const $cells = $next.getElementsByClassName("cell");

        const width = 4;

        let piece;

        function clear() {
            for (let $cell of $cells) {
                $cell.classList.remove("cell-on");

                for(let color = 0; color < 8; ++color) {
                    $cell.classList.remove(`cell-on-${color}`);
                }
            }
        }

        function drawPoint(x, y, color) {
            const index = y * width + x;
            const $cell = $cells[index];

            if($cell) {
                if(color) {
                    $cell.classList.add(`cell-on-${color}`);
                } else {
                    $cell.classList.add("cell-on");
                }
            }
        }

        return {
            update: function() {
            },

            draw: function() {
                clear();

                for(let y = 0; y < 4; ++y) {
                    for(let x = 0; x < 4; ++x) {
                        if(piece.points[y][x] === 1) {
                            drawPoint(x, y);
                        }
                    }
                }
            },

            piece: function(value) {
                piece = value;
            }
        };
    }

    function createNextObject() {
        const $next = document.getElementById("next");
        const $cells = $next.getElementsByClassName("cell");

        const width = 4;

        let piece;

        function clear() {
            for (let $cell of $cells) {
                $cell.classList.remove("cell-on");

                for(let color = 0; color < 8; ++color) {
                    $cell.classList.remove(`cell-on-${color}`);
                }
            }
        }

        function drawPoint(x, y, color) {
            const index = y * width + x;
            const $cell = $cells[index];

            if($cell) {
                if(color) {
                    $cell.classList.add(`cell-on-${color}`);
                } else {
                    $cell.classList.add("cell-on");
                }
            }
        }

        return {
            update: function() {
            },

            draw: function() {
                clear();

                for(let y = 0; y < 4; ++y) {
                    for(let x = 0; x < 4; ++x) {
                        if(piece.points[y][x] === 1) {
                            drawPoint(x, y, piece.color);
                        }
                    }
                }
            },

            piece: function(value) {
                piece = value;
            }
        };
    }

    function createStateObject() {
        const $state = document.getElementById("state");

        let state;

        return {
            update: function() {
            },

            draw: function() {
                switch(state) {
                    case State.Idle:
                        $state.textContent = "Idle";
                        break;
                    case State.Clear:
                        $state.textContent = "Clear";
                        break;
                    case State.Play:
                        $state.textContent = "Play";
                        break;
                    case State.Line:
                        $state.textContent = "Line";
                        break;
                    case State.Lose:
                        $state.textContent = "Lose";
                        break;
                }
            },

            set: function(value) {
                state = value;
            }
        };
    }

    function createScoreObject() {
        const $score = document.getElementById("score");

        const step = 10;

        let score = 0;
        let next = 0;

        return {
            update: function() {
                if(score > next) {
                    score = Math.max(next, score - step);

                    return;
                }

                if(score < next) {
                    score = Math.min(next, score + step);
                }
            },

            draw: function() {
                $score.textContent = score;
            },

            set: function(value) {
                next = value;
            },

            clear: function() {
                score = 0;
            }
        };
    }

    function createLinesObject() {
        const $lines = document.getElementById("lines");

        const step = 1;

        let lines = 0;
        let next = 0;

        return {
            update: function() {
                if(lines > next) {
                    lines = Math.max(next, lines - step);

                    return;
                }

                if(lines < next) {
                    lines = Math.min(next, lines + step);
                }
            },

            draw: function() {
                $lines.textContent = lines;
            },

            set: function(value) {
                next = value;
            },

            clear: function() {
                lines = 0;
            }
        };
    }

    function createLevelObject() {
        const $level = document.getElementById("level");

        const step = 1;

        let level = 0;
        let next = 0;

        return {
            update: function() {
                if(level > next) {
                    lines = Math.max(next, level - step);

                    return;
                }

                if(level < next) {
                    level = Math.min(next, level + step);
                }
            },

            draw: function() {
                $level.textContent = level;
            },

            set: function(value) {
                next = value;
            },

            clear: function() {
                level = 0;
            }
        };
    }

    //---Objects-----

    function createFieldContext(name, width) {
        const $container = document.getElementById(name);
        const $cells = $container.getElementsByClassName("cell");

        return {
            clear: function() {
                for (let $cell of $cells) {
                    $cell.classList.remove("cell-on");
                    $cell.classList.remove("cell-on-0");
                    $cell.classList.remove("cell-on-1");
                    $cell.classList.remove("cell-on-2");
                    $cell.classList.remove("cell-on-3");
                    $cell.classList.remove("cell-on-4");
                    $cell.classList.remove("cell-on-5");
                    $cell.classList.remove("cell-on-6");
                    $cell.classList.remove("cell-on-7");
                }
            },

            drawPoint: function(x, y, color) {
                const index = y * width + x;
                const $cell = $cells[index];

                if($cell) {
                    if(color) {
                        $cell.classList.add(`cell-on-${color}`);
                    } else {
                        $cell.classList.add("cell-on");
                    }
                }
            }
        };
    }

    function randomType() {
        const types = [PieceType.I, PieceType.L, PieceType.J, PieceType.Z, PieceType.S, PieceType.T, PieceType.O];

        return types[Math.floor(Math.random() * types.length)];
    }

    function createFigure(type, x, y) {
        if(type === PieceType.I) {
            function figureI() {
                const variants = [
                    [
                        [0, 1, 0, 0],
                        [0, 1, 0, 0],
                        [0, 1, 0, 0],
                        [0, 1, 0, 0]
                    ],
                    [
                        [0, 0, 0, 0],
                        [1, 1, 1, 1],
                        [0, 0, 0, 0],
                        [0, 0, 0, 0]
                    ]
                ];

                let variant = Math.floor(Math.random() * variants.length);

                return {
                    x: x,
                    y: y,
                    points: variants[variant],
                    color: 1,

                    rotate: function(rotation) {
                        if(rotation === Rotation.Right) {
                            variant++;
                        } else {
                            variant--;
                        }

                        if(variant === -1) {
                            variant = variants.length - 1;
                        }

                        if(variant === variants.length) {
                            variant = 0;
                        }

                        this.points = variants[variant];
                    }
                };
            }

            return figureI();
        }

        if(type === PieceType.L) {
            function figureL() {
                const variants = [
                    [
                        [0, 0, 0, 0],
                        [0, 1, 0, 0],
                        [0, 1, 0, 0],
                        [0, 1, 1, 0]
                    ],
                    [
                        [0, 0, 0, 0],
                        [0, 0, 0, 0],
                        [1, 1, 1, 0],
                        [1, 0, 0, 0]
                    ],
                    [
                        [0, 0, 0, 0],
                        [1, 1, 0, 0],
                        [0, 1, 0, 0],
                        [0, 1, 0, 0]
                    ],
                    [
                        [0, 0, 0, 0],
                        [0, 0, 1, 0],
                        [1, 1, 1, 0],
                        [0, 0, 0, 0]
                    ]
                ];

                let variant = Math.floor(Math.random() * variants.length);

                return {
                    x: x,
                    y: y,
                    points: variants[variant],
                    color: 2,

                    rotate: function(rotation) {
                        if(rotation === Rotation.Right) {
                            variant++;
                        } else {
                            variant--;
                        }

                        if(variant === -1) {
                            variant = variants.length - 1;
                        }

                        if(variant === variants.length) {
                            variant = 0;
                        }

                        this.points = variants[variant];
                    }
                };
            }

            return figureL();
        }

        if(type === PieceType.J) {
            function figureJ() {
                const variants = [
                    [
                        [0, 0, 0, 0],
                        [0, 1, 0, 0],
                        [0, 1, 0, 0],
                        [1, 1, 0, 0]

                    ],
                    [
                        [0, 0, 0, 0],
                        [1, 0, 0, 0],
                        [1, 1, 1, 0],
                        [0, 0, 0, 0]
                    ],
                    [
                        [0, 0, 0, 0],
                        [0, 1, 1, 0],
                        [0, 1, 0, 0],
                        [0, 1, 0, 0]
                    ],
                    [
                        [0, 0, 0, 0],
                        [0, 0, 0, 0],
                        [1, 1, 1, 0],
                        [0, 0, 1, 0]
                    ]
                ];

                let variant = Math.floor(Math.random() * variants.length);

                return {
                    x: x,
                    y: y,
                    points: variants[variant],
                    color: 3,

                    rotate: function(rotation) {
                        if(rotation === Rotation.Right) {
                            variant++;
                        } else {
                            variant--;
                        }

                        if(variant === -1) {
                            variant = variants.length - 1;
                        }

                        if(variant === variants.length) {
                            variant = 0;
                        }

                        this.points = variants[variant];
                    }
                };
            }

            return figureJ();
        }

        if(type === PieceType.Z) {
            function figureZ() {
                const variants = [
                    [
                        [0, 0, 0, 0],
                        [1, 1, 0, 0],
                        [0, 1, 1, 0],
                        [0, 0, 0, 0]
                    ],
                    [
                        [0, 1, 0, 0],
                        [1, 1, 0, 0],
                        [1, 0, 0, 0],
                        [0, 0, 0, 0]
                    ]
                ];

                let variant = Math.floor(Math.random() * variants.length);

                return {
                    x: x,
                    y: y,
                    points: variants[variant],
                    color: 4,

                    rotate: function(rotation) {
                        if(rotation === Rotation.Right) {
                            variant++;
                        } else {
                            variant--;
                        }

                        if(variant === -1) {
                            variant = variants.length - 1;
                        }

                        if(variant === variants.length) {
                            variant = 0;
                        }

                        this.points = variants[variant];
                    }
                };
            }

            return figureZ();
        }

        if(type === PieceType.S) {
            function figureS() {
                const variants = [
                    [
                        [0, 0, 0, 0],
                        [0, 1, 1, 0],
                        [1, 1, 0, 0],
                        [0, 0, 0, 0]
                    ],
                    [
                        [0, 1, 0, 0],
                        [0, 1, 1, 0],
                        [0, 0, 1, 0],
                        [0, 0, 0, 0]
                    ]
                ];

                let variant = Math.floor(Math.random() * variants.length);

                return {
                    x: x,
                    y: y,
                    points: variants[variant],
                    color: 5,

                    rotate: function(rotation) {
                        if(rotation === Rotation.Right) {
                            variant++;
                        } else {
                            variant--;
                        }

                        if(variant === -1) {
                            variant = variants.length - 1;
                        }

                        if(variant === variants.length) {
                            variant = 0;
                        }

                        this.points = variants[variant];
                    }
                };
            }

            return figureS();
        }

        if(type === PieceType.T) {
            function figureT() {
                const variants = [
                    [
                        [0, 0, 0, 0],
                        [0, 1, 0, 0],
                        [1, 1, 1, 0],
                        [0, 0, 0, 0]
                    ],
                    [
                        [0, 0, 0, 0],
                        [0, 1, 0, 0],
                        [0, 1, 1, 0],
                        [0, 1, 0, 0]

                    ],
                    [
                        [0, 0, 0, 0],
                        [0, 0, 0, 0],
                        [1, 1, 1, 0],
                        [0, 1, 0, 0]
                    ],
                    [
                        [0, 0, 0, 0],
                        [0, 1, 0, 0],
                        [1, 1, 0, 0],
                        [0, 1, 0, 0]
                    ]
                ];

                let variant = Math.floor(Math.random() * variants.length);

                return {
                    x: x,
                    y: y,
                    points: variants[variant],
                    color: 6,

                    rotate: function(rotation) {
                        if(rotation === Rotation.Right) {
                            variant++;
                        } else {
                            variant--;
                        }

                        if(variant === -1) {
                            variant = variants.length - 1;
                        }

                        if(variant === variants.length) {
                            variant = 0;
                        }

                        this.points = variants[variant];
                    }
                };
            }

            return figureT();
        }

        if(type === PieceType.O) {
            return {
                x: x,
                y: y,
                points: [
                    [0, 0, 0, 0],
                    [0, 1, 1, 0],
                    [0, 1, 1, 0],
                    [0, 0, 0, 0]
                ],
                color: 7,

                rotate: function() {}
            };
        }
    }

    function drawFigure() {
        fieldContext.clear();

        for(let y = 0; y < 4; ++y) {
            for(let x = 0; x < 4; ++x) {
                if(figure.points[y][x] === 1) {
                    fieldContext.drawPoint(x + figure.x, y + figure.y, figure.color);
                }
            }
        }
    }

    function drawGlass() {
        for(let y = 0; y < 20; ++y) {
            for(let x = 0; x < 10; ++x) {
                if(glass[y][x] === 1) {
                    fieldContext.drawPoint(x, y);
                }
            }
        }
    }

    function newGame() {
        fieldObject = createFieldObject();
        nextObject = createNextObject();

        const typeNext = randomType();

        figureNext = createFigure(typeNext, 3, -2);

        nextFigure();

        score = 0;
        lines = 0;
        level = 0;

        gameTimer = TimerContext.create(BaseGameInterval);

        scoreObject.clear();
        linesObject.clear();
        levelObject.clear();
    }

    function nextFigure() {
        const typeNext = randomType();

        figure = figureNext;
        figureNext = createFigure(typeNext, 3, -2);

        nextObject.piece(figureNext);
    }

    function putFigure() {
        for(let y = 0; y < 4; ++y) {
            for(let x = 0; x < 4; ++x) {
                if(figure.points[y][x] === 1) {
                    if(figure.y + y >= 0 && figure.x + x >= 0) {
                        glass[y + figure.y][x + figure.x] = 1;
                    }
                }
            }
        }
    }

    function hasCollisions(figure) {
        for(let y = 0; y < 4; ++y) {
            for(let x = 0; x < 4; ++x) {
                if(figure.points[y][x] === 1) {
                    if(figure.x + x < 0 || figure.x + x >= 10 || figure.y + y >= 20) {
                        return true;
                    }

                    if(figure.y + y >= 0 && figure.x + x >= 0) {
                        if(glass[figure.y + y][figure.x + x] === 1) {
                            return true;
                        }
                    }
                }
            }
        }

        return false;
    }

    function getFullLines() {
        return glass
            .map((line, index) => ({ full: line.every(element => element === 1), index: index }))
            .filter(x => x.full)
            .map(x => x.index);
    }
})();