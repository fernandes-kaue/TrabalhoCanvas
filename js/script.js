// ========== VARIÁVEIS GLOBAIS ==========
let gameData = null;
let canvas, ctx;
let gameLoop = null;
let gameRunning = false;
let gamePaused = false;

let config = {
    gridWidth: 20,
    gridHeight: 20,
    cellSize: 25,
    speed: 150,
    colors: {},
    pointsNormal: 10,
    pointsSpecial: 50
};

let snake = [];
let direction = {x: 1, y: 0};
let nextDirection = {x: 1, y: 0};
let food = {x: 0, y: 0};
let specialFood = null;
let score = 0;
let highScore = 0;
let foodEaten = 0;
let specialEaten = 0;
let currentLevel = 1;
let levels = [];

// ========== INICIALIZAÇÃO ==========
$(document).ready(function () {
    highScore = localStorage.getItem('snakeHighScore') || 0;
    $('#loadExampleBtn').show();

    // Handler para seleção de arquivo
    $('#xmlFileInput').change(function (e) {
        const file = e.target.files[0];
        if (file) {
            $('#fileName').text(file.name);
            $('#fileSize').text((file.size / 1024).toFixed(2) + ' KB');
            $('#fileInfo').show();
            $('#loadGameBtn').show();
            $('#errorMessage').hide();
        }
    });
});

// ========== OPERAÇÃO 1: CARREGAR E LER ARQUIVO XML ==========
function loadGameFromFile() {
    const fileInput = document.getElementById('xmlFileInput');
    const file = fileInput.files[0];

    if (!file) {
        showError('Nenhum arquivo selecionado!');
        return;
    }

    $('#uploadScreen').hide();
    $('#loading').show();

    const reader = new FileReader();

    reader.onload = function (e) {
        try {
            const xmlText = e.target.result;
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, "text/xml");

            const parseError = xmlDoc.querySelector('parsererror');
            if (parseError) {
                throw new Error('XML inválido ou mal formatado');
            }

            if (!xmlDoc.querySelector('jogo')) {
                throw new Error('O XML deve conter um elemento <jogo> raiz');
            }

            gameData = xmlDoc;
            parseGameData();
            initCanvas();

            $('#loading').hide();
            $('#gameContent').show();
            $('#highScore').text(highScore);

        } catch (error) {
            $('#loading').hide();
            showError('Erro ao processar XML: ' + error.message);
            $('#uploadScreen').show();
        }
    };

    reader.onerror = function () {
        $('#loading').hide();
        showError('Erro ao ler o arquivo');
        $('#uploadScreen').show();
    };

    reader.readAsText(file);
}

function showError(message) {
    $('#errorText').text(message);
    $('#errorMessage').show();
}

