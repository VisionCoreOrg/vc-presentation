# Apresentação VisionCore LPR — Design v2

**Data:** 2026-06-12
**Contexto:** TCC Eng. de Software 2026.1 — slide-app de defesa (15-20 min).
**Status:** Redesign completo a partir do zero (v2), sem reaproveitar o código da v1.

---

## 1. Objetivo

Slide-app de apresentação para a defesa do VisionCore — uma plataforma de LPR
(*License Plate Recognition*) para pátios privados. O deck acompanha a fala em
~15-20 min e culmina numa demonstração ao vivo do sistema real.

A página de arquitetura (slide 5) já tem o roteiro de animação definido em
`roteiro-animacao.md` — este spec integra essa animação ao deck completo.

### Fora de escopo (decisões explícitas)

- **Arquitetura hexagonal / Ports & Adapters**: removida da apresentação. Apenas
  o `api-core` a implementa; o foco é a arquitetura como um todo (microsserviços
  containerizados e a comunicação entre eles), sem mergulho técnico.
- **Jargão pesado dos relatórios da raiz** (`roteiro_adaptado.md`,
  `relatorio_arquitetural.md`): usados só como referência de conteúdo, não de
  profundidade. O tom é leve — cada serviço explicado por sua ideia-central.
- **Responsividade mobile**: o deck roda em projetor/notebook na defesa.
- **GPU/CUDA** nos próximos passos: substituído por melhoria de algoritmos.

---

## 2. Design System

| Token | Valor | Uso |
|-------|-------|-----|
| Fundo base | `#1D2938` (graphite) | Background de todos os slides |
| Superfície | `#2A616E` | Cards, painéis, blocos de serviço |
| Acento primário | `#13B37E` | Títulos de destaque, bordas, estados |
| Acento neón | `#07EF5C` | Partícula de dados, glow de nós ativos, indicadores de progresso |

- **Tipografia**: uma sans geométrica para títulos/corpo (ex.: Inter / Space
  Grotesk) + uma mono para rótulos técnicos (`S3 PUT`, `BLPOP`, nomes de
  container).
- **Contraste para projetor** (corrige dor da v1): corpo grande, títulos
  generosos, rótulos de aresta legíveis — nada de cinza pequeno.
- **Layout**: grid com margens amplas. Rótulo de seção fixo num canto
  (ex.: `02 · ARQUITETURA`) para orientar a banca.
- **Clima visual**: dark "command center" — painel de monitoramento de infra,
  combinando com o tema LPR e a animação neón.

---

## 3. Modelo de Interação

- **Deck discreto**: `→` / `Space` avança slide, `←` volta. Transição curta
  (fade/slide).
- **Slide 5 (pipeline)** tem sub-estados internos: `Enter` / `↓` avança os 9
  passos da animação. A navegação de slide (`→`/`←`/`Space`) fica **bloqueada**
  enquanto a animação está em andamento.
- `Esc` reseta a animação do slide atual (para ensaio).
- Indicador de progresso discreto (slide atual / passo atual da animação).

### Stack

- HTML/CSS/JS **puro**, sem frameworks. Um `index.html` + `style.css` + `app.js`.
- Carrega instantâneo, roda offline no notebook da defesa.
- Projetado para projetor/notebook, sem responsividade mobile.

---

## 4. Inventário de Slides

Deck de **8 slides**. Fluxo: intro → problema → solução → arquitetura → demo →
próximos passos → fecho.

### Slide 1 · Capa
Wordmark VisionCore centralizado sobre o graphite, com sutil grid/scanline neón
ao fundo. Tagline: **"VisionCore: Estacionamentos inteligentes com visão
computacional"**. Rodapé com curso/TCC/integrantes. Pano de fundo da fala de
introdução rápida.

### Slide 2 · O Problema
Título de impacto à esquerda: pátios privados, abordagem reativa, filas na
portaria. À direita, dados da validação por gatilho — contadores animados
subindo de 0 → **60%** (motoristas que enfrentam filas/lentidão) e → **~100%**
(priorizam estabelecimentos com estacionamento inteligente). Estética de
infográfico de command center.

### Slide 3 · A Solução
"O que é o VisionCore": plataforma LPR de **baixo custo de infra** que
**reaproveita câmeras IP já instaladas** (RTSP) e transforma vídeo bruto em
dados estruturados. 3 pontos-chave em cards curtos. Ponte para "como
construímos".

### Slide 4 · Arquitetura — visão geral
Os 5 serviços surgem como blocos containerizados: `vc-camera-mock`, `MinIO`,
`Redis`, `vc-worker-portaria`, `vc-api-core` (+ Dashboard). Mensagem:
microsserviços isolados em Docker se comunicando de forma assíncrona. Este slide
**monta o palco** do diagrama — os blocos aparecem, mas o fluxo ainda não corre.

### Slide 5 · Pipeline animado ⭐
A animação roteirizada em `roteiro-animacao.md` (9 passos). Ver seção 5.

Cada bloco, ao acender, dispara um **painel lateral** com nome + 1 frase da
ideia-central:

| Serviço | Frase no painel lateral |
|---------|-------------------------|
| Camera-mock | Captura o frame e dispara o evento |
| MinIO | Guarda a imagem (object storage) |
| Redis | Fila de eventos entre os serviços |
| Worker-portaria | Detecta a placa com IA e lê o texto |
| API-core | Registra a transação |
| Dashboard | Operador vê em tempo real |

Rótulos de operação (`S3 PUT`, `LPUSH`, `BLPOP`, `S3 GET`, `HTTP POST`,
`HTTP GET`) na fonte mono, legíveis.

### Slide 6 · Demo ao vivo
Slide-ponte minimalista. À esquerda, o que será provado (OCR real, acurácia,
tempo real). Botão proeminente **"Abrir ambiente real"** com `target="_blank"`
apontando para o frontend real do sistema. O apresentador sai do deck e entra no
sistema para a demonstração.

### Slide 7 · Próximos passos
Roadmap em cards "em construção". Foco:
- **Melhoria dos algoritmos existentes**: classificação de imagem antes da
  binarização para mais assertividade; refino dos algoritmos de pré-processamento.
- **Worker-pátio**: monitoramento espacial de vagas (próximo semestre).

### Slide 8 · Encerramento
Fecho simples, espelhando a capa: wordmark + "Obrigado pela atenção". Contatos a
decidir depois (o grupo definirá se inclui).

---

## 5. Animação do Pipeline (Slide 5)

Baseada em `roteiro-animacao.md`. Três fases com crossfade automático entre elas.

### Fase Externa — cena da portaria
- **① Carro chega**: entra pela esquerda, para na área de leitura (antes da cancela).
- **② Câmera detecta**: cone da câmera acende; badge "PLACA DETECTADA" sobre o veículo.
- *→ crossfade automático para o diagrama.*

### Fase Pipeline — diagrama interno
A metáfora central: o **dado é uma bolinha brilhante** (`#07EF5C`) que viaja por
uma **linha invisível** entre os serviços.

**Modelo de animação:**
- Em cada passo, uma partícula parte do nó de origem e percorre a aresta até o
  destino (via `transform: translate()` + `transition`, ou `requestAnimationFrame`).
- O nó que **detém o dado fica iluminado** (glow neón). Quando a partícula parte,
  o nó de origem apaga; quando chega, o nó de destino acende.
- A linha é "invisível" (sem traço visível ou bem sutil) — o que se vê é a
  bolinha guiada por ela.

**Passos:**

| # | Aresta | Operação |
|---|--------|----------|
| ③ | cam → MinIO | `S3 PUT` — frame salvo no object storage |
| ④ | cam → Redis | `LPUSH` — evento de detecção enfileirado |
| ⑤ | Redis → Worker | `BLPOP` — worker consome o evento |
| ⑥ | Worker → MinIO | `S3 GET` — worker recupera o frame para processar (YOLOv8 + EasyOCR) |
| ⑦ | Worker → API | `HTTP POST` — resultado do OCR enviado |
| ⑧ | API → Dashboard | `HTTP GET` — dashboard confirma via polling (5s) |

**Nó com múltiplas emissões:** o `cam` emite em ③ (→MinIO) e ④ (→Redis). O nó
`cam` permanece como origem ativa (iluminado) até completar as duas emissões,
depois apaga. A aresta `cam ↔ MinIO` é bidirecional (PUT na ida em ③, GET pelo
worker em ⑥) — pode ser uma aresta bidirecional ou duas arestas distintas.

- *→ crossfade automático de volta para a cena externa.*

### Fase Conclusão — retorno à portaria
- **⑨ Cancela abre**: anima para cima; badge "ACESSO LIBERADO ✓"; carro avança e
  sai pela direita.

**Total: 9 avanços manuais** (`Enter`/`↓`). Crossfades entre fases são
automáticos, sem tecla extra.

---

## 6. Estrutura de Arquivos (alvo da implementação)

```
vc-presentation/        (ou diretório novo v2 — a decidir no plano)
├── index.html          # estrutura dos 8 slides
├── style.css           # design system + layout + animações CSS
└── app.js              # navegação por teclado + máquina de estados da animação
```

Decisão de onde mora a v2 (sobrescrever working tree atual vs. novo diretório)
fica para a fase de planejamento.

---

## 7. Decisões em Aberto (para o plano)

- Fontes exatas (sans + mono) e se serão self-hosted ou via web font.
- URL exata do "Abrir ambiente real" no slide 6.
- Conteúdo final de capa/encerramento (integrantes, contatos).
- Local físico da v2 no repositório.
