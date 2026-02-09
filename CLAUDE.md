# CLAUDE.md — MCP Hudu Server

You are Claude Code. Generate and maintain a production-ready **MCP server** that wraps the **Hudu** API from `hudu.json` (Swagger/OpenAPI).

## Objective
Ship an MVP MCP server that:
- Conforms to the **LATEST MCP specification** (always current version - NO legacy versions).
- **ALWAYS uses the LATEST official MCP TypeScript SDK**: @modelcontextprotocol/sdk (update immediately when new versions available)
- **EXCLUSIVELY uses Streamable HTTP Transport** on port 3100 - **NO STDIO, NO SSE, HTTP ONLY**.
- Implements the **resource+action** pattern (predictable verbs across domains).
- Runs reliably in **Docker**, with health/readiness endpoints.
- Handles **partial API access** gracefully (typed errors, warnings, next steps).
- Uses **.env** for all Hudu config (no secrets in code).
- **MANDATORY**: Always update to latest packages - security and compatibility requirement.

---

## Environment & Configuration

Create a `.env` file from `.env.example`:

```bash
HUDU_BASE_URL=https://your-hudu.example.com
HUDU_API_KEY=your-api-key
HUDU_TIMEOUT=30000
MCP_SERVER_PORT=3100
LOG_LEVEL=info
```

Fail fast if required vars are missing. No hard-coded secrets.

---

## Connection from Claude Code (HTTP ONLY)

**ONLY HTTP transport is supported - no STDIO configuration:**

Add MCP server to Claude Code:

```bash
claude mcp add --transport http hudu http://127.0.0.1:3100/mcp
```

Alternative Claude Desktop config:
```json
{
  "mcpServers": {
    "hudu": {
      "transport": "http",
      "url": "http://127.0.0.1:3100/mcp"
    }
  }
}
```

**IMPORTANT:** Never configure STDIO transport. This server only supports HTTP.

---

## Deliverables (what you should generate)

- `src/server.ts` — MCP HTTP server wiring (Streamable transport), health endpoints:
  - `GET /health` (liveness)
  - `GET /` (server info)
  - `ALL /mcp` (MCP endpoint)
- `src/hudu-client.ts` — Hudu API client with typed methods
- `src/tools/*` — 33 tools com prefixo `hudu_` e padrão `manage/search`:
  - **Core**: articles, companies, assets, passwords (manage + search = 8 tools)
  - **Procedures**: procedures, procedure tasks (manage + search = 4 tools)
  - **Folders**: kb article folders (manage + search = 2 tools)
  - **Networks**: networks, VLANs, VLAN zones, IP addresses (manage + search = 8 tools)
  - **Storage**: uploads, rack storages, rack items, public photos (manage + search = 8 tools)
  - **Utility**: admin, search global, navigation (3 tools)
- `src/types.ts` — TypeScript types from OpenAPI
- `hudu.json` — OpenAPI/Swagger spec (reference only)
- `Dockerfile` — Multi-stage build, non-root runtime
- `.env.example` — Environment template
- `docker-compose.yml` — Quick local testing
- `package.json` — scripts: `dev`, `build`, `start`, `lint`, `type-check`

---

## Project Structure (current)

```
.
├─ hudu.json
├─ src/
│  ├─ server.ts
│  ├─ index.ts
│  ├─ hudu-client.ts
│  ├─ types.ts
│  └─ tools/
│     ├─ working-index.ts   # Registro principal (33 tools)
│     ├─ index.ts            # Registro secundário
│     ├─ base.ts             # Helpers de resposta
│     ├─ schema-utils.ts     # Schemas compartilhados
│     ├─ articles.ts         # Artigos da base de conhecimento
│     ├─ companies.ts        # Empresas e organizações
│     ├─ assets.ts           # Ativos de TI
│     ├─ passwords.ts        # Senhas e credenciais
│     ├─ procedures.ts       # Procedimentos e tarefas
│     ├─ folders.ts          # Pastas de organização
│     ├─ networks.ts         # Redes, VLANs, IPs
│     ├─ storage.ts          # Uploads, racks, fotos
│     ├─ admin.ts            # Administração e auditoria
│     ├─ search.ts           # Busca global unificada
│     └─ navigation.ts       # Navegação rápida por nome
├─ .env.example
├─ Dockerfile
├─ docker-compose.yml
├─ tsconfig.json
├─ package.json
└─ CLAUDE.md
```

---

## Coding Standards

- **Language:** TypeScript with `"strict": true` (latest stable TypeScript version).
- **SDK:** **ONLY** the latest official MCP TypeScript SDK - always update immediately when new versions release.
- **Transport:** **EXCLUSIVELY** Streamable HTTP Transport via `StreamableHTTPServerTransport` - **NEVER STDIO, NEVER SSE**.
- **Pattern:** `hudu_<verbo>_<domínio>` naming para tools (ex: `hudu_manage_company_information`).
- **Validation:** Zod schemas for inputs/outputs (latest version).
- **Dependencies:** **ALWAYS** use latest stable versions of all packages - no pinning to old versions.
- **Errors:** Map Hudu 401/403/404/429/5xx → typed MCP errors with:
  - `message` (user-readable)
  - `code` (stable)
  - `warnings[]` (if partial)
  - `nextSteps[]` (remediation hints)
- **Logging:** Console.error for debugging (stderr), JSON logs for production.
- **Resilience:** Graceful handling of API permission errors, continue with partial results.
- **Security:** Environment-based config, no secrets in code or images.

---

## Build & Run

**Local (Node):**
```bash
npm install
npm run build
npm start
# or dev:
npm run dev
```

**Docker:**
```bash
docker-compose up --build -d
docker-compose logs -f
# or
docker build -t hudu-mcp-server .
docker run --rm --env-file .env -p 3100:3100 hudu-mcp-server
```

**PM2 (produção atual):**
```bash
pm2 start dist/index.js --name hudu-mcp
pm2 status
```

Health check:
- `GET http://localhost:3100/health` → 200 OK
- `GET http://localhost:3100/` → Server info

---

## Tool Contracts (33 tools registradas)

Todas as tools seguem as diretrizes de nomenclatura otimizadas para ToolRAG:
- **Prefixo**: `hudu_` (namespace do servidor)
- **Verbo**: `manage` (CRUD) ou `search` (consulta paginada)
- **Descrições**: pt-BR, substantivo-chave primeiro, 2-4 sinônimos de domínio
- **Parâmetros**: Todas as descrições em pt-BR

### Core Resources (8 tools)

| Tool Name | Tipo | Domínio |
|-----------|------|---------|
| `hudu_manage_knowledge_articles` | CRUD | Artigos, documentos, procedimentos |
| `hudu_search_knowledge_articles` | Query | Busca na base de conhecimento |
| `hudu_manage_company_information` | CRUD | Empresas, clientes, organizações |
| `hudu_search_company_information` | Query | Busca de empresas |
| `hudu_manage_it_asset_inventory` | CRUD | Ativos de TI, equipamentos, dispositivos |
| `hudu_search_it_asset_inventory` | Query | Busca no inventário de ativos |
| `hudu_manage_password_credentials` | CRUD | Senhas, credenciais, acessos |
| `hudu_search_password_credentials` | Query | Busca no cofre de senhas |

### Procedures (4 tools)

| Tool Name | Tipo | Domínio |
|-----------|------|---------|
| `hudu_manage_workflow_procedures` | CRUD | Procedimentos, rotinas, checklists |
| `hudu_search_workflow_procedures` | Query | Busca de procedimentos |
| `hudu_manage_procedure_task_items` | CRUD | Tarefas, etapas, passos |
| `hudu_search_procedure_task_items` | Query | Busca de tarefas |

### Folders (2 tools)

| Tool Name | Tipo | Domínio |
|-----------|------|---------|
| `hudu_manage_kb_article_folders` | CRUD | Pastas, diretórios, categorias |
| `hudu_search_kb_article_folders` | Query | Busca de pastas |

### Network Resources (8 tools)

| Tool Name | Tipo | Domínio |
|-----------|------|---------|
| `hudu_manage_network_documentation` | CRUD | Redes, sub-redes, segmentos |
| `hudu_search_network_documentation` | Query | Busca de redes |
| `hudu_manage_network_vlan_records` | CRUD | VLANs, segmentos virtuais |
| `hudu_search_network_vlan_records` | Query | Busca de VLANs |
| `hudu_manage_network_vlan_zones` | CRUD | Zonas de VLAN, perímetros |
| `hudu_search_network_vlan_zones` | Query | Busca de zonas |
| `hudu_manage_ip_address_records` | CRUD | Endereços IP, atribuições |
| `hudu_search_ip_address_records` | Query | Busca de IPs |

### Storage Resources (8 tools)

| Tool Name | Tipo | Domínio |
|-----------|------|---------|
| `hudu_manage_file_upload_records` | CRUD | Uploads, anexos, arquivos |
| `hudu_search_file_upload_records` | Query | Busca de uploads |
| `hudu_manage_rack_storage_locations` | CRUD | Racks, armários, datacenters |
| `hudu_search_rack_storage_locations` | Query | Busca de racks |
| `hudu_manage_rack_storage_items` | CRUD | Equipamentos montados em racks |
| `hudu_search_rack_storage_items` | Query | Busca de itens em racks |
| `hudu_manage_public_photo_gallery` | CRUD | Fotos públicas, imagens |
| `hudu_search_public_photo_gallery` | Query | Busca na galeria de fotos |

### Utility Tools (3 tools)

| Tool Name | Tipo | Domínio |
|-----------|------|---------|
| `hudu_admin_instance_operations` | Admin | Administração, auditoria, monitoramento |
| `hudu_search_all_resource_types` | Search | Busca global unificada |
| `hudu_navigate_to_resource_by_name` | Nav | Navegação rápida por nome |

### Padrão de Input (tools manage)

```json
{
  "action": "create | get | update | delete",
  "id": 123,
  "fields": { "name": "...", "company_id": 1 }
}
```

### Padrão de Input (tools search)

```json
{
  "search": "texto de busca",
  "page": 1,
  "page_size": 25,
  "company_id": 1
}
```

---

## Error Model

```json
{
  "code": "UNAUTHORIZED | FORBIDDEN | NOT_FOUND | RATE_LIMITED | SERVER_ERROR",
  "message": "Human-readable summary",
  "warnings": ["Partial results due to permissions"],
  "nextSteps": ["Check HUDU_API_KEY", "Verify permissions"]
}
```

---

## Implementation Checklist

✅ **Completed:**
1. Project scaffolding com TypeScript strict
2. Environment configuration (.env)
3. MCP SDK integration com Streamable HTTP Transport
4. Hudu API client com typed methods
5. 33 tools com padrão `hudu_manage/search_*` otimizado para ToolRAG
6. Error handling para acesso parcial à API
7. Docker configuration + PM2 em produção
8. Health endpoints (`/health`, `/`)
9. Nomenclatura de tools conforme diretrizes obrigatórias (substantivo-chave, sinônimos, pt-BR)
10. CORS, rate limiting e segurança de rede

⚠️ **Known Issues:**
- Password endpoints requerem permissões elevadas na API
- Alguns endpoints podem retornar 401 dependendo das permissões do usuário

---

## Testing Protocol

1. **Build**: `npm run build`
2. **Start (PM2)**: `pm2 restart hudu-mcp` ou `npm start`
3. **Health check**: `curl http://localhost:3100/health`
4. **Configure Claude Code (HTTP ONLY)**: `claude mcp add --transport http hudu http://127.0.0.1:3100/mcp`
5. **Test tools**: Use `hudu_search_all_resource_types`, `hudu_search_company_information`, etc. no Claude Code
6. **NEVER configure STDIO** - Only HTTP transport is supported
7. **Verify logs**: `pm2 logs hudu-mcp`

---

## Acceptance Criteria

- ✅ Starts with clear diagnostics if env is incomplete
- ✅ Health endpoint returns 200 OK
- ✅ Claude Code connects over HTTP transport
- ✅ Lists 33 tools via MCP protocol
- ✅ Successfully calls `hudu_search_all_resource_types` e demais tools
- ✅ Errors are typed and user-readable
- ✅ Handles partial API access gracefully
- ✅ Runs in Docker as non-root user

---

## Troubleshooting

- **401/403**: Verify `HUDU_API_KEY` and user permissions
- **Connection refused**: Verificar se PM2/Docker está rodando na porta 3100
- **No tools available**: Rebuild com `npm run build && pm2 restart hudu-mcp`
- **Partial results**: Some endpoints require elevated permissions - this is expected

---

## Current Status

**Working:**
- 33 tools registradas e disponíveis (nomenclatura ToolRAG-optimized)
- Streamable HTTP transport na porta 3100
- Busca global unificada via `hudu_search_all_resource_types`
- Navegação rápida via `hudu_navigate_to_resource_by_name`
- Graceful error handling para permissões parciais
- PM2 em produção, Docker disponível

**Diretrizes de Nomenclatura (2026-02):**
- Prefixo `hudu_` em todas as 33 tools
- Padrão `manage` (CRUD) e `search` (query paginada)
- Descrições em pt-BR com substantivo-chave primeiro
- 2-4 sinônimos de domínio nos primeiros 100 caracteres
- Todas as descrições de parâmetros em pt-BR
- Anti-boilerplate: frases compactas sem repetição
- Sem jargão interno da plataforma (ex: "card" substituído por "recurso")

**Latest requirements:**
- **ALWAYS** use latest MCP SDK version
- **EXCLUSIVELY** StreamableHTTPServerTransport - no STDIO support
- Single `/mcp` endpoint for all MCP communication
- Built-in session management with UUID
- **MANDATORY** latest package updates for security and compatibility
- Follow latest MCP specification from https://modelcontextprotocol.io/

---

**Build it, run the container, and test via Claude Code over HTTP. Keep SDK usage canonical, naming consistent, and errors helpful.**