// ========== OPERAÇÃO 2: PARSEAR XML E CARREGAR CONFIGURAÇÕES ==========
function parseGameData() {
    try {
        const configuracao = gameData.querySelector('configuracao');
        if (!configuracao) {
            throw new Error('Elemento configuracao não encontrado no XML');
        }

        // Ler e validar dimensões
        const novaLargura = parseInt(configuracao.querySelector('largura')?.textContent || 20);
        const novaAltura = parseInt(configuracao.querySelector('altura')?.textContent || 20);
        const novoTamanhoCelula = parseInt(configuracao.querySelector('tamanho_celula')?.textContent || 25);

        if (novaLargura <= 0 || novaAltura <= 0 || novoTamanhoCelula <= 0) {
            throw new Error('Dimensões do grid inválidas');
        }

        // Limitar tamanhos
        config.gridWidth = Math.min(Math.max(novaLargura, 5), 50);
        config.gridHeight = Math.min(Math.max(novaAltura, 5), 50);
        config.cellSize = Math.min(Math.max(novoTamanhoCelula, 10), 40);

        config.speed = parseInt(configuracao.querySelector('velocidade_inicial')?.textContent || 150);

        console.log('Novas dimensões do grid:', {
            width: config.gridWidth,
            height: config.gridHeight,
            cellSize: config.cellSize
        });

        const cores = gameData.querySelector('cores');
        config.colors = {
            background: cores?.querySelector('fundo')?.textContent || '#1a1a2e',
            grid: cores?.querySelector('grade')?.textContent || '#2d3748',
            snake: cores?.querySelector('cobra')?.textContent || '#00ff41',
            snakeHead: cores?.querySelector('cabeca_cobra')?.textContent || '#00cc33',
            food: cores?.querySelector('comida')?.textContent || '#ff0000',
            specialFood: cores?.querySelector('comida_especial')?.textContent || '#ffd700'
        };

        const pontuacao = gameData.querySelector('pontuacao');
        config.pointsNormal = parseInt(pontuacao?.querySelector('comida_normal')?.textContent || 10);
        config.pointsSpecial = parseInt(pontuacao?.querySelector('comida_especial')?.textContent || 50);

        $('#pointsNormal').text(config.pointsNormal);
        $('#pointsSpecial').text(config.pointsSpecial);

        const niveisXML = gameData.querySelectorAll('nivel');
        levels = [];

        if (niveisXML.length > 0) {
            niveisXML.forEach(nivel => {
                levels.push({
                    id: parseInt(nivel.getAttribute('id') || 1),
                    nome: nivel.querySelector('nome')?.textContent || 'Nível',
                    velocidade: parseFloat(nivel.querySelector('velocidade')?.textContent || 1.0)
                });
            });
        } else {
            // Níveis padrão SEM obstáculos
            levels = [
                {id: 1, nome: 'Fácil', velocidade: 1.0},
                {id: 2, nome: 'Médio', velocidade: 1.5},
                {id: 3, nome: 'Difícil', velocidade: 2.0}
            ];
        }

        console.log('Níveis configurados:', levels);

    } catch (error) {
        console.error('Erro ao parsear XML:', error);
        throw error;
    }
}

// ========== OPERAÇÃO 3: INICIALIZAR CANVAS ==========
function initCanvas() {
    try {
        canvas = document.getElementById('gameCanvas');
        if (!canvas) {
            throw new Error('Canvas não encontrado');
        }

        // Calcular tamanho do canvas baseado nas novas dimensões
        const width = config.gridWidth * config.cellSize;
        const height = config.gridHeight * config.cellSize;

        console.log('Configurando canvas:', {width, height, cellSize: config.cellSize});

        canvas.width = width;
        canvas.height = height;
        ctx = canvas.getContext('2d');

        // Ajustar CSS para manter proporção e centralização
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        canvas.style.display = 'block';
        canvas.style.margin = '0 auto';

        // Limpar e redesenhar o grid
        ctx.fillStyle = config.colors.background;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        drawGrid();

    } catch (error) {
        console.error('Erro em initCanvas:', error);
        throw error;
    }
}

// ========== FUNÇÃO DRAWGRID ==========
function drawGrid() {
    if (!ctx) {
        console.error('Contexto do canvas não inicializado');
        return;
    }

    ctx.strokeStyle = config.colors.grid;
    ctx.lineWidth = 1;

    // Desenhar linhas verticais
    for (let x = 0; x <= config.gridWidth; x++) {
        ctx.beginPath();
        ctx.moveTo(x * config.cellSize, 0);
        ctx.lineTo(x * config.cellSize, canvas.height);
        ctx.stroke();
    }

    // Desenhar linhas horizontais
    for (let y = 0; y <= config.gridHeight; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * config.cellSize);
        ctx.lineTo(canvas.width, y * config.cellSize);
        ctx.stroke();
    }
}

// ========== OPERAÇÃO 4: INICIAR JOGO ==========
function startGame() {
    if (gameRunning) return;

    try {
        // Resetar estado do jogo
        gameRunning = false;
        gamePaused = false;
        if (gameLoop) {
            clearInterval(gameLoop);
            gameLoop = null;
        }

        const cobraInicial = gameData.querySelector('cobra_inicial');

        // Obter configuração da cobra ou usar padrões seguros
        let tamanho = 3;
        let startX = Math.floor(config.gridWidth / 2);
        let startY = Math.floor(config.gridHeight / 2);
        let direcaoInicial = 'direita';

        if (cobraInicial) {
            tamanho = parseInt(cobraInicial.querySelector('tamanho')?.textContent || 3);

            // CORREÇÃO: Limitar tamanho máximo para caber no grid
            const maxTamanho = Math.min(config.gridWidth - 2, config.gridHeight - 2, 20);
            tamanho = Math.min(Math.max(tamanho, 2), maxTamanho);

            const posXFromXML = parseInt(cobraInicial.querySelector('posicao_x')?.textContent);
            const posYFromXML = parseInt(cobraInicial.querySelector('posicao_y')?.textContent);

            if (!isNaN(posXFromXML) && !isNaN(posYFromXML)) {
                // CORREÇÃO: Validação mais precisa da posição
                const isValidPosition = (
                    posXFromXML >= tamanho - 1 &&  // Precisa espaço para a cobra
                    posXFromXML < config.gridWidth &&
                    posYFromXML >= 0 &&
                    posYFromXML < config.gridHeight
                );

                if (isValidPosition) {
                    startX = posXFromXML;
                    startY = posYFromXML;
                } else {
                    console.warn('Posição inicial do XML inválida. Usando posição central.');
                }
            }

            direcaoInicial = cobraInicial.querySelector('direcao')?.textContent || 'direita';
        }

        // CORREÇÃO: Resetar cobra com validação de espaço
        snake = [];
        let cobraValida = false;
        let tentativas = 0;

        while (!cobraValida && tentativas < 5) {
            snake = [];
            for (let i = 0; i < tamanho; i++) {
                let posX, posY;

                switch (direcaoInicial) {
                    case 'direita':
                        posX = startX - i;
                        posY = startY;
                        break;
                    case 'esquerda':
                        posX = startX + i;
                        posY = startY;
                        break;
                    case 'cima':
                        posX = startX;
                        posY = startY + i;
                        break;
                    case 'baixo':
                        posX = startX;
                        posY = startY - i;
                        break;
                    default:
                        posX = startX - i;
                        posY = startY;
                }

                // Verificar se a posição é válida
                if (posX >= 0 && posX < config.gridWidth && posY >= 0 && posY < config.gridHeight) {
                    snake.push({x: posX, y: posY});
                } else {
                    // Ajustar posição inicial se necessário
                    startX = Math.floor(config.gridWidth / 2);
                    startY = Math.floor(config.gridHeight / 2);
                    break;
                }
            }

            cobraValida = snake.length === tamanho && !checkCollision(snake[0]);
            tentativas++;
        }

        // CORREÇÃO: Se ainda não conseguir posicionar, usar fallback mínimo
        if (snake.length === 0) {
            console.warn('Usando fallback para posição da cobra');
            const centerX = Math.floor(config.gridWidth / 2);
            const centerY = Math.floor(config.gridHeight / 2);

            for (let i = 0; i < Math.min(3, config.gridWidth - 2); i++) {
                snake.push({x: centerX - i, y: centerY});
            }
        }

        // Definir direção inicial
        switch (direcaoInicial) {
            case 'direita':
                direction = {x: 1, y: 0};
                break;
            case 'esquerda':
                direction = {x: -1, y: 0};
                break;
            case 'cima':
                direction = {x: 0, y: -1};
                break;
            case 'baixo':
                direction = {x: 0, y: 1};
                break;
            default:
                direction = {x: 1, y: 0};
                break;
        }
        nextDirection = {...direction};

        // Verificar se a posição inicial é válida
        if (checkCollision(snake[0])) {
            console.error('Posição inicial da cobra causa colisão! Ajustando...');
            // Tentar posicionar no centro
            snake = [];
            const centerX = Math.floor(config.gridWidth / 2);
            const centerY = Math.floor(config.gridHeight / 2);

            for (let i = 0; i < Math.min(3, config.gridWidth - 2); i++) {
                snake.push({x: centerX - i, y: centerY});
            }

            direction = {x: 1, y: 0};
            nextDirection = {x: 1, y: 0};
        }

        // Resetar estado
        score = 0;
        foodEaten = 0;
        specialEaten = 0;
        specialFood = null;

        console.log('Gerando comida inicial...');
        generateFood();

        // Verificar se a comida foi gerada
        if (!food) {
            console.error('Não foi possível gerar comida inicial!');
            return;
        }

        gameRunning = true;
        gamePaused = false;
        $('#startBtn').prop('disabled', true);
        $('#pauseBtn').prop('disabled', false);
        $('#gameOverOverlay').removeClass('show');
        $('#pausedText').removeClass('show');

        updateStats();

        // Iniciar loop do jogo
        if (gameLoop) clearInterval(gameLoop);

        const levelSpeed = Math.max(50, config.speed / levels[currentLevel - 1].velocidade);
        console.log('Game loop iniciado com velocidade:', levelSpeed);

        gameLoop = setInterval(updateGame, levelSpeed);

        // Desenhar estado inicial
        draw();

    } catch (error) {
        console.error('Erro ao iniciar jogo:', error);
        showError('Erro ao iniciar jogo: ' + error.message);
        restartGame();
    }
}

