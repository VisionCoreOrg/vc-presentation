# Roteiro de Defesa — VisionCore LPR

> **TCC Engenharia de Software · 2026.1**
> Guia completo para os 3 apresentadores: roteiro de fala, cola técnica, banco de perguntas e checklist da demo.
> Tempo-alvo: **~15 min** + arguição da banca.

---

## 1. Visão geral e divisão

**Pitch de 30s (decorem isto — serve de abertura e de resposta-resumo se a banca pedir "expliquem o projeto em uma frase"):**

> O VisionCore é um sistema de **leitura automática de placas (LPR)** de baixo custo, que transforma o vídeo de câmeras IP que **já existem** num estacionamento em **dados estruturados e auditáveis** — placa, horário e status de acesso. Ele roda como **microsserviços containerizados** que se comunicam de forma **assíncrona**, com um pipeline de **visão computacional (YOLOv8) + OCR (EasyOCR)** no centro.

### Divisão de palco

Cada apresentador domina **um pilar pesado** e apoia nos outros dois.

| Apresentador | Slides | Pilar | Tempo |
|---|---|---|---|
| **P1 — Contexto & Arquitetura** | 1 Capa · 2 Problema · 3 Solução · **4 Arquitetura** | Arquitetura | ~5 min |
| **P2 — Pipeline** | **5 Pipeline animado** | Pipeline (9 passos) | ~4 min |
| **P3 — Demo & Fecho** | **6 Demo ao vivo** · 7 Próximos passos · 8 Encerramento | Demo | ~5 min |

### Hand-offs (frases de passagem)

- **P1 → P2** (fim do slide 4): *"…e pra mostrar como esses serviços conversam de verdade, passo pro [nome] detalhar o pipeline."*
- **P2 → P3** (fim do slide 5): *"…e tudo isso que vocês acabaram de ver no diagrama está rodando agora — [nome] vai abrir o sistema real."*

### Mapa de tempo

```
00:00  P1  Capa ............... 0:20
00:20  P1  Problema ........... 1:00
01:20  P1  Solução ............ 1:00
02:20  P1  Arquitetura ........ 2:30   ◄ pilar
04:50  P2  Pipeline ........... 4:00   ◄ pilar (9 avanços)
08:50  P3  Demo ao vivo ....... 3:30   ◄ pilar
12:20  P3  Próximos passos .... 1:00
13:20  P3  Encerramento ....... 0:30
13:50  ——— buffer ............. 1:10
```

> **Regra de ouro:** se a demo atrasar, corte tempo dos *próximos passos*, nunca do pipeline.

---

## 2. Roteiro slide a slide (híbrido)

Formato: **frase de abertura** (pronta) + **bullets de apoio** + **não esqueça**.

### Slide 1 — Capa · *(P1)*
**Abertura:** *"Boa tarde. Nós somos [nomes] e vamos apresentar o VisionCore: estacionamentos inteligentes com visão computacional."*
- Diga o nome do produto e a categoria: **LPR — License Plate Recognition**.
- Não gaste mais de 20s. A capa é respiro, não conteúdo.

### Slide 2 — O Problema · *(P1)*
**Abertura:** *"Pátios privados ainda operam de forma reativa."*
- Três dores concretas: **filas na portaria**, **fricção no acesso**, **falta de dados históricos estruturados** para auditar incidentes.
- Os contadores na tela: **~60%** dos motoristas enfrentam lentidão na portaria; **~100%** preferem estabelecimentos com estacionamento inteligente.
- **Não esqueça:** ancore no problema de *negócio* (experiência + auditoria), não na tecnologia ainda.

### Slide 3 — A Solução · *(P1)*
**Abertura:** *"A nossa proposta é fazer LPR de baixo custo sobre a infraestrutura que já existe."*
- Três pilares (são os 3 cards): **Baixo custo** (reaproveita câmeras IP já instaladas, sem hardware dedicado) · **Padrão de rede** (integra via RTSP — vídeo bruto vira entrada do pipeline) · **Dados estruturados** (frames viram transações auditáveis: placa, horário, status).
- **Não esqueça:** o diferencial é *não exigir hardware novo*. Esse é o argumento de viabilidade econômica.

### Slide 4 — Arquitetura · *(P1)* ◄ **pilar**
**Abertura:** *"Por baixo, o VisionCore é um conjunto de microsserviços containerizados que conversam por mensagens — não por chamadas diretas acopladas."*

Apresente os **6 serviços** na ordem do fluxo (eles estão na tela):

1. **vc-camera-mock** *(borda)* — simula a câmera da portaria; no mundo real, seria o feed RTSP.
2. **MinIO** *(storage)* — object storage compatível com S3; guarda os frames e os recortes de placa.
3. **Redis** *(fila)* — broker de mensagens; desacopla quem produz frames de quem processa.
4. **vc-worker-portaria** *(IA)* — o cérebro: detecção YOLOv8 + OCR EasyOCR.
5. **vc-api-core** *(api)* — API REST transacional; persiste os registros e expõe consultas.
6. **vc-frontend** *(UI)* — dashboard de visualização e *depuração* do OCR.

**Não esqueça (a mensagem central deste slide):**
- **Por que assíncrono?** Se chegam 10 carros ao mesmo tempo, a câmera não trava esperando a IA: ela **enfileira** no Redis e o worker processa no seu ritmo. Resiliência e escalabilidade.
- **Por que containers?** Cada serviço é isolado, tem suas dependências próprias (o worker carrega PyTorch/ONNX; a API não precisa disso) e sobe/escala independente via Docker Compose.
- **Tudo numa rede Docker interna** (`parking_global_net`); só o **Nginx** fica exposto (porta 80) — é o gateway.

> **Hand-off P1→P2 aqui.**

### Slide 5 — Pipeline animado · *(P2)* ◄ **pilar**
**Abertura:** *"Vou seguir um carro do momento em que ele chega até o dado aparecer no dashboard."*

São **9 avanços manuais** (Enter/↓). Narre **um por vez**, no ritmo da animação. `Esc` reseta (use no ensaio).

| # | O que mostra | Fala-guia |
|---|---|---|
| ① | Carro chega na portaria | *"O carro para na área de leitura, antes da cancela."* |
| ② | Câmera detecta | *"A câmera capta o frame — aqui simulado pelo camera-mock."* |
| ③ | camera → MinIO (**S3 PUT**) | *"O frame é salvo no object storage, o MinIO."* |
| ④ | camera → Redis (**LPUSH**) | *"E um evento entra na fila do Redis: 'tem frame novo pra processar'."* |
| ⑤ | Redis → Worker (**BLPOP**) | *"O worker está bloqueado escutando a fila; pega o evento na hora — sem polling."* |
| ⑥ | Worker → MinIO (**S3 GET**) | *"Ele baixa o frame do MinIO pra rodar a inferência."* |
| ⑦ | Worker → API (**HTTP POST**) | *"YOLOv8 acha a placa, EasyOCR lê o texto, e o resultado vai pra API."* |
| ⑧ | API → Dashboard (**polling 5s**) | *"A API persiste no banco e o dashboard atualiza sozinho a cada 5 segundos."* |
| ⑨ | Cancela abre | *"Acesso liberado — e o registro fica auditável pra sempre."* |

**Não esqueça:**
- O passo ⑥ (worker baixa o frame) é o que **fecha o ciclo** do storage: o MinIO é escrito pela câmera e lido pelo worker.
- Enfatize **BLPOP bloqueante** = orientado a eventos, latência baixa, sem desperdício de CPU em polling.
- Se travar a animação: respire, `Esc` reseta pro início e você recomeça a fase.

> **Hand-off P2→P3 aqui.**

### Slide 6 — Demo ao vivo · *(P3)* ◄ **pilar**
**Abertura:** *"O que vocês viram no diagrama está rodando agora de verdade."*
- Clique em **"Abrir ambiente real ↗"** → abre `http://localhost` (gateway Nginx).
- **Roteiro da demo** (ver checklist completo na §5):
  1. **Painel Geral** — mostre os registros chegando e os controles do mock (Iniciar/Parar câmera).
  2. **Depurador OCR** — o trunfo: crop do YOLO lado a lado com a imagem **binarizada** (OpenCV), e o **char-diff** OCR × ground truth. Atalhos `J`/`K` pra navegar.
  3. **Acurácia** — métricas **Levenshtein / CER** contra o gabarito anotado.
- **Não esqueça:** vocês fizeram uma ferramenta de *depuração visual*, não só um leitor. Isso mostra rigor de engenharia. Venda isso.

### Slide 7 — Próximos passos · *(P3)*
**Abertura:** *"O sistema entrega hoje, mas tem caminho claro de evolução."*
- **Classificação pré-binarização** — classificar a imagem antes de binarizar pra escolher o melhor tratamento e subir a assertividade do OCR.
- **Refino de pré-processamento** — *ajuste* dos filtros OpenCV (CLAHE, Otsu e filtro bilateral **já em uso**) pra placas em condições adversas (chuva, contraluz, ângulo).
- **vc-worker-patio** *(serviço novo)* — monitorar **ocupação de vagas** por polígonos, não só a portaria.
- **Não esqueça:** enquadre como *roadmap pensado*, com os dois primeiros sendo melhoria de algoritmo e o terceiro expansão de escopo. **Cuidado:** CLAHE e Otsu **já estão em produção** — o slide fala em *refinar* esses filtros (tuning de parâmetros + classificação pré-binarização), não em adicioná-los do zero.

### Slide 8 — Encerramento · *(P3)*
**Abertura:** *"VisionCore: dados estruturados e auditáveis a partir da câmera que já existe. Obrigado pela atenção — estamos à disposição para perguntas."*
- Deixe este slide na tela durante a arguição.

---

## 3. Cola técnica — 1 bloco por serviço

> Cada apresentador deve dominar **seu** pilar a fundo e ter noção dos outros. Use isto para responder com precisão.

### parking-infra — Gateway & Broker
- **O que é:** infraestrutura base. **Sobe primeiro** (cria a rede e o broker que todo o resto usa).
- **Componentes:** **Nginx** (gateway/reverse-proxy na porta 80) + **Redis** (broker de filas, persistência AOF) + a rede `parking_global_net`.
- **Roteamento Nginx:** `/api/*` → `api_core:8000` (rate limit 10 req/s, burst 20); `/` → `vc_frontend`.
- **Decisão defensável:** o Redis **não** é exposto ao host (sem `ports`), exige senha (`requirepass`) e só é acessível pela rede interna — superfície de ataque mínima.

### vc-camera-mock — Simulador de câmera
- **O que é:** simula a câmera da portaria. A cada `INTERVAL_SECONDS` (padrão 5s) pega um frame do dataset, faz **upload no MinIO** e dá **LPUSH** na fila.
- **Por que existe:** permite demonstrar o pipeline de ponta a ponta sem uma câmera RTSP real. No mundo real, seria substituído pelo feed da câmera IP.
- **Evento publicado:** `{ "path": "dataset/frame.jpg", "camera_id": "...", "timestamp": "..." }`.
- **Decisão defensável:** trocar o mock por uma câmera real **não muda mais nada** — o contrato é o evento na fila. Isso prova o desacoplamento.

### vc-worker-portaria — IA (detecção + OCR)
- **O que é:** o cérebro. Orientado a eventos (**BLPOP** bloqueante, sem polling).
- **Fluxo interno:** BLPOP → baixa frame do MinIO → **YOLOv8 (ONNX Runtime)** detecta a placa → recorta → **EasyOCR** lê → heurística de placa BR → upload do recorte → **POST** pra API.
- **Detalhes de IA defensáveis:**
  - YOLOv8 exportado pra **ONNX** (input 640×640 com *letterbox*, confiança mín. **0.5**, NMS IoU **0.45**). ONNX = inferência portátil, roda em **CPU** (padrão) ou GPU.
  - OCR: pré-processamento OpenCV em 5 etapas — grayscale → **CLAHE** (contraste local) → upscale 2× → **filtro bilateral** (suaviza ruído preservando bordas) → **threshold de Otsu** (binarização). Depois, correção posicional pro formato BR (`AAA0000`/`AAA0A00`): força letra nas 3 primeiras posições e dígito nos dígitos; a 5ª posição fica intacta pra suportar Mercosul. Valida **7 caracteres**.
- **Resiliência:** retry no Redis (10× / 3s); evento inválido, download falho, placa não detectada ou OCR ≠ 7 chars → **log + skip** (não trava a fila); API fora → warning, continua.

### vc-api-core — API REST transacional
- **O que é:** FastAPI; recebe os registros do worker, persiste em **MySQL** e expõe consultas pro frontend.
- **Arquitetura Hexagonal (Ports & Adapters):** domínio puro (entidades, enums, métricas) isolado da infra por interfaces (portas); adaptadores concretos para SQLAlchemy/MinIO/Redis/Docker. **Regra de dependência aponta pra dentro** — o domínio nunca importa infra.
- **Endpoints-chave:** `POST /api/vagas/registro` (registra) · `GET /api/vagas/registros` (lista) · `POST .../{id}/anotacao` (grava ground truth) · `GET /api/vagas/metricas` (métricas agregadas) · `DELETE /api/vagas/registros` (limpa tudo) · `POST/GET /api/admin/mock/{start,stop,status}` (controla o container do mock).
- **Métricas (domínio puro):** distância de **Levenshtein**, **CER** (Character Error Rate) e **acurácia estrita** OCR × placa anotada.
- **Decisão defensável:** a hexagonal permite plugar autenticação (JWT/API-Key) na camada de entrega **sem tocar** nos use cases — prova de desacoplamento. Hoje roda sem auth pra facilitar o dev local.

### vc-frontend — Dashboard
- **O que é:** dashboard de visualização e **depuração** do OCR.
- **Stack real:** **Vite 6 + React 19 + TypeScript + Tailwind v4** · TanStack Query (polling 5s) · TanStack Router. *(Veja a §6 — o README está desatualizado dizendo Next.js.)*
- **4 páginas:** Painel Geral (stats + controle do mock + tabela) · Depurador OCR (master-detail, crop com zoom, char-diff, anotação com `J`/`K`) · Falhas e Descartes (frames rejeitados + diagnóstico) · Relatório de Acurácia (matriz de confusão + distribuição de erros).
- **Comunicação:** o browser chama `/api/*` **direto** via gateway Nginx (mesma origem, sem CORS, sem BFF).

---

## 4. Banco de perguntas & respostas

> Respostas curtas, prontas pra falar. Agrupadas por tema.

### Arquitetura & design
**P: Por que microsserviços e não um monolito?**
R: Isolamento de dependências (a IA carrega ONNX/EasyOCR, a API não precisa), escala independente (posso subir N workers sem tocar na API) e resiliência (um serviço cair não derruba os outros). A comunicação assíncrona por fila é o que sustenta isso.

**P: Por que uma fila (Redis) no meio?**
R: Pra desacoplar produção de consumo. Se chegam muitos carros de uma vez, a câmera não espera a IA — enfileira e o worker consome no seu ritmo. Também dá tolerância a falha: se o worker reinicia, os eventos ficam na fila.

**P: Por que arquitetura hexagonal só na API?**
R: A API é o serviço com **regra de negócio transacional** (placa duplicada, consolidação de métricas) e maior tendência a evoluir, então o investimento em desacoplamento se paga. Os outros serviços são pipelines lineares mais simples; aplicar hexagonal neles seria over-engineering. *(Honestidade técnica > consistência cega.)*

**P: O que acontece se o worker cair no meio do processamento?**
R: O evento já foi removido da fila com o BLPOP, então aquele frame específico se perde — é uma limitação consciente. Mitigação futura: usar um padrão de *acknowledgement* (ex.: Redis Streams com grupos de consumo) pra reprocessar em caso de falha.

### IA, OCR & métricas
**P: Por que YOLOv8 + EasyOCR, e não uma solução única?**
R: São problemas diferentes — **localizar** a placa no frame (detecção de objeto, YOLO) e **ler** o texto (reconhecimento, OCR). Separar dá pra otimizar e depurar cada etapa isolada; é justamente o que o nosso Depurador mostra.

**P: Por que exportar pra ONNX?**
R: Portabilidade e desempenho de inferência. O modelo treina em PyTorch (`.pt`), mas roda em produção via ONNX Runtime — mesma rede, sem o peso do PyTorch no container, e com o mesmo código rodando em CPU ou GPU.

**P: Como medem a qualidade do OCR?**
R: Anotamos o **ground truth** (placa real) em cada registro e comparamos com **distância de Levenshtein**, **CER** e **acurácia estrita** (acertou a placa inteira ou não). Tudo visível no Relatório de Acurácia.

**P: Por que a heurística de correção de placa brasileira?**
R: O OCR confunde caracteres parecidos (`O`↔`0`, `I`↔`1`, `S`↔`5`). Como a placa BR tem formato fixo (3 letras + dígitos), sabemos qual posição **deve** ser letra ou número e corrigimos no contexto. Aumenta a acurácia sem retreinar o modelo.

**P: Roda em GPU?**
R: O padrão é **CPU** (todo o time roda assim, sem dependência de hardware). Tem um override de Docker Compose que ativa CUDA se houver GPU NVIDIA — mas é opcional.

### Dados & API
**P: O que fica salvo e onde?**
R: Os metadados do registro (placa, confiança, câmera, timestamp, status, URLs) no **MySQL**; as imagens (frame e recorte da placa) no **MinIO**. O frontend lê só os metadados via API.

**P: Como tratam placa duplicada?**
R: Há um use case (`ProcessarRegistro`) que aplica a regra antes de persistir — é lógica de **domínio**, não fica espalhada no router nem no banco.

### Infra & segurança
**P: O sistema tem autenticação?**
R: Hoje não, pra facilitar o desenvolvimento local — é uma decisão consciente de escopo de TCC. A arquitetura hexagonal já está preparada pra plugar JWT/API-Key na camada de entrega sem alterar a lógica de negócio.

**P: O Redis/banco estão expostos?**
R: Não. Só o Nginx (porta 80) é exposto. Redis e MySQL vivem na rede Docker interna; o Redis ainda exige senha e não publica porta no host.

**P: Por que o Nginx na frente?**
R: É o gateway único: faz reverse-proxy, roteia `/api/*` pra API e `/` pro frontend, aplica **rate limiting** (10 req/s, burst 20) e centraliza a entrada. Isso é o que elimina CORS no frontend (mesma origem).

### Escopo & futuro
**P: Por que usam um mock de câmera e não uma câmera real?**
R: Pra demonstração reproduzível. O contrato é o evento na fila, então substituir o mock por um feed RTSP real não muda nenhum outro serviço — o que valida o desacoplamento do desenho.

**P: O que falta pra produção?**
R: Autenticação, ingestão RTSP real, reprocessamento com ack na fila, e o refino de OCR do roadmap. A base arquitetural já comporta isso sem reescrever.

**P: Qual foi o maior desafio técnico?**
R: *(escolham um real e sejam específicos)* — ex.: a acurácia do OCR em placas reais, que motivou a heurística BR e o Depurador visual; ou orquestrar a ordem de subida e a rede compartilhada entre os serviços no Docker Compose.

---

## 5. Checklist da demo ao vivo

### Antes da defesa (com calma, no lab)
- [ ] `parking-infra` no ar (`docker compose up -d`) — **sobe primeiro** (rede + Redis + Nginx).
- [ ] `vc-api-core` no ar e migrações aplicadas (`alembic upgrade head`).
- [ ] `vc-worker-portaria` no ar (modelo `.onnx` presente em `models/`).
- [ ] `vc-frontend` buildado e servido pelo Nginx.
- [ ] `vc-camera-mock` pronto (com imagens no `dataset/`) — mas **comece com ele parado**.
- [ ] Abra `http://localhost` e confirme que o dashboard carrega.
- [ ] **Limpe os dados** (botão Limpar / `DELETE /api/vagas/registros`) pra começar do zero na frente da banca.
- [ ] **Vídeo de fallback** aberto numa aba/arquivo, pronto pra dar play.

### Durante (ordem sugerida — ~3:30)
1. Abrir o ambiente pelo botão do slide 6.
2. **Iniciar o mock** pelo Painel Geral → frames começam a entrar.
3. Mostrar **registros chegando** na tabela (o polling de 5s atualiza sozinho).
4. Ir ao **Depurador OCR**: crop YOLO × binarizada, char-diff vs ground truth (`J`/`K`).
5. Mostrar **Relatório de Acurácia** (Levenshtein/CER).
6. **Parar o mock** ao fim, pra não poluir.

### Plano B — quando cortar pro vídeo
> **Gatilho claro:** se em **~20 segundos** o `http://localhost` não abrir, ou os registros não aparecerem após iniciar o mock — **não insista, não debugue na frente da banca.** Frase pronta:
>
> *"Pra não gastar o tempo de vocês com infraestrutura, gravamos essa mesma demonstração — vou mostrar o sistema rodando no vídeo."*
>
> Dê play no vídeo e narre por cima usando o mesmo roteiro de 6 passos acima.

---

## 6. Caixa de areia (fatos que podem te derrubar)

> Coisas que, se a banca cutucar, você precisa saber **antes**.

- **Frontend NÃO é Next.js.** O `README.md` do `vc-frontend` está desatualizado (diz "Next.js 15 / BFF"). O stack **real** (ver `CLAUDE.md`/`AGENTS.md`) é **Vite 6 + React 19 + TypeScript + Tailwind v4**, e **não há camada BFF** — o browser fala direto com a API via Nginx. **Se perguntarem, responda o stack real.** *(Vale corrigir o README antes da defesa.)*
- **Arquitetura hexagonal existe só no `vc-api-core`.** Não diga "o sistema é hexagonal" — diga "a API é hexagonal". Os outros serviços são pipelines lineares simples (e isso é uma decisão justificada, ver Q&A).
- **GPU é opcional.** O padrão é CPU. Não venda "rodamos em GPU" como se fosse o normal.
- **O worker manda o registro pra API pela rede interna** (`api_core:8000`). O dado do worker→API não passa pelo rate-limit do Nginx; o rate-limit protege o acesso externo (`/api/*` via porta 80). Se perguntarem do rate limit, é sobre o tráfego que entra pela borda.
- **"Tempo real" é orientado a eventos, não streaming.** O worker processa frame a frame ao consumir a fila (BLPOP), não um stream de vídeo contínuo. Seja preciso nessa palavra.
- **O dashboard atualiza por polling (5s), não por WebSocket.** Se alguém perguntar "é push?", a resposta honesta é polling com TanStack Query — simples e suficiente pro volume atual; WebSocket seria evolução futura.
- **CLAHE já está em produção (não confundir com o roadmap).** O pré-processamento real é grayscale → CLAHE → upscale 2× → **filtro bilateral** → Otsu. Dois cuidados: (1) o slide 7 fala em *refinar* esses filtros, não introduzi-los; (2) não chame o passo de suavização de "blur" — é **filtro bilateral**, escolhido por preservar as bordas dos caracteres (um blur comum pioraria o OCR). *(O CLAUDE.md do worker descreve isso de forma imprecisa — confie no código: `image_utils.py`.)*

---

*Bons ensaios. Rodem o slide 5 (pipeline) e a demo pelo menos 2× cada antes da defesa — são os dois pontos onde o tempo escapa.*
