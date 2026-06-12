# Roteiro de Animação — Slide Pipeline

**Controle:** apresentador avança com `Enter` ou `↓`
**Reset:** `Escape` volta ao estado inicial (para ensaio)
**Navegação de slides:** `→` / `Space` (bloqueados durante animação em andamento)

---

## Fases e Passos

### Fase Externa — cena da portaria

**① Carro chega**
Carro entra em quadro da esquerda e para na área de leitura (antes da cancela).

**② Câmera detecta**
Cone da câmera acende em direção ao carro. Badge "PLACA DETECTADA" aparece sobre o veículo.

> *→ crossfade automático: cena externa faz fade-out, diagrama do pipeline faz fade-in*

---

### Fase Pipeline — diagrama interno

**③ Camera Mock → MinIO**
Aresta `cam → minio` anima (partícula percorre o caminho). Nó MinIO acende.
Operação: `S3 PUT` — frame da câmera salvo no object storage.

**④ Camera Mock → Redis**
Aresta `cam → redis` anima. Nó Redis acende.
Operação: `LPUSH` — evento de detecção enfileirado.

**⑤ Redis → Worker**
Aresta `redis → worker` anima. Nó Worker acende.
Operação: `BLPOP` — worker consome o evento da fila.

**⑥ Worker → MinIO** *(corrigido — estava ausente na v1)*
Aresta `worker → minio` anima (sentido inverso, S3 GET).
Operação: `S3 GET` — worker recupera o frame salvo para processar (YOLOv8 + EasyOCR).

**⑦ Worker → API**
Aresta `worker → api` anima. Nó API acende.
Operação: `HTTP POST` — resultado do OCR enviado para a API.

**⑧ API → Dashboard**
Aresta `api → dashboard` anima. Nó Dashboard acende.
Operação: `HTTP GET` — dashboard confirma via polling (5s).

> *→ crossfade automático: diagrama faz fade-out, cena externa faz fade-in*

---

### Fase Conclusão — retorno à portaria

**⑨ Cancela abre**
Cancela anima para cima. Badge "ACESSO LIBERADO ✓" aparece.
Carro avança e sai de quadro pela direita.

---

## Resumo

| # | Fase | Ação | Tecla |
|---|------|------|-------|
| ① | Externa | Carro chega e para | Enter/↓ |
| ② | Externa | Câmera detecta placa | Enter/↓ |
| — | — | *crossfade automático → pipeline* | — |
| ③ | Pipeline | cam → MinIO (S3 PUT) | Enter/↓ |
| ④ | Pipeline | cam → Redis (LPUSH) | Enter/↓ |
| ⑤ | Pipeline | Redis → Worker (BLPOP) | Enter/↓ |
| ⑥ | Pipeline | Worker → MinIO (S3 GET) | Enter/↓ |
| ⑦ | Pipeline | Worker → API (HTTP POST) | Enter/↓ |
| ⑧ | Pipeline | API → Dashboard (polling) | Enter/↓ |
| — | — | *crossfade automático → cena* | — |
| ⑨ | Conclusão | Cancela abre, carro sai | Enter/↓ |

**Total: 9 avanços manuais** (era 8 na v1 — o passo ⑥ S3 GET estava ausente)

---

## Notas para implementação v2

- Crossfades são automáticos ao trocar de fase — não exigem tecla extra
- O passo ⑥ (Worker → MinIO, S3 GET) representa a leitura do frame para OCR — é a conexão que estava faltando na v1
- O diagrama precisa ter a aresta bidirecional cam↔MinIO (PUT na ida, GET pelo worker) ou duas arestas distintas
- Paleta de acento: `#07EF5C` (neon green VisionCore) para partícula, glow dos nós ativos e indicador de progresso