// ========== OPERAÇÃO 5: ATUALIZAR ESTADO DO JOGO ==========
function updateGame() {
    if (gamePaused || !gameRunning) return;

    try {
        direction = {...nextDirection};

        const head = {...snake[0]};
        head.x += direction.x;
        head.y += direction.y;

        // MODIFICAÇÃO: Efeito "pacman" - aparecer do outro lado quando sair dos limites
        if (head.x < 0) {
            head.x = config.gridWidth - 1;
        } else if (head.x >= config.gridWidth) {
            head.x = 0;
        }

        if (head.y < 0) {
            head.y = config.gridHeight - 1;
        } else if (head.y >= config.gridHeight) {
            head.y = 0;
        }

        // Agora só verifica colisão com próprio corpo (paredes não matam mais)
        if (checkCollision(head)) {
            console.log('Colisão com próprio corpo detectada! Game Over');
            gameOver();
            return;
        }

        snake.unshift(head);

        // Verificar se comeu comida
        if (head.x === food.x && head.y === food.y) {
            console.log('Cabeça na posição da comida normal');
            eatFood(false);
        } else if (specialFood && head.x === specialFood.x && head.y === specialFood.y) {
            console.log('Cabeça na posição da comida especial');
            eatFood(true);
        } else {
            snake.pop(); // Remover cauda apenas se não comeu
        }

        draw();
        updateStats();
    } catch (error) {
        console.error('Erro no game loop:', error);
        gameOver();
    }
}


// ========== OPERAÇÃO 6: COLETAR COMIDA ==========
function eatFood(isSpecial) {
    if (isSpecial) {
        score += config.pointsSpecial;
        specialEaten++;
        console.log('Comeu comida especial! Pontos:', config.pointsSpecial, 'Nova pontuação:', score);
        specialFood = null;
    } else {
        score += config.pointsNormal;
        foodEaten++;
        console.log('Comeu comida normal! Pontos:', config.pointsNormal, 'Nova pontuação:', score);
    }

    // Gerar nova comida
    generateFood();

    // Atualizar high score
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('snakeHighScore', highScore);
        $('#highScore').text(highScore);
        console.log('Novo high score:', highScore);
    }
}

