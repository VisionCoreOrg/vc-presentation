# VisionCore Presentation — Interactive Animation Design

**Data:** 2026-06-11
**Projeto:** `vc-presentation`
**Contexto:** Apresentação para banca de Projeto Final de Curso (TCC · Eng. de Software · 2026.1)

---

## Visão Geral

A apresentação é uma página HTML única com 5 slides. O Slide 2 ("Pipeline") é o coração da defesa — ele demonstra o fluxo de dados do sistema em tempo real, ao vivo, como suporte visual enquanto a equipe fala.

O objetivo desta melhoria é substituir a animação automática existente (que rodava todo o fluxo de uma vez) por uma animação **step-by-step controlada pelo apresentador**, com uma câmera narrativa que transita entre a visão externa (cancela + carro) e a visão interna (diagrama do pipeline).

Os outros 4 slides (Cover, Problem, Demo Bridge, Roadmap) **não são alterados**.

---

## Estrutura do Slide 2 — Nova Arquitetura

### Duas Camadas com Crossfade

O slide 2 passa a ter dois painéis sobrepostos que alternam via `opacity` CSS:

```
#slide-pipeline  [data-phase="idle | external | pipeline | conclusion"]
  ├── .car-layer        ← visível em external e conclusion
  │     ├── câmera + cone + cancela + carro (CSS)
  │     └── badge de detecção de placa
  └── .pipeline-layer   ← visível em pipeline
        └── SVG do diagrama (reutilizado, sem redesenho)
```

A transição entre camadas é **crossfade simples**: `opacity: 0 → 1` com `transition: opacity 0.4s ease`. Nenhum JavaScript de animação para o crossfade — apenas troca de classe no container.

### Layout Vertical

```
┌─────────────────────────────────────────────────┐
│  eyebrow "02 / Arquitetura e Pipeline"          │  sempre visível
│  h2 "Simulador do Pipeline de Dados"            │
├─────────────────────────────────────────────────┤
│                                                 │
│   .car-layer  OU  .pipeline-layer               │  ~75% da altura do slide
│   (crossfade controlado por data-phase)         │
│                                                 │
├─────────────────────────────────────────────────┤
│  [ ● ● | ○ ○ ○ ○ ○ | ○ ]   passo 2 de 8        │  step indicator, rodapé
└─────────────────────────────────────────────────┘
```

A `.car-layer` expande para preencher a área principal (não mais 110px fixos como hoje). A câmera, o cone e a cancela são redimensionados proporcionalmente.

---

## Máquina de Estados — `STEPS[]`

### Array Declarativo

Toda a animação é definida como uma lista de objetos. Para ajustar a ordem, timing ou número de passos, edita-se apenas este array — sem tocar na lógica de execução.

```js
const STEPS = [
  // Fase: cena externa
  { phase: 'external',   action: 'car-arrives'  },           // ① carro entra e para
  { phase: 'external',   action: 'camera-flash' },           // ② cone + badge aparecem

  // Fase: pipeline interno  (crossfade automático ao entrar nesta fase)
  { phase: 'pipeline',   action: 'node', edge: 'cam-minio',    node: 'minio'    }, // ③
  { phase: 'pipeline',   action: 'node', edge: 'cam-redis',    node: 'redis'    }, // ④
  { phase: 'pipeline',   action: 'node', edge: 'redis-worker', node: 'worker'   }, // ⑤
  { phase: 'pipeline',   action: 'node', edge: 'worker-api',   node: 'api'      }, // ⑥
  { phase: 'pipeline',   action: 'node', edge: 'api-frontend', node: 'frontend' }, // ⑦

  // Fase: conclusão  (crossfade automático ao entrar nesta fase)
  { phase: 'conclusion', action: 'gate-opens'   },           // ⑧ cancela abre, carro sai
];
```

**Total de pressionamentos de tecla pelo apresentador: 8.**

### Transições de Fase

Quando `nextStep()` detecta que a `phase` do próximo passo difere da fase atual, ele dispara o crossfade automaticamente **antes** de executar a ação, sem exigir um pressionamento extra:

- `external → pipeline`: `.car-layer` faz fade-out, `.pipeline-layer` faz fade-in
- `pipeline → conclusion`: `.pipeline-layer` faz fade-out, `.car-layer` faz fade-in

### Função `nextStep()`

```js
let stepIndex = 0;
let currentPhase = 'idle';
const CROSSFADE_MS = 400;

function nextStep() {
  if (stepIndex >= STEPS.length) return;
  const step = STEPS[stepIndex];

  const phaseChanged = step.phase !== currentPhase;

  if (phaseChanged) {
    setPhase(step.phase);                         // dispara crossfade CSS
    setTimeout(() => {
      executeStep(step);                          // ação só após crossfade terminar
      updateStepIndicator(stepIndex, STEPS.length);
    }, CROSSFADE_MS);
  } else {
    executeStep(step);
    updateStepIndicator(stepIndex, STEPS.length);
  }

  stepIndex++;
}
```

