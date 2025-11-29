# 🐍 Snake Game - Carregador XML

Um jogo da cobrinha moderno e configurável que carrega suas configurações a partir de arquivos XML personalizados.

## 📋 Descrição

Este é um jogo Snake (Jogo da Cobrinha) implementado em HTML5, CSS3 e JavaScript puro, com a funcionalidade única de carregar todas as configurações do jogo através de arquivos XML. O jogador pode personalizar cores, dimensões do grid, velocidade, pontuação e muito mais.

## ✨ Características Principais

### Funcionalidades do Jogo
- **Mecânica "Pac-Man"**: Quando a cobra atravessa as bordas, ela reaparece do lado oposto
- **Dois tipos de comida**:
    - 🔴 Comida normal (pontuação configurável)
    - ⭐ Comida especial dourada (pontuação maior, aparece aleatoriamente)
- **Três níveis de dificuldade**: Fácil, Médio e Difícil
- **Sistema de pontuação**: Inclui pontuação atual e recorde (salvo no navegador)
- **Controles responsivos**: Interface adaptável para diferentes tamanhos de tela

### Configuração via XML
- Dimensões personalizáveis do grid (largura e altura)
- Tamanho das células ajustável
- Cores totalmente customizáveis (fundo, grade, cobra, comida)
- Valores de pontuação configuráveis
- Posição e tamanho inicial da cobra
- Múltiplos níveis de velocidade

## 🎮 Como Jogar

### Controles
- **Setas do Teclado** (↑ ↓ ← →): Movimentar a cobra
- **Espaço**: Pausar/Continuar o jogo
- **R**: Reiniciar o jogo

### Objetivo
- Colete comida para aumentar sua pontuação e o tamanho da cobra
- Comida especial dourada (⭐) vale mais pontos
- Evite colidir com o próprio corpo
- As bordas são portais - você pode atravessá-las!

## 🚀 Como Usar

### 1. Estrutura de Arquivos
```
snake-game/
│
├── index.html
├── css/
│   └── styles.css
└── js/
    └── script.js
```

### 2. Executar o Jogo
1. Abra o arquivo `index.html` em um navegador moderno
2. Clique em "Escolher Arquivo XML" para carregar sua configuração
3. Ou clique em "Carregar XML de Exemplo" para usar a configuração padrão
4. Clique em "Carregar e Jogar"
5. Pressione "INICIAR" para começar

### 3. Criar seu Próprio XML

Crie um arquivo `.xml` com a seguinte estrutura:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<jogo>
    <configuracao>
        <largura>20</largura>
        <altura>20</altura>
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
</jogo>
```

## 📊 Parâmetros do XML

### Configuração
- **largura**: Número de células na horizontal (5-50)
- **altura**: Número de células na vertical (5-50)
- **tamanho_celula**: Tamanho em pixels de cada célula (10-40)
- **velocidade_inicial**: Velocidade base em milissegundos (quanto menor, mais rápido)

### Cores
- **fundo**: Cor de fundo do canvas (formato hexadecimal)
- **grade**: Cor das linhas da grade
- **cobra**: Cor do corpo da cobra
- **cabeca_cobra**: Cor da cabeça da cobra
- **comida**: Cor da comida normal
- **comida_especial**: Cor da comida especial

### Pontuação
- **comida_normal**: Pontos ganhos ao comer comida normal
- **comida_especial**: Pontos ganhos ao comer comida especial

### Cobra Inicial
- **tamanho**: Tamanho inicial da cobra (2-20)
- **posicao_x**: Posição horizontal inicial
- **posicao_y**: Posição vertical inicial
- **direcao**: Direção inicial (direita, esquerda, cima, baixo)

### Níveis
- **id**: Identificador do nível
- **nome**: Nome exibido do nível
- **velocidade**: Multiplicador de velocidade (1.0 = normal, 2.0 = dobro)

## 🛠️ Tecnologias Utilizadas

- **HTML5**: Estrutura e Canvas API
- **CSS3**: Estilização moderna com gradientes e animações
- **JavaScript (ES6+)**: Lógica do jogo
- **jQuery**: Manipulação DOM simplificada
- **Bootstrap 5**: Framework CSS para UI
- **Font Awesome**: Ícones

## 📱 Responsividade

O jogo é totalmente responsivo e se adapta a diferentes tamanhos de tela:
- Desktop: Interface completa com painel lateral
- Tablets: Layout ajustado
- Mobile: Interface otimizada para telas pequenas

## 💾 Armazenamento Local

O jogo utiliza `localStorage` para salvar:
- **High Score**: Maior pontuação alcançada (persiste entre sessões)

## 🎨 Componentes Visuais

1. **Grade de Jogo**: Grid com linhas visíveis
2. **Cobra**: Corpo verde com cabeça destacada e olhos animados
3. **Comida Normal**: Círculo vermelho
4. **Comida Especial**: Estrela dourada
5. **Bordas Portal**: Bordas cinzas indicando passagem
6. **Overlay de Game Over**: Tela de fim de jogo com pontuação final
7. **Indicador de Pausa**: Texto animado quando pausado

## 🔧 Funcionalidades Técnicas

### Sistema de Colisão
- Detecção de colisão com próprio corpo
- Sistema de portais nas bordas (sem colisão com paredes)
- Validação de posições ocupadas

### Geração de Comida
- Algoritmo inteligente para evitar posições ocupadas
- Sistema de fallback para grids lotados
- Geração aleatória de comida especial (20% de chance)

### Validações
- Verificação de XML bem formatado
- Validação de limites de configuração
- Tratamento de erros com mensagens descritivas
- Posicionamento seguro da cobra inicial

## 🐛 Tratamento de Erros

O jogo inclui tratamento robusto de erros para:
- Arquivos XML inválidos ou mal formatados
- Valores de configuração fora dos limites
- Posições iniciais inválidas
- Falhas na geração de comida
- Erros durante o game loop

## 📈 Possíveis Melhorias Futuras

- [ ] Sistema de power-ups
- [ ] Obstáculos configuráveis via XML
- [ ] Modo multiplayer local
- [ ] Sons e música
- [ ] Ranking online
- [ ] Mais tipos de comida especial
- [ ] Temas visuais personalizáveis
- [ ] Modo história com fases

## 📄 Licença

Este projeto é de código aberto e está disponível para uso educacional e pessoal.

## 👨‍💻 Autor

Desenvolvido como projeto educacional de programação web.

---

**Divirta-se jogando! 🎮🐍**