// ========== GERAR COMIDA ==========
function generateFood() {
    let attempts = 0;
    const maxAttempts = config.gridWidth * config.gridHeight * 2;

    // Gerar comida normal - ignorar a comida atual na verificação
    do {
        food = {
            x: Math.floor(Math.random() * config.gridWidth),
            y: Math.floor(Math.random() * config.gridHeight)
        };
        attempts++;
    } while (isPositionOccupied(food, true) && attempts < maxAttempts);

    if (attempts >= maxAttempts) {
        console.warn('Não foi possível encontrar posição para comida normal após', maxAttempts, 'tentativas');
        // Estratégia de fallback: procurar qualquer posição livre
        for (let x = 0; x < config.gridWidth; x++) {
            for (let y = 0; y < config.gridHeight; y++) {
                const testPos = {x, y};
                if (!isPositionOccupied(testPos, true)) {
                    food = testPos;
                    console.log('Comida normal colocada em posição forçada:', food);
                    return;
                }
            }
        }
        console.error('Grid completamente ocupado! Não foi possível gerar comida.');
        return;
    }

    console.log('Nova comida normal gerada em:', food);

    // 20% chance de comida especial
    if (Math.random() < 0.20 && !specialFood) {
        attempts = 0;
        do {
            specialFood = {
                x: Math.floor(Math.random() * config.gridWidth),
                y: Math.floor(Math.random() * config.gridHeight)
            };
            attempts++;
        } while (isPositionOccupied(specialFood, true) && attempts < maxAttempts);

        if (attempts >= maxAttempts) {
            specialFood = null;
            console.warn('Não foi possível encontrar posição para comida especial');
        } else {
            console.log('Nova comida especial gerada em:', specialFood);
        }
    }
}

// ========== OPERAÇÃO 7: DETECTAR COLISÕES ==========
function checkCollision(pos) {
    // MODIFICAÇÃO: Removida a verificação de colisão com paredes
    // Agora só verifica colisão com próprio corpo

    // Colisão com próprio corpo (ignorando a cabeça)
    for (let i = 1; i < snake.length; i++) {
        if (pos.x === snake[i].x && pos.y === snake[i].y) {
            console.log('Colisão com próprio corpo em:', pos);
            return true;
        }
    }

    return false;
}


function isPositionOccupied(pos, ignoreFood = false) {
    // Verificar se a posição está ocupada pela cobra
    for (let segment of snake) {
        if (pos.x === segment.x && pos.y === segment.y) return true;
    }

    // Verificar se a posição está ocupada pela comida normal (a menos que ignoreFood seja true)
    if (!ignoreFood && food && pos.x === food.x && pos.y === food.y) return true;

    // Verificar se a posição está ocupada pela comida especial
    if (specialFood && pos.x === specialFood.x && pos.y === specialFood.y) return true;

    return false;
}

// ========== OPERAÇÃO 8: RENDERIZAR JOGO ==========
function draw() {
    // Limpar canvas
    ctx.fillStyle = config.colors.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Desenhar grid
    drawGrid();

    // MODIFICAÇÃO: Desenhar bordas com cor diferente para indicar que são "portais"
    ctx.strokeStyle = '#4a5568';
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);

    // Resto do código de desenho permanece igual...
    // COMPONENTE VISUAL 1: Comida normal
    ctx.fillStyle = config.colors.food;
    ctx.beginPath();
    ctx.arc(
        food.x * config.cellSize + config.cellSize / 2,
        food.y * config.cellSize + config.cellSize / 2,
        config.cellSize / 2 - 2,
        0,
        Math.PI * 2
    );
    ctx.fill();

    // COMPONENTE VISUAL 2: Comida especial
    if (specialFood) {
        ctx.fillStyle = config.colors.specialFood;
        ctx.font = config.cellSize + 'px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
            '★',
            specialFood.x * config.cellSize + config.cellSize / 2,
            specialFood.y * config.cellSize + config.cellSize / 2
        );
    }

    // COMPONENTE VISUAL 3: Corpo da cobra
    for (let i = snake.length - 1; i > 0; i--) {
        ctx.fillStyle = config.colors.snake;
        ctx.fillRect(
            snake[i].x * config.cellSize + 1,
            snake[i].y * config.cellSize + 1,
            config.cellSize - 2,
            config.cellSize - 2
        );
    }

    // COMPONENTE VISUAL 4: Cabeça da cobra
    if (snake.length > 0) {
        ctx.fillStyle = config.colors.snakeHead;
        ctx.fillRect(
            snake[0].x * config.cellSize + 1,
            snake[0].y * config.cellSize + 1,
            config.cellSize - 2,
            config.cellSize - 2
        );

        // Desenhar olhos na cabeça (COMPONENTE VISUAL EXTRA)
        ctx.fillStyle = '#FFFFFF';
        const eyeSize = config.cellSize / 8;
        const eyeOffset = config.cellSize / 4;

        // Posicionar olhos baseado na direção
        if (direction.x === 1) { // Direita
            ctx.fillRect(
                snake[0].x * config.cellSize + config.cellSize - eyeOffset,
                snake[0].y * config.cellSize + eyeOffset,
                eyeSize, eyeSize
            );
            ctx.fillRect(
                snake[0].x * config.cellSize + config.cellSize - eyeOffset,
                snake[0].y * config.cellSize + config.cellSize - eyeOffset - eyeSize,
                eyeSize, eyeSize
            );
        } else if (direction.x === -1) { // Esquerda
            ctx.fillRect(
                snake[0].x * config.cellSize + eyeOffset - eyeSize,
                snake[0].y * config.cellSize + eyeOffset,
                eyeSize, eyeSize
            );
            ctx.fillRect(
                snake[0].x * config.cellSize + eyeOffset - eyeSize,
                snake[0].y * config.cellSize + config.cellSize - eyeOffset - eyeSize,
                eyeSize, eyeSize
            );
        } else if (direction.y === -1) { // Cima
            ctx.fillRect(
                snake[0].x * config.cellSize + eyeOffset,
                snake[0].y * config.cellSize + eyeOffset - eyeSize,
                eyeSize, eyeSize
            );
            ctx.fillRect(
                snake[0].x * config.cellSize + config.cellSize - eyeOffset - eyeSize,
                snake[0].y * config.cellSize + eyeOffset - eyeSize,
                eyeSize, eyeSize
            );
        } else if (direction.y === 1) { // Baixo
            ctx.fillRect(
                snake[0].x * config.cellSize + eyeOffset,
                snake[0].y * config.cellSize + config.cellSize - eyeOffset,
                eyeSize, eyeSize
            );
            ctx.fillRect(
                snake[0].x * config.cellSize + config.cellSize - eyeOffset - eyeSize,
                snake[0].y * config.cellSize + config.cellSize - eyeOffset,
                eyeSize, eyeSize
            );
        }
    }
}

