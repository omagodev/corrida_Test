# corrida_Test

**DRIFT CIRCUIT — Time Attack**: um jogo de corrida arcade top-down em 3 voltas, com rival controlado por IA, drift e nitro. O objetivo é bater o tempo do carro azul em cada volta.

## Como rodar

Não há etapa de build nem dependências para instalar. Basta abrir o arquivo `index.html` em qualquer navegador moderno (Chrome, Edge, Firefox ou Safari).

```bash
# opção 1: abrir direto no navegador
start index.html        # Windows
open index.html         # macOS

# opção 2: servir localmente (opcional)
python -m http.server 8000
# depois acesse http://localhost:8000
```

### Controles

| Tecla | Ação |
| --- | --- |
| `↑` / `W` | Acelerar |
| `↓` / `S` | Frear |
| `←` `→` / `A` `D` | Direcionar |
| `ESPAÇO` | Drift (segurar para deslizar) |
| `SHIFT` | Nitro |
| `P` | Pausar |
| `M` | Som liga/desliga |
| `R` | Reaparecer na pista |

Em telas de toque, o jogo exibe botões virtuais (direção, acelerador e freio) automaticamente.

## Stack do jogo

Todo o projeto vive em **um único arquivo** (`index.html`) — HTML + CSS + JavaScript embutidos, sem frameworks, sem bundler e sem dependências externas. Isso significa que não existe `package.json`, etapa de build ou rede para carregar assets: é 100% autocontido.

| Camada | Tecnologia | Observações |
| --- | --- | --- |
| Estrutura / interface | **HTML5** | Tela única com `<canvas>` e overlays (título, resultados) em DOM. |
| Estilo | **CSS3** | Layout responsivo, variáveis CSS (`:root`) e `backdrop-filter`. |
| Lógica do jogo | **JavaScript vanilla (ES6+)** | IIFE com `'use strict'`; sem módulos externos, sem transpilação. |
| Renderização | **Canvas 2D API** | `canvas.getContext('2d')` para o mundo; um canvas off-screen acumula as marcas de pneu (decalques). Escala por `devicePixelRatio` (limitada a 2×) e redimensionamento responsivo. |
| Loop de jogo | **`requestAnimationFrame`** | Física baseada em delta-time (`dt`) para comportamento consistente entre taxas de quadro. |
| Pista / geometria | **Spline Catmull-Rom** | A pista é gerada por interpolação de pontos de controle; tangentes, normais e comprimento acumulado são pré-computados no carregamento. |
| Física | **Motor arcade próprio** | Modelo de drift, aderência, nitro e IA do rival — implementado à mão, sem biblioteca de física. |
| Áudio | **Web Audio API** | Som do motor e efeitos gerados proceduralmente com osciladores + `BiquadFilter` (lowpass/bandpass). Nenhum arquivo de áudio é carregado. |
| Entrada | **Keyboard + Pointer/Touch** | Eventos `keydown`/`keyup` para teclado e `pointerdown`/`pointerup` para os botões virtuais em telas de toque. |

### Detalhes técnicos

- **Sem persistência**: os melhores tempos ficam apenas em memória durante a sessão (sem `localStorage`).
- **Sem rede / sem assets externos**: tudo (pista, física, som) é calculado no cliente; o jogo funciona offline.
- **Acessibilidade de plataforma**: pausa automática quando a aba perde o foco (`visibilitychange`) e suporte a telas de toque via botões na tela.

## Estrutura do repositório

```
corrida_Test/
└── index.html   # HTML + CSS + JS do jogo (arquivo único, autocontido)
```
