/* ==========================================================================
   VisionCore — Banco de dados técnico + Pool de eventos do log
   ========================================================================== */

window.VC_TECH = {
  fastapi: {
    tag: "DECISÃO · BACKEND ASYNC",
    title: "FastAPI · core transacional",
    body: "Escolhido em vez de Flask/Django pelo suporte nativo a async/await sob Uvicorn (ASGI). Roteamento declarativo, validação via Pydantic e OpenAPI auto-gerado. Um detalhe técnico relevante: o socket /var/run/docker.sock é montado no contêiner da API, permitindo gerenciar programaticamente o ciclo de vida do camera_mock.",
    code: `# src/modules/admin/router.py
@router.post("/mock/start")
async def start_camera_mock(
    user: User = Depends(get_admin_user)
):
    try:
        container = docker_client.containers.get("vc_camera_mock")
        container.start()
        return {"status": "started", "id": container.id[:12]}
    except docker.errors.NotFound:
        raise HTTPException(404, "container ausente")`
  },
  yolo: {
    tag: "DECISÃO · INFERÊNCIA OTIMIZADA",
    title: "YOLOv8 exportado em ONNX Runtime",
    body: "PyTorch puro consome ~520MB de RAM com pesos carregados; o mesmo modelo exportado em ONNX cai para ~310MB com 1.3× mais throughput. Crítico para rodar em hardware comum sem GPU — viabiliza deploy on-premise em pátios sem servidor robusto.",
    code: `# src/worker/pipeline.py
import onnxruntime as ort
import easyocr

session = ort.InferenceSession(
    "models/yolov8n_plates.onnx",
    providers=["CPUExecutionProvider"]
)
reader = easyocr.Reader(["en"], gpu=False)

def run_inference(frame: np.ndarray):
    bbox = session.run(None, {"images": preprocess(frame)})
    crop = frame[bbox.y1:bbox.y2, bbox.x1:bbox.x2]
    text, conf = reader.readtext(crop)[0][1:]
    return text, conf`
  },
  redis: {
    tag: "DECISÃO · DESACOPLAMENTO",
    title: "Redis como broker de eventos LPR",
    body: "Alternativa óbvia seria RabbitMQ/Kafka — overkill para o volume real e mais um contêiner pesado de manter. Redis LPUSH/BLPOP cobre fila FIFO bloqueante com latência sub-milissegundo e já estaria na stack para cache. Decisão pragmática: menor superfície, menos peças móveis.",
    code: `# camera_mock/main.py
r = redis.Redis(host="redis_broker", port=6379)

payload = json.dumps({
    "frame_path": "dataset/frame_0234.jpg",
    "camera_id": "cam_portaria_01",
    "captured_at": datetime.utcnow().isoformat(),
})
r.lpush("camera:portaria:queue", payload)

# worker/main.py
while True:
    _, raw = r.blpop("camera:portaria:queue", timeout=0)
    process_frame(json.loads(raw))`
  },
  minio: {
    tag: "DECISÃO · MÍDIA SEPARADA DO DADO",
    title: "MinIO · armazenamento S3-compatível local",
    body: "Salvar binários (~2MB/frame) no MySQL inchasse o banco e tornaria backup inviável. MinIO fala protocolo S3 nativo, ficando a um setEndpoint() de migrar para AWS S3 em produção. O Nginx roteia /storage/* direto para o MinIO, sem passar pelo Python — frames servidos com latência mínima.",
    code: `# nginx/conf.d/default.conf
location /storage/ {
    proxy_pass http://minio:9000/;
    rewrite ^/storage/(.*)$ /$1 break;
    proxy_set_header Host $host;
}

# api/storage.py
s3 = boto3.client("s3", endpoint_url="http://minio:9000")
s3.upload_fileobj(
    Fileobj=crop_bytes,
    Bucket="plate-crops",
    Key=f"{camera_id}/{frame_id}.jpg",
)`
  },
  mysql: {
    tag: "DECISÃO · INTEGRIDADE TRANSACIONAL",
    title: "MySQL 8 com pool_pre_ping",
    body: "Para o tipo de query (cadastros de veículos, histórico de acessos, FK para mídia em S3), MySQL relacional é a escolha conservadora correta. O detalhe sênior é o pool_pre_ping do SQLAlchemy: cada checkout testa a conexão antes de usar, evitando 'MySQL server has gone away' após restarts do contêiner.",
    code: `# src/db/session.py
engine = create_engine(
    DATABASE_URL,
    pool_size=10,
    pool_pre_ping=True,   # << evita conexões mortas
    pool_recycle=3600,
)

class Registro(Base):
    __tablename__ = "registros"
    id = Column(Integer, primary_key=True)
    camera_id = Column(String(50), index=True)
    placa = Column(String(10), index=True)
    confianca = Column(Float)
    imagem_url = Column(String(255))
    data_hora = Column(DateTime, default=utcnow)`
  },
  nginx: {
    tag: "DECISÃO · PERÍMETRO ÚNICO",
    title: "Nginx Gateway com rate-limit",
    body: "Único contêiner exposto na porta 80. Tudo o mais (Redis, MySQL, MinIO, FastAPI) fica em rede Docker interna inacessível externamente. Rate limit zona api_limit aplicado em /api/ protege o backend de bursts maliciosos sem afetar tráfego de mídia em /storage/.",
    code: `# nginx.conf
limit_req_zone $binary_remote_addr
    zone=api_limit:10m rate=10r/s;

server {
    listen 80;

    location /api/ {
        limit_req zone=api_limit burst=20 nodelay;
        proxy_pass http://api_core:8000/;
    }

    location /storage/ {
        proxy_pass http://minio:9000/;
        rewrite ^/storage/(.*)$ /$1 break;
    }

    location / {
        proxy_pass http://vc_frontend:80/;
    }
}`
  }
};

/* ==========================================================================
   Pool de eventos do ops log — emitidos em rotação aleatória ponderada
   ========================================================================== */

window.VC_LOG_POOL = [
  { svc: "camera",   msg: "LPUSH camera:portaria:queue · frame_{F}.jpg" },
  { svc: "camera",   msg: "PUT s3://plate-bucket/frame_{F}.jpg · 1.8MB" },
  { svc: "camera",   msg: "heartbeat · cam_portaria_01 · {T}ms" },
  { svc: "redis",    msg: "queue depth: {D} items · backlog {B}ms" },
  { svc: "redis",    msg: "BLPOP timeout reset · client worker:1" },
  { svc: "redis",    msg: "memory_used: 4.2MB · uptime {U}s" },
  { svc: "worker",   msg: "YOLOv8 inference {T}ms · bbox conf {C}" },
  { svc: "worker",   msg: "EasyOCR readtext · {P} · conf {C}" },
  { svc: "worker",   msg: "PUT plate-crops/{F}.jpg · 184KB" },
  { svc: "worker",   msg: "POST /api/registros · 201 · {T}ms" },
  { svc: "api",      msg: "SELECT veiculos WHERE placa='{P}' · 1 row" },
  { svc: "api",      msg: "INSERT registros · id={R} · status=LIBERADO" },
  { svc: "api",      msg: "GET /api/registros · 200 · {T}ms" },
  { svc: "api",      msg: "auth.validate · token jwt · uid 42" },
  { svc: "minio",    msg: "audit · GET /plate-bucket/{F}.jpg · 200" },
  { svc: "minio",    msg: "audit · PUT /plate-crops/{F}.jpg · 200" },
  { svc: "mysql",    msg: "query exec {T}ms · table=registros" },
  { svc: "mysql",    msg: "connection pool · 4/10 in use" },
  { svc: "nginx",    msg: "{IP} GET /api/registros · 200" },
  { svc: "nginx",    msg: "{IP} POST /api/registros · 201 · upstream worker" },
  { svc: "nginx",    msg: "rate-limit zone api_limit · ok" },
  { svc: "frontend", msg: "React Query · refetch /api/registros · OK" },
  { svc: "frontend", msg: "ws disconnect · fallback to polling" },
];

window.VC_PLATES = [
  "BRA3E99","RFM2A18","SPT4D77","RIO0X23","BHE8K05","CWB7P34","FLO9N12","VTR1M88","MGS6L42","NTL3J56"
];