// ========== OPERAÇÃO 9: ATUALIZAR ESTATÍSTICAS ==========
function updateStats() {
    $('#scoreDisplay').text(score);
    $('#snakeLength').text(snake.length);
    $('#foodEaten').text(foodEaten);
    $('#specialEaten').text(specialEaten);

    const speedText = levels[currentLevel - 1].nome;
    $('#speedDisplay').text(speedText);
}

// ========== OPERAÇÃO 10: CONTROLES DO JOGO ==========
function togglePause() {
    if (!gameRunning) return;

    gamePaused = !gamePaused;
    if (gamePaused) {
        $('#pausedText').addClass('show');
        $('#pauseBtn').html('<i class="fas fa-play"></i> CONTINUAR');
    } else {
        $('#pausedText').removeClass('show');
        $('#pauseBtn').html('<i class="fas fa-pause"></i> PAUSAR');
    }
}

function restartGame() {
    console.log('Reiniciando jogo...');
    gameRunning = false;
    gamePaused = false;

    if (gameLoop) {
        clearInterval(gameLoop);
        gameLoop = null;
    }

    $('#gameOverOverlay').removeClass('show');
    $('#pausedText').removeClass('show');
    $('#pauseBtn').html('<i class="fas fa-pause"></i> PAUSAR');
    $('#startBtn').prop('disabled', false);
    $('#pauseBtn').prop('disabled', true);

    // Redesenhar tela inicial
    if (ctx) {
        drawGrid();
    }
}

function setLevel(level) {
    currentLevel = level;

    $('.level-btn').removeClass('active');
    $('.level-btn').eq(level - 1).addClass('active');

    if (gameRunning) {
        const wasRunning = gameRunning;
        restartGame();
        if (wasRunning) {
            setTimeout(startGame, 100);
        }
    }

    updateStats();
}

function loadNewXML() {
    restartGame();
    $('#gameContent').hide();
    $('#uploadScreen').show();
    $('#fileInfo').hide();
    $('#loadGameBtn').hide();
    $('#xmlFileInput').val('');
}

function gameOver() {
    console.log('Game Over');
    gameRunning = false;
    gamePaused = false;

    if (gameLoop) {
        clearInterval(gameLoop);
        gameLoop = null;
    }

    $('#finalScore').text(score);
    $('#gameOverOverlay').addClass('show');
    $('#startBtn').prop('disabled', false);
    $('#pauseBtn').prop('disabled', true);
    $('#pausedText').removeClass('show');
}

// ========== XML DE EXEMPLO ==========
function createSampleXML() {
    return `<?xml version="1.0" encoding="UTF-8"?>
<jogo>
    <configuracao>
        <largura>9</largura>
        <altura>9</altura>
        <tamanho_celula>25</tamanho_celula>
        <velocidade_inicial>150</velocidade_inicial>
    </configuracao>
    <cores>
        <fundo>#1a1a2e</fundo>
        <grade>#2d3748</grade>
        <cobra>#00ff41</cobra>
        <cabeca_cobra>#00cc33</cabeca_cobra>
        <comida>#ff0000</comida>
        <comida_especial>#ffd700</comida_especial>
    </cores>
    <pontuacao>
        <comida_normal>10</comida_normal>
        <comida_especial>50</comida_especial>
    </pontuacao>
    <cobra_inicial>
        <tamanho>3</tamanho>
        <posicao_x>10</posicao_x>
        <posicao_y>10</posicao_y>
        <direcao>direita</direcao>
    </cobra_inicial>
    <niveis>
        <nivel id="1">
            <nome>Fácil</nome>
            <velocidade>1.0</velocidade>
        </nivel>
        <nivel id="2">
            <nome>Médio</nome>
            <velocidade>1.5</velocidade>
        </nivel>
        <nivel id="3">
            <nome>Difícil</nome>
            <velocidade>2.0</velocidade>
        </nivel>
    </niveis>
</jogo>`;
}

function loadSampleXML() {
    const xmlString = createSampleXML();
    const blob = new Blob([xmlString], {type: 'application/xml'});
    const file = new File([blob], 'snake_game_example.xml', {type: 'application/xml'});

    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    document.getElementById('xmlFileInput').files = dataTransfer.files;

    $('#xmlFileInput').trigger('change');
}

// ========== CONTROLES DE TECLADO ==========
document.addEventListener('keydown', function (e) {
    if (!gameRunning && e.key !== ' ') return;

    switch (e.key) {
        case 'ArrowUp':
            if (direction.y === 0) {
                nextDirection = {x: 0, y: -1};
                e.preventDefault();
            }
            break;
        case 'ArrowDown':
            if (direction.y === 0) {
                nextDirection = {x: 0, y: 1};
                e.preventDefault();
            }
            break;
        case 'ArrowLeft':
            if (direction.x === 0) {
                nextDirection = {x: -1, y: 0};
                e.preventDefault();
            }
            break;
        case 'ArrowRight':
            if (direction.x === 0) {
                nextDirection = {x: 1, y: 0};
                e.preventDefault();
            }
            break;
        case ' ':
            e.preventDefault();
            if (gameRunning) {
                togglePause();
            } else {
                startGame();
            }
            break;
        case 'r':
        case 'R':
            e.preventDefault();
            restartGame();
            break;
    }
})

// Função para ajustar o canvas quando a janela for redimensionada
function handleResize() {
    if (canvas && ctx) {
        // Forçar redesenho do grid para garantir centralização
        if (!gameRunning) {
            drawGrid();
        }
    }
}

// Event listener no $(document).ready():
$(document).ready(function () {
    highScore = localStorage.getItem('snakeHighScore') || 0;
    $('#loadExampleBtn').show();

    // Handler para seleção de arquivo
    $('#xmlFileInput').change(function (e) {
        const file = e.target.files[0];
        if (file) {
            $('#fileName').text(file.name);
            $('#fileSize').text((file.size / 1024).toFixed(2) + ' KB');
            $('#fileInfo').show();
            $('#loadGameBtn').show();
            $('#errorMessage').hide();
        }
    });

    // Redimensionamento responsivo
    $(window).on('resize', handleResize);
});