**Timing:** quando há mudança de fase, a ação do passo é executada somente após o crossfade terminar (400ms). Isso garante que o nó ③ (cam→minio) só acende depois que o diagrama do pipeline já está visível — não durante a transição. O mesmo vale para o passo ⑧: a cancela só abre depois que a cena do carro voltou a ficar visível.

`setPhase(phase)` seta `document.getElementById('slide-pipeline').dataset.phase = phase` e atualiza `currentPhase`.

---

## Controle de Teclado

| Tecla | Contexto | Ação |
|-------|----------|------|
| `→` / `Space` | Fora do slide 2, ou animação concluída | Próximo slide |
| `←` | Qualquer slide | Slide anterior |
| `Enter` / `↓` | Slide 2, animação não iniciada | Inicia — executa passo ① |
| `Enter` / `↓` | Slide 2, animação em andamento | Avança para o próximo passo |
| `Enter` / `↓` | Slide 2, passo ⑧ concluído | Libera: próximo `→` navega para slide 3 |
| `Escape` | Slide 2, qualquer momento | Reseta animação para estado inicial |

**Proteção contra navegação acidental:** enquanto `stepIndex > 0 && stepIndex < STEPS.length`, `Space` e `→` são interceptados e ignorados. O apresentador não sai acidentalmente do slide no meio da explicação.

**Reset para ensaio:** `Escape` volta `stepIndex` a 0, reseta `data-phase` para `idle`, limpa nós/arestas ativas do SVG e reposiciona o carro fora de quadro. Pode ser usado quantas vezes necessário sem recarregar a página.

**Atalhos removidos:** `s` (triggerSim) e `f` (toggleFailover) são removidos. O botão "Falha de Mídia" e o badge "MinIO ONLINE/OFFLINE" são removidos do slide.

---

## Step Indicator

Barra de progresso discreta no rodapé do slide 2, separada dos dots de navegação global:

```
[ ● ● | ○ ○ ○ ○ ○ | ○ ]   passo 2 de 8
  ext       pipeline      fin
```

- 8 círculos agrupados visualmente em 3 fases por separadores `|`
- Círculo ativo: cor de acento primário (`#07EF5C`)
- Círculos concluídos: cor de acento com opacidade reduzida
- Círculos futuros: cor de borda (`--border2`)
- Rótulo de texto: `passo N de 8`

---

## Adaptação de Paleta

A paleta original da apresentação é substituída (ou complementada) pela paleta oficial do projeto VisionCore, mantendo cores funcionais onde não há equivalente.

| Token | Antes | Depois | Uso |
|-------|-------|--------|-----|
| `--bg` | `#090f1c` | `#1D2938` | Background principal |
| `--bg2` | `#0d1628` | `#182230` | Background secundário (intermediário) |
| `--card` | `#121d30` | `#1D2938` | Cards e painéis |
| `--card2` | `#162240` | `#213040` | Cards secundários |
| `--accent` (novo) | `#06b6d4` | `#07EF5C` | Partícula, glow, step indicator ativo, brand dot |
| `--teal` (novo) | `#06b6d4` | `#2A616E` | Bordas ativas, acentos de profundidade |
| `--emerald` | `#10b981` | `#13B37E` | Sucesso, arestas ativas, gate aberta |
| `--rose` | `#f43f5e` | `#f43f5e` | **Mantida** — erro, failover, sem equivalente |
| `--amber` | `#f59e0b` | `#f59e0b` | **Mantida** — ícone MinIO, sem equivalente |

O verde neon `#07EF5C` assume o papel de cor-assinatura das animações (partícula do pipeline, glow da cancela, dot ativo do step indicator), criando consistência visual com o dashboard `vc-frontend`.

---

## Removidos

- Botões "Simular Fluxo Normal" e "Falha de Mídia"
- Badge "MinIO ONLINE / OFFLINE"
- Lógica de failover (`isFailover`, `toggleFailover`, `continueWorker` no modo rose)
- Atalhos de teclado `s` e `f`
- Função `triggerSim` e `animateCar` standalone (substituídas pelo step-by-step)

---

## Fora de Escopo

- Slides 0, 1, 3 e 4 — não alterados
- Redesenho do SVG do pipeline — reutilizado como está
- Responsividade mobile — apresentação usada em tela de notebook/projetor

---

## Critérios de Sucesso

1. Apresentador consegue avançar cada passo com `Enter`/`↓` sem o slide mudar
2. Crossfade entre cena e diagrama ocorre suavemente (sem flash ou salto)
3. `Escape` reseta completamente para ensaio sem recarregar a página
4. Paleta VisionCore é perceptível em toda a apresentação, especialmente na partícula e no glow da cancela
5. O link para o `vc-frontend` no slide 3 continua funcionando
