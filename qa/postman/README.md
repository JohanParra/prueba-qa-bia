# Postman · EnergIA

Colección y environment listos para importar. Reproducen **DEF-02** y **DEF-03** (ver [../05-defectos.md](../05-defectos.md)) contra la API local.

## Importar

1. Abre Postman → **Import**
2. Arrastra (o selecciona):
   - `EnergIA.QA.postman_collection.json`
   - `EnergIA.local.postman_environment.json`
3. En la esquina superior derecha, selecciona el environment **EnergIA · local**

## Orden sugerido

| # | Request | Resultado observado |
|---|---------|-------------|
| 1 | **Auth → Login OK** | Token se guarda solo en `access_token` |
| 2 | **DEF-02a · Buscar 109** | `count: 1`, M-109 CRITICAL |
| 3 | **DEF-02b · Buscar m-109** | `count: 0` ← bug |
| 4 | **DEF-03a · Detalle M-106** | `status: ALERT` (debería NORMAL) |
| 5 | **DEF-03c · Filtrar ALERT** | Incluye M-106 |

## Variables del environment

| Variable | Valor |
|----------|-------|
| `baseUrl` | `http://127.0.0.1:8080` |
| `email` | `admin@energia.local` |
| `password` | `admin123` |
| `access_token` | (se llena al hacer Login OK) |

## Alternativa: curl (si no usas Postman)

```bash
# 1. Login y guardar token
TOKEN=$(curl -s -X POST http://127.0.0.1:8080/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@energia.local","password":"admin123"}' \
  | jq -r .access_token)

# 2. DEF-02a — 109 OK
curl -s -X POST http://127.0.0.1:8080/api/v1/meter/getAll \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"filter":{"meter_id":"109"}}' | jq '{count, rows: [.rows[] | {meter_id, status}]}'

# 3. DEF-02b — m-109 BUG (count 0)
curl -s -X POST http://127.0.0.1:8080/api/v1/meter/getAll \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"filter":{"meter_id":"m-109"}}' | jq '{count}'

# 4. DEF-03 — M-106 status
curl -s http://127.0.0.1:8080/api/v1/meter/getById/M-106 \
  -H "Authorization: Bearer $TOKEN" | jq '{meter_id, status, anomaly_type: .anomaly.type}'
```

Script todo-en-uno: `./demo-defects.sh` (misma carpeta).
