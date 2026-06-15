# Guia de Estudo Técnico — VisionCore LPR

> Companheiro do [roteiro-defesa.md](roteiro-defesa.md). Aqui não é guia de palco — é material de **estudo prévio**.
> Leia dias antes, em voz alta, até cada conceito conectar com o nosso sistema.
>
> Cada termo tem 3 camadas:
> 1. **Em uma frase** — o conceito, assumindo que você é da área.
> 2. **No VisionCore** — onde isso vive no *nosso* sistema e por que escolhemos.
> 3. **Se cutucarem** — a profundidade defensável + a pegadinha a evitar.

---

## 1. Infra & Rede

### Nginx / reverse proxy / gateway
1. **Em uma frase:** um servidor que fica na frente dos outros e encaminha cada requisição pro serviço certo (reverse proxy). "Gateway" é o papel dele de ser a **porta única** de entrada.
2. **No VisionCore:** é o único serviço exposto (porta 80). Ele olha a URL: `/api/*` vai pro `api_core:8000`, e `/` vai pro frontend. Sem ele, o browser teria que falar com dois serviços em portas diferentes.
3. **Se cutucarem:** *forward proxy* protege o cliente (esconde quem navega); *reverse proxy* protege/abstrai o servidor (o cliente nem sabe quantos serviços existem atrás). Ganhos concretos no nosso caso: **origem única** (mata CORS), **rate limiting** centralizado e um só ponto pra TLS no futuro. Pegadinha: o Nginx **não** processa nada do pipeline — ele só roteia HTTP; não confunda com o Redis (que é quem desacopla a IA).

### Rate limiting
1. **Em uma frase:** limitar quantas requisições por segundo um cliente pode fazer.
2. **No VisionCore:** o Nginx aplica **10 req/s com burst de 20** nas rotas `/api/*`. Protege a API de ser inundada.
3. **Se cutucarem:** "burst" é uma folga — permite picos curtos acima do limite (algoritmo *leaky/token bucket*) antes de começar a recusar com `503`. Pegadinha: isso protege a **borda** (tráfego externo pela porta 80); o worker que posta na API fala pela rede interna e não passa por esse limite.

### Docker / container / imagem / Compose
1. **Em uma frase:** container = processo isolado com seu próprio sistema de arquivos e dependências; imagem = o "molde" do container; Compose = orquestrador declarativo de vários containers.
2. **No VisionCore:** cada serviço é um container. O worker carrega ONNX/EasyOCR no *dele*; a API nem sabe que isso existe. O Compose sobe tudo e conecta na mesma rede.
3. **Se cutucarem:** container **não** é VM — compartilha o kernel do host, por isso é leve. Pegadinha clássica: "container é máquina virtual" → não, é isolamento de processo (namespaces + cgroups), sem SO convidado.

### Rede Docker interna (`parking_global_net`) / CORS
1. **Em uma frase:** uma rede virtual onde os containers se enxergam pelo **nome do serviço** (ex.: `api_core`), isolada do mundo externo.
2. **No VisionCore:** Redis, MySQL, MinIO, API e worker conversam só por dentro dessa rede. CORS não aparece porque o browser sempre fala com a **mesma origem** (a porta 80 do Nginx).
3. **Se cutucarem:** CORS é uma trava do *browser* contra requisições para origens diferentes (protocolo+host+porta). Como tudo sai do mesmo `http://localhost`, não há "origem cruzada". Pegadinha: CORS é problema de browser, não de servidor — o worker (que não é browser) nunca esbarra nisso.

---

## 2. Mensageria & Storage

### Redis / message broker / fila
1. **Em uma frase:** Redis é um banco em memória chave-valor; aqui usamos uma de suas estruturas (lista) como **fila de mensagens** entre produtor e consumidor.
2. **No VisionCore:** a câmera **produz** ("tem frame novo") e o worker **consome**. A fila no meio é o que torna a comunicação **assíncrona** — a câmera não espera a IA terminar.
3. **Se cutucarem:** por que fila e não chamar a IA direto? Porque se chegam 10 carros juntos, a câmera enfileiraria sem travar e o worker processa no ritmo dele (*back-pressure*). Pegadinha: estamos usando **fila** (um consumidor pega cada mensagem), não **pub/sub** (todos recebem). Lista Redis = fila.

### LPUSH / BLPOP (e por que "bloqueante")
1. **Em uma frase:** `LPUSH` insere na fila; `BLPOP` retira — e o "B" significa que ele **bloqueia** esperando, em vez de ficar perguntando "tem algo?" toda hora.
2. **No VisionCore:** a câmera dá `LPUSH`; o worker fica parado no `BLPOP` e acorda no instante em que chega um evento. É **orientado a eventos**, latência baixa, zero CPU desperdiçada com polling.
3. **Se cutucarem:** a alternativa seria *polling* (loop perguntando a cada X ms) — gasta CPU e adiciona latência. Pegadinha: como o `BLPOP` remove a mensagem na hora, se o worker morre no meio do processamento aquele frame se perde (limitação consciente; mitigação futura = Redis Streams com *ack*).

### MinIO / object storage / bucket / S3
1. **Em uma frase:** armazenamento de **objetos** (arquivos) acessível por API HTTP, compatível com o protocolo S3 da AWS. "Bucket" é o contêiner lógico dos objetos.
2. **No VisionCore:** guarda os **frames** (escritos pela câmera) e os **recortes de placa** (escritos pelo worker), no bucket `plate-bucket`. O banco guarda só os metadados + a URL da imagem.
3. **Se cutucarem:** por que não salvar imagem no MySQL? Bancos relacionais são ruins para *blobs* grandes — incham, ficam lentos, atrapalham backup. Storage de objeto é feito pra isso e escala horizontalmente. Pegadinha: "S3" é o protocolo/serviço da AWS; MinIO é uma implementação **self-hosted** compatível com a mesma API.

---

## 3. Visão Computacional (detecção)

### YOLOv8 / detecção de objeto / bounding box / confiança
1. **Em uma frase:** YOLO ("You Only Look Once") é uma rede que, numa única passada, devolve **caixas** (bounding boxes) ao redor dos objetos e um **score de confiança** de cada uma.
2. **No VisionCore:** ele **localiza a placa** dentro do frame (não lê o texto — isso é o OCR depois). Usamos confiança mínima **0.5**: abaixo disso, descartamos.
3. **Se cutucarem:** "You Only Look Once" = faz detecção em um forward pass só (rápido), diferente de abordagens em dois estágios. Bounding box = `(x, y, largura, altura)`. Pegadinha: separar **detectar** (YOLO) de **ler** (OCR) é decisão de design — permite otimizar e *depurar* cada etapa isolada (é o que o nosso Depurador mostra).

### NMS (Non-Maximum Suppression) / IoU
1. **Em uma frase:** NMS remove caixas duplicadas que apontam pro mesmo objeto, mantendo só a de maior confiança; IoU mede o quanto duas caixas se sobrepõem.
2. **No VisionCore:** a YOLO costuma cuspir várias caixas pra mesma placa; o NMS limpa isso. Usamos IoU **0.45** como limiar de "é a mesma placa".
3. **Se cutucarem:** **IoU = Intersection over Union** = área de interseção ÷ área de união (0 a 1). Se duas caixas têm IoU acima de 0.45, o NMS assume que são o mesmo objeto e descarta a de menor confiança. Pegadinha: sem NMS, a mesma placa apareceria várias vezes.

### Letterbox
1. **Em uma frase:** redimensionar a imagem pro tamanho que o modelo espera (640×640) **mantendo a proporção**, preenchendo o resto com borda.
2. **No VisionCore:** o frame da câmera não é 640×640; o letterbox ajusta sem **distorcer** a placa (esticar deformaria os caracteres e pioraria detecção e OCR).
3. **Se cutucarem:** a alternativa ingênua (resize direto pra 640×640) deforma a proporção. Letterbox adiciona padding (barras) pra encaixar sem esticar — daí o nome (como as barras pretas de cinema). Pegadinha: depois é preciso "desfazer" o letterbox pra mapear a caixa de volta às coordenadas do frame original.

### ONNX / ONNX Runtime / inferência / CPU vs GPU
1. **Em uma frase:** ONNX é um **formato aberto** de modelo; o ONNX Runtime é o motor que executa esse modelo (inferência) de forma portátil.
2. **No VisionCore:** treinamos/obtivemos o modelo em PyTorch (`.pt`) e **exportamos pra `.onnx`**. O worker roda a inferência via ONNX Runtime — leve, sem carregar o PyTorch inteiro no container.
3. **Se cutucarem:** "inferência" = usar o modelo já treinado pra prever (≠ treinar). O mesmo `.onnx` roda em **CPU** (nosso padrão, sem depender de hardware) ou **GPU/CUDA** (override opcional do Compose). Pegadinha: não vendam GPU como o normal — o padrão do time é CPU.

---

## 4. OCR & Pré-processamento de Imagem

> Intuição geral: o OCR erra menos quando a imagem chega "limpa" — alto contraste, texto preto em fundo branco. O pré-processamento existe pra entregar isso.

### EasyOCR / OCR
1. **Em uma frase:** OCR (Optical Character Recognition) converte pixels de texto em **caracteres**; EasyOCR é a biblioteca que usamos.
2. **No VisionCore:** recebe o **recorte da placa** (vindo da YOLO) e devolve o texto. Roda em PT+EN com heurística pra placa brasileira.
3. **Se cutucarem:** o OCR confunde caracteres parecidos (`O`↔`0`, `I`↔`1`, `S`↔`5`). Por isso aplicamos correção **posicional** (`corrigir_placa`): limpa não-alfanuméricos, pega os **últimos 7** caracteres, e força letra nas posições 1-3 e dígito nas posições 4, 6 e 7. Pegadinha: a **5ª posição é deixada intacta de propósito** — porque no padrão Mercosul (`AAA0A00`) ela é letra e no padrão antigo (`AAA0000`) é dígito; forçar quebraria um dos dois. Não é o modelo que "sabe" o formato BR, é a nossa lógica depois.

### O pré-processamento, na ordem real (grayscale → CLAHE → upscale 2× → filtro bilateral → Otsu)
1. **Em uma frase:** uma sequência de filtros OpenCV que transforma o recorte colorido numa imagem binária (preto/branco) ótima pro OCR.
2. **No VisionCore** (`pre_processar_imagem_ocr`), exatamente nesta ordem:
   - **Grayscale** — tira a cor; ela não ajuda a ler texto e só adiciona ruído.
   - **CLAHE** — equaliza o contraste **localmente** pra compensar iluminação irregular e sombras (clipLimit 2.0, blocos 8×8). *Já é produção — ver abaixo.*
   - **Upscale 2×** (interpolação cúbica) — amplia; caracteres maiores são mais fáceis de reconhecer.
   - **Filtro bilateral** — suaviza ruído **preservando as bordas** dos caracteres.
   - **Threshold de Otsu** — **binariza**: cada pixel vira preto ou branco.
3. **Se cutucarem:** a ordem importa — CLAHE antes de ampliar; o bilateral *antes* do Otsu evita que ruído vire pontos pretos espúrios. Pegadinha importante: **não chame de "blur"**. É um **filtro bilateral**, escolhido justamente porque **não** borra as bordas — um blur comum (gaussiano) borraria os contornos dos caracteres e pioraria o OCR. O bilateral só suaviza onde a cor é parecida, mantendo as transições nítidas.

### Binarização / threshold de Otsu
1. **Em uma frase:** binarizar = decidir, pra cada pixel, se ele é preto ou branco a partir de um **limiar**. Otsu é um método que **calcula esse limiar automaticamente**.
2. **No VisionCore:** entrega ao OCR exatamente o que ele quer — texto em alto contraste. O Otsu escolhe o corte sem a gente chutar um número fixo.
3. **Se cutucarem:** Otsu analisa o **histograma** da imagem e acha o limiar que **maximiza a separação** entre os dois grupos de pixels (minimiza a variância intra-classe). Pegadinha: threshold fixo (ex.: 127) quebra com mudança de iluminação; Otsu se adapta a cada recorte.

### CLAHE *(em produção — etapa 2 do pré-processamento)*
1. **Em uma frase:** equalização de histograma **adaptativa por regiões**, pra realçar contraste local sem estourar a imagem inteira.
2. **No VisionCore:** **já é usado hoje** (clipLimit 2.0, tileGridSize 8×8), logo após o grayscale, pra normalizar iluminação e sombras antes de binarizar.
3. **Se cutucarem:** "Contrast Limited Adaptive Histogram Equalization" — divide a imagem em blocos (tiles), equaliza o histograma de cada um e **limita** (clip) o contraste pra não amplificar ruído. Pegadinha: **já usamos CLAHE** — o que o slide 7 (próximos passos) propõe é *refinar* o pré-processamento, não introduzir CLAHE do zero. Se a banca perguntar "o que falta no pré-processamento?", a resposta é tuning de parâmetros e a classificação pré-binarização, não "adicionar CLAHE".

---

## 5. Métricas de Avaliação

### Ground truth
1. **Em uma frase:** o valor **real/correto** anotado manualmente, usado como gabarito pra medir o modelo.
2. **No VisionCore:** anotamos a placa real de cada registro (`POST /api/vagas/registros/{id}/anotacao`) e comparamos com o que o OCR leu.
3. **Se cutucarem:** sem ground truth não há como medir acurácia — você só teria a leitura, não saberia se está certa. Pegadinha: é trabalho **manual**; por isso as métricas só existem sobre os registros anotados.

### Distância de Levenshtein
1. **Em uma frase:** o número **mínimo de edições** (inserir, apagar ou trocar um caractere) pra transformar uma string na outra.
2. **No VisionCore:** mede o quão **longe** a leitura do OCR ficou da placa real. `ABC1234` vs `ABC1Z34` → distância **1** (uma troca).
3. **Se cutucarem:** é calculado por programação dinâmica (matriz entre as duas strings). Exemplo pra ter na ponta da língua: `ABC1234` → `AB01234` tem distância **2** (trocou `C`→`0` e... não — confira: posição 3 `C`→`0` é 1 troca; só isso = distância **1**). Use o exemplo simples do item 2. Pegadinha: é distância de **edição**, não "quantos caracteres diferentes na mesma posição".

### CER (Character Error Rate)
1. **Em uma frase:** a distância de Levenshtein **normalizada** pelo tamanho da placa real → erro por caractere, de 0 a 1.
2. **No VisionCore:** `CER = Levenshtein / nº de caracteres do ground truth`. Para `ABC1234` (7 chars) com 1 erro → CER ≈ **0.14** (14%).
3. **Se cutucarem:** normalizar permite **comparar** leituras de tamanhos diferentes (uma placa com 1 erro em 7 não é igual a 1 erro em 3). `1 - CER` ≈ taxa de acerto por caractere. Pegadinha: CER é **por caractere**; a acurácia estrita é **por placa inteira** — são coisas distintas.

### Acurácia estrita
1. **Em uma frase:** percentual de placas lidas **100% corretas** (tudo ou nada, a placa inteira).
2. **No VisionCore:** métrica mais dura — `ABC1Z34` quando o certo é `ABC1234` conta como **erro total**, mesmo com 6 de 7 certos.
3. **Se cutucarem:** é a métrica que importa pro caso de uso real (uma placa com 1 char errado já não serve pra liberar acesso). Pegadinha: por isso reportamos as **duas** — CER mostra o "quão perto", acurácia estrita mostra o "serviu ou não".

---

## 6. API & Arquitetura de Software

### REST / HTTP / FastAPI / endpoint
1. **Em uma frase:** REST é um estilo de API sobre HTTP onde **recursos** (registros, métricas) são acessados por **verbos** (GET lê, POST cria, DELETE apaga); FastAPI é o framework Python que usamos.
2. **No VisionCore:** o worker faz `POST /api/vagas/registro` pra criar; o frontend faz `GET /api/vagas/registros` pra listar. Cada rota dessas é um *endpoint*.
3. **Se cutucarem:** FastAPI valida a entrada automaticamente via **Pydantic** (schema) e gera doc Swagger sozinho. Pegadinha: o `status` HTTP comunica resultado (`201 Created`, `200 OK`, `503`) — não confunda com o `status` da placa (`sucesso`/`filtrado`), que é dado de negócio.

### Arquitetura Hexagonal (Ports & Adapters)
1. **Em uma frase:** separar a **lógica de negócio** (núcleo) das **dependências externas** (banco, fila, storage) por meio de **interfaces** — o núcleo define o contrato, a infra implementa.
2. **No VisionCore:** só o `vc-api-core` usa isso. O domínio (regras, métricas) não importa SQLAlchemy nem MinIO; ele conhece só as *portas* (interfaces), e os *adapters* plugam a implementação real.
3. **Se cutucarem:** analogia da tomada — o aparelho (núcleo) define o formato do plugue (porta); qualquer adaptador que encaixe serve (SQLAlchemy hoje, outro banco amanhã) **sem mexer no núcleo**. Prova prática: dá pra plugar autenticação ou trocar o banco sem tocar nos *use cases*. Pegadinha: **não** é "o sistema é hexagonal" — é "a **API** é hexagonal"; os outros serviços são pipelines lineares (e tudo bem, seria over-engineering aplicar lá).

### ORM / SQLAlchemy / MySQL / migrações (Alembic)
1. **Em uma frase:** ORM mapeia tabelas do banco para objetos do código; SQLAlchemy é o ORM, MySQL o banco, Alembic gerencia as **migrações** (evolução versionada do schema).
2. **No VisionCore:** a tabela `registros_placas` é manipulada como objetos Python; mudanças de schema viram arquivos de migração versionados, nunca `ALTER TABLE` solto.
3. **Se cutucarem:** migração = "git pro schema do banco" — `alembic upgrade head` aplica, `downgrade` reverte. Pegadinha: ORM não é o banco; é a camada de tradução. O banco continua sendo MySQL.

### Polling vs WebSocket
1. **Em uma frase:** polling = o cliente pergunta de tempos em tempos "tem novidade?"; WebSocket = conexão aberta onde o servidor **empurra** a novidade.
2. **No VisionCore:** o dashboard usa **polling de 5s** (via TanStack Query) — simples e suficiente pro volume atual.
3. **Se cutucarem:** WebSocket seria mais "tempo real" e econômico em alto volume, mas adiciona complexidade (conexão persistente, reconexão). Pegadinha: se perguntarem "é push?", a resposta honesta é **não, é polling** — e a justificativa é simplicidade adequada ao escopo.

---

## 7. Mapa mental de 1 minuto (revisão final)

Decore este encadeamento — ele conecta quase tudo:

> A **câmera** (mock) sobe um **frame** no **MinIO** (object storage) e avisa via **fila Redis** (`LPUSH`).
> O **worker** estava **bloqueado** escutando (`BLPOP`), acorda, **baixa** o frame, roda **YOLOv8/ONNX**
> (detecta a placa → bounding box + confiança, limpa duplicatas com **NMS**), recorta, **pré-processa**
> (grayscale → **CLAHE** → upscale 2× → **filtro bilateral** → **Otsu**) e passa pro **EasyOCR**, que lê o texto. O resultado vai por
> **HTTP POST** pra **API FastAPI** (arquitetura **hexagonal**), que persiste no **MySQL**. O **dashboard**
> React faz **polling** a cada 5s e mostra — e o **Nginx** na frente é quem roteou tudo isso pela porta 80.
> A qualidade é medida com **Levenshtein/CER** contra o **ground truth** anotado.

Se você consegue narrar esse parágrafo **com suas palavras**, explicando cada termo em negrito quando parar nele, você está pronto.
