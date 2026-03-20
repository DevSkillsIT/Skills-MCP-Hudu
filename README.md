<div align="center">

# 🚀 Skills MCP Hudu

### Complete Hudu MCP Server with 43 Tools, Markdown Output, MCP Resources, and Multi-Tenant Support

[![MCP Protocol](https://img.shields.io/badge/MCP-2024--11--05-blue)](https://modelcontextprotocol.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9+-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.21+-teal)](https://expressjs.com/)
[![Transport](https://img.shields.io/badge/Transport-HTTP%20Only-orange)](https://modelcontextprotocol.io/docs/concepts/transports)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)](https://github.com/DevSkillsIT/Skills-MCP-Hudu)

**Connect Claude Code, Gemini CLI, ChatGPT, VS Code Copilot, and Cursor to your Hudu instance**

[Features](#-key-features) • [Installation](#-installation) • [43 Tools](#-43-tools) • [Quick Start](#-quick-start) • [Support](#-support)

</div>

---

## 📖 About The Project

**Skills MCP Hudu** is a production-ready Model Context Protocol (MCP) server that provides complete integration with [Hudu](https://www.usehudu.com/) IT documentation platform. Built by **Skills IT**, a Managed Service Provider (MSP) from Brazil, this MCP enables AI assistants to seamlessly interact with your IT documentation, passwords, assets, and procedures.

### 🌟 Why This MCP?

Built specifically for **MSPs and IT teams** who need AI-powered access to their Hudu documentation:

| Feature | Description |
|---------|-------------|
| **43 Tools** | Complete Hudu API coverage with 10 new tool categories |
| **Markdown Output** | All responses formatted as Markdown tables (not raw JSON) |
| **MCP Resources** | 6 native `hudu://` URIs for direct data access |
| **Tool Annotations** | `readOnlyHint`, `destructiveHint`, `openWorldHint` on all tools |
| **IT Documentation** | Full company, asset, article, and knowledge base management |
| **Password Management** | Secure credential access with masked output |
| **Expiration Tracking** | Monitor domain, SSL, warranty, and license expirations |
| **Website Monitoring** | DNS, SSL, WHOIS monitoring management |
| **Network Infrastructure** | Networks, VLANs, IP addresses, rack storage |
| **Activity Audit Logs** | Full audit trail with user, resource, and action filters |
| **Asset Layout Templates** | Manage custom field structures for asset types |
| **Relations & Magic Dash** | Entity relationships and dashboard widgets |
| **Auto-Pagination** | `fetchAll` retrieves up to 500 records across pages |
| **HTTP-Only Transport** | Modern streamable HTTP (no STDIO) |
| **Multi-Tenant Ready** | Company filtering for MSP environments |
| **Pre-built Prompts** | Security audits and asset reports |

---

## 🎯 Key Features

### 1. 📚 Complete IT Documentation
Manage companies, assets, articles, and knowledge base with AI assistance.

### 2. 🔐 Secure Password Management
Access and manage credentials safely through AI with proper authentication.

### 3. 🔄 Procedures & Workflows
Create, update, and manage procedures and tasks with AI-driven automation.

### 4. 🌐 Network Infrastructure
Complete network documentation including VLANs, IP addresses, and rack storage.

### 5. 🔍 Global Search
Powerful search across all Hudu resources with single queries.

### 6. 📊 Markdown Formatted Output
All tool responses return human-readable Markdown tables instead of raw JSON, powered by a centralized response formatter interceptor.

### 7. 📅 Expiration Tracking & Website Monitoring
Track domain, SSL certificate, warranty, and license expirations. Monitor website DNS, SSL, and WHOIS status.

### 8. 📋 Activity Audit Logs
Complete audit trail with filters by user, resource type, action, and date range.

### 9. 🏢 Multi-Tenant Support
Company-level filtering for MSPs managing multiple clients.

---

> 💼 **Need Help with Hudu or AI?**
>
> **Skills IT - Technology Solutions** specializes in IT infrastructure and has deep expertise in **Hudu IT Documentation Platform**. Our team has expertise in **Artificial Intelligence** and **Model Context Protocol (MCP)**, offering complete solutions for automation and system integration.
>
> **Our Services:**
> - ✅ Hudu consulting and implementation
> - ✅ Custom MCP development for your infrastructure
> - ✅ AI integration with corporate systems
> - ✅ IT documentation automation
> - ✅ Specialized training and support
>
> 📞 **WhatsApp/Phone:** +55 63 3224-4925 - Brazil 🇧🇷
> 🌐 **Website:** [skillsit.com.br](https://skillsit.com.br)
> 📧 **Email:** contato@skillsit.com.br
>
> *"Transforming infrastructure into intelligence"*

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│         Claude / ChatGPT / Gemini / Copilot / Cursor            │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │ MCP Protocol (HTTP JSON-RPC)
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Skills MCP Hudu Server                        │
│                        localhost:3100                            │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                      Express + MCP SDK                     │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │ │
│  │  │Companies │ │  Assets  │ │Passwords │ │ Articles │      │ │
│  │  │          │ │          │ │          │ │          │      │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │ │
│  │  │ Networks │ │Procedures│ │  Racks   │ │  Search  │      │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │ Hudu REST API
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Hudu Platform                             │
│                  https://your-hudu-instance.com                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** or Docker
- **Hudu instance** with API access
- **API Key** from Hudu Admin panel

### Installation

#### Option 1: Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/DevSkillsIT/Skills-MCP-Hudu.git
cd Skills-MCP-Hudu

# Configure environment
cp .env.example .env
nano .env  # Edit with your Hudu credentials

# Start with Docker Compose
docker-compose up -d

# Verify it's running
curl http://localhost:3100/health
```

#### Option 2: Node.js

```bash
# Clone and install
git clone https://github.com/DevSkillsIT/Skills-MCP-Hudu.git
cd Skills-MCP-Hudu
npm install

# Configure
cp .env.example .env
nano .env  # Edit with your Hudu credentials

# Build and run
npm run build
npm start

# Or development mode with hot reload
npm run dev
```

### GLPI Configuration

**1. Get your Hudu API Key:**
- Log in to Hudu
- Navigate to **Admin** → **API Keys**
- Click **Generate New API Key**
- Copy the key immediately (shown only once!)

### Environment Setup

```bash
# Required Settings
HUDU_BASE_URL=https://your-company.huducloud.com
HUDU_API_KEY=your-api-key-here

# MCP Server Configuration
MCP_SERVER_PORT=3100
MCP_BEARER_TOKEN=your-secure-token  # Optional but recommended

# Optional Settings
HUDU_TIMEOUT=30000
HUDU_ALLOWED_COMPANY_IDS=ALL  # Or specific company IDs: 123,456
LOG_LEVEL=info
```

### Connect to Claude Code

```bash
# Add MCP server
claude mcp add --transport http hudu http://localhost:3100/mcp
```

**Alternative: Edit `~/.claude/settings.json`:**

```json
{
  "mcpServers": {
    "hudu": {
      "type": "streamable-http",
      "url": "http://localhost:3100/mcp"
    }
  }
}
```

### Connect to Gemini CLI

Edit `~/.gemini/settings.json`:

```json
{
  "mcpServers": {
    "hudu": {
      "httpUrl": "http://localhost:3100/mcp",
      "timeout": 30000
    }
  }
}
```

> **Note:** Gemini CLI uses `httpUrl` instead of `url`.

### Test Connection

```bash
# Health check
curl http://localhost:3100/health

# Server info
curl http://localhost:3100/

# List available tools (requires valid setup)
curl -X POST http://localhost:3100/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

---

## 🧰 43 Tools

All tools follow a standardized naming convention optimized for ToolRAG systems:
- **Prefix:** `hudu_` (server namespace)
- **Verbs:** `manage` (CRUD) or `search` (read-only queries)
- **Descriptions:** Portuguese (pt-BR), noun-first for embedding similarity, 250-350 chars
- **Annotations:** All tools have MCP annotations (`readOnlyHint`, `destructiveHint`, `openWorldHint`)
- **Output:** Markdown formatted tables and detail views (not raw JSON)

### 📊 Companies (2 tools)

| Tool | Description |
|------|-------------|
| `hudu_manage_company_information` | Full CRUD operations (create, get, update, archive, unarchive) |
| `hudu_search_company_information` | List and search companies with pagination |

### 💻 IT Assets (2 tools)

| Tool | Description |
|------|-------------|
| `hudu_manage_it_asset_inventory` | Complete asset lifecycle management |
| `hudu_search_it_asset_inventory` | Search and filter assets by company, type, name |

### 📝 Articles & Knowledge Base (2 tools)

| Tool | Description |
|------|-------------|
| `hudu_manage_knowledge_articles` | Create, update, delete articles |
| `hudu_search_knowledge_articles` | Search articles by company, folder, name |

### 🔐 Passwords & Credentials (2 tools)

| Tool | Description |
|------|-------------|
| `hudu_manage_password_credentials` | Secure password management (CRUD operations) |
| `hudu_search_password_credentials` | Search credentials by company, name |

### ✅ Procedures & Checklists (4 tools)

| Tool | Description |
|------|-------------|
| `hudu_manage_workflow_procedures` | Manage runbooks and procedures |
| `hudu_search_workflow_procedures` | Search procedures by company, name |
| `hudu_manage_procedure_task_items` | Individual task management |
| `hudu_search_procedure_task_items` | List tasks with filters |

### 📁 Organization (2 tools)

| Tool | Description |
|------|-------------|
| `hudu_manage_kb_article_folders` | Document folder management |
| `hudu_search_kb_article_folders` | List folders by company, name |

### 🌐 Network Infrastructure (8 tools)

| Tool | Description |
|------|-------------|
| `hudu_manage_network_documentation` | Network documentation management |
| `hudu_search_network_documentation` | Search networks by company |
| `hudu_manage_network_vlan_records` | VLAN management |
| `hudu_search_network_vlan_records` | List VLANs with filters |
| `hudu_manage_network_vlan_zones` | Network zone organization |
| `hudu_search_network_vlan_zones` | Search zones by company |
| `hudu_manage_ip_address_records` | IP address tracking and documentation |
| `hudu_search_ip_address_records` | Search IP addresses by network, company |

### 📦 Data Center & Storage (8 tools)

| Tool | Description |
|------|-------------|
| `hudu_manage_rack_storage_locations` | Rack documentation management |
| `hudu_search_rack_storage_locations` | List racks by company, location |
| `hudu_manage_rack_storage_items` | Equipment in racks |
| `hudu_search_rack_storage_items` | Search rack items |
| `hudu_manage_file_upload_records` | File attachment management |
| `hudu_search_file_upload_records` | Search uploaded files |
| `hudu_manage_public_photo_gallery` | Image management |
| `hudu_search_public_photo_gallery` | List photos with filters |

### 📅 Expiration Tracking (1 tool) — *NEW*

| Tool | Description |
|------|-------------|
| `hudu_search_expiration_tracking` | Track domain, SSL, warranty, and license expirations |

### 🌐 Website Monitoring (2 tools) — *NEW*

| Tool | Description |
|------|-------------|
| `hudu_manage_website_monitoring` | CRUD for monitored websites (DNS, SSL, WHOIS) |
| `hudu_search_website_monitoring` | Search monitored websites by company, name |

### 🏗️ Asset Layout Templates (2 tools) — *NEW*

| Tool | Description |
|------|-------------|
| `hudu_manage_asset_layout_templates` | Create and update asset field templates (no delete) |
| `hudu_search_asset_layout_templates` | Search asset layout templates |

### 📋 Activity Audit Logs (1 tool) — *NEW*

| Tool | Description |
|------|-------------|
| `hudu_search_activity_audit_logs` | Audit trail with user, resource, action, and date filters |

### 🔗 Entity Relations (2 tools) — *NEW*

| Tool | Description |
|------|-------------|
| `hudu_manage_entity_relations` | CRUD for relationships between entities (Asset→Company, etc.) |
| `hudu_search_entity_relations` | Search entity relationships |

### 📊 Magic Dash Widgets (2 tools) — *NEW*

| Tool | Description |
|------|-------------|
| `hudu_manage_dashboard_widgets` | CRUD for Magic Dash dashboard widgets |
| `hudu_search_dashboard_widgets` | Search dashboard widgets by company |

### 🔍 Utilities (3 tools)

| Tool | Description |
|------|-------------|
| `hudu_search_all_resource_types` | **Global search** across ALL resources |
| `hudu_navigate_to_resource_by_name` | Quick jump to companies and resources by name |
| `hudu_admin_instance_operations` | API info, activity logs, exports, expirations |

---

## 💡 Usage Examples

> **Tip:** Mention "Hudu" at the beginning of prompts for clarity with multiple MCPs.

### IT Documentation Management

```
Hudu, list all companies
Hudu, create a new company "Acme Corporation" with website acme.com
Hudu, show me all assets for company "Acme Corporation"
Hudu, search for articles about "firewall configuration"
```

### Password & Credential Management

```
Hudu, list all passwords for company "Acme Corporation"
Hudu, create a new password entry for "Office WiFi"
Hudu, search credentials containing "admin"
```

### Procedures & Workflows

```
Hudu, list all procedures
Hudu, create a new procedure "Server Backup Checklist"
Hudu, show tasks for procedure ID 123
```

### Network Documentation

```
Hudu, list all networks
Hudu, show VLANs for company "Acme Corporation"
Hudu, list IP addresses in network ID 456
Hudu, document rack storage in datacenter
```

### Expiration Tracking & Website Monitoring

```
Hudu, show all expiring SSL certificates
Hudu, list domain expirations for company "Acme Corporation"
Hudu, show monitored websites and their DNS/SSL status
Hudu, add website monitoring for https://acme.com
```

### Audit & Activity Logs

```
Hudu, show recent activity logs for user admin@acme.com
Hudu, list all changes to assets in the last week
Hudu, who modified company "Acme Corporation" recently?
```

### Dashboard & Relations

```
Hudu, list all Magic Dash widgets for company "Acme"
Hudu, create a dashboard widget showing backup status
Hudu, show relations between asset ID 100 and other entities
```

### Global Search

```
Hudu, search for "firewall" across all resources
Hudu, find anything related to "backup server"
```

---

## 🔐 MCP Resources

Direct data access through native MCP resource URIs. All resources return Markdown-formatted content.

| URI | Name | Description |
|-----|------|-------------|
| `hudu://companies` | Empresas Hudu | Companies, clients, and organizations — full list with name, type, address, and status |
| `hudu://companies/{id}` | Empresa Hudu por ID | Complete details for a specific company — address, phone, notes, and registration info |
| `hudu://assets` | Ativos de TI Hudu | IT assets, equipment, and devices — full inventory with model, serial, and custom fields |
| `hudu://assets/{id}` | Ativo Hudu por ID | Complete details for a specific IT asset — custom fields, company, and layout info |
| `hudu://articles` | Artigos KB Hudu | Knowledge base articles and documents — list with title, company, and publication status |
| `hudu://articles/{id}` | Artigo KB Hudu por ID | Complete article content rendered as clean Markdown (HTML stripped) |

**Example usage in Claude Code:**

```
Show me the contents of hudu://companies
Read hudu://assets/42
What does hudu://articles/15 contain?
```

---

## 📋 MCP Prompts

Pre-configured prompts for common workflows:

### `hudu_security_audit`
Generate comprehensive security audit reports across your Hudu instance.

### `hudu_asset_report`
Create detailed IT asset inventory reports with statistics.

**Usage:**
```
Run the hudu_security_audit prompt for our infrastructure
```

---

## ⚙️ Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `HUDU_BASE_URL` | ✅ Yes | - | Your Hudu instance URL |
| `HUDU_API_KEY` | ✅ Yes | - | Hudu API key |
| `MCP_SERVER_PORT` | No | 3100 | HTTP server port |
| `MCP_BEARER_TOKEN` | No | - | Bearer token for authentication (recommended) |
| `HUDU_TIMEOUT` | No | 30000 | API timeout in milliseconds |
| `HUDU_ALLOWED_COMPANY_IDS` | No | ALL | Company filtering: ALL or comma-separated IDs |
| `LOG_LEVEL` | No | info | Logging level: debug, info, warn, error |

### Multi-Tenant Configuration (MSPs)

Restrict access to specific companies:

```bash
# Access all companies (default)
HUDU_ALLOWED_COMPANY_IDS=ALL

# Access only company ID 123
HUDU_ALLOWED_COMPANY_IDS=123

# Access multiple companies
HUDU_ALLOWED_COMPANY_IDS=123,456,789
```

### Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Server information and version |
| `/health` | GET | Health check (liveness probe) |
| `/mcp` | POST | MCP JSON-RPC endpoint |

---

## 🔒 Security

### Best Practices

- ✅ **Store API keys in `.env` file**, never in code
- ✅ **Use HTTPS in production** (reverse proxy with SSL/TLS)
- ✅ **Set `MCP_BEARER_TOKEN`** for HTTP authentication
- ✅ **Restrict network access** to trusted sources only
- ✅ **Rotate API keys periodically**
- ✅ **Use read-only API keys** when write access isn't needed
- ✅ **Enable company filtering** for multi-tenant environments

### Rate Limiting

Built-in rate limiting protects your Hudu instance:
- **Default:** 1000 requests per IP per 15 minutes
- Configurable via environment variables
- Automatic backoff and retry

### CORS Configuration

CORS is pre-configured for secure local network access:
- `localhost` and `127.0.0.1`
- Private network ranges (10.x.x.x, 172.16.x.x, 192.168.x.x)
- Custom origins via `MCP_ALLOWED_ORIGINS`

---

## 🐳 Docker Deployment

### Docker Compose (Recommended)

```yaml
version: '3.8'

services:
  hudu-mcp:
    build: .
    container_name: skills-mcp-hudu
    restart: unless-stopped
    ports:
      - "3100:3100"
    environment:
      - HUDU_BASE_URL=${HUDU_BASE_URL}
      - HUDU_API_KEY=${HUDU_API_KEY}
      - MCP_SERVER_PORT=3100
      - MCP_BEARER_TOKEN=${MCP_BEARER_TOKEN}
      - HUDU_TIMEOUT=30000
      - LOG_LEVEL=info
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3100/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### Docker Commands

```bash
# Build and start
docker-compose up -d --build

# View logs
docker-compose logs -f hudu-mcp

# Stop
docker-compose down

# Rebuild without cache
docker-compose build --no-cache

# Check status
docker-compose ps
```

---

## 🐛 Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| `Connection refused` | Server not running | Check Docker/Node process status |
| `401 Unauthorized` | Invalid API key | Verify `HUDU_API_KEY` in `.env` |
| `403 Forbidden` | Insufficient permissions | Check API key permissions in Hudu |
| `ECONNREFUSED` | Can't reach Hudu | Verify `HUDU_BASE_URL` and network connectivity |
| `Rate limit exceeded` | Too many requests | Wait 15 minutes or adjust rate limits |
| `ENOTFOUND` | DNS resolution failed | Check Hudu URL spelling and DNS |

### Debug Mode

Enable detailed logging:

```bash
# .env
LOG_LEVEL=debug
```

### Logs

**Docker:**
```bash
docker-compose logs -f hudu-mcp
```

**Node.js:**
```bash
# Logs are written to stdout/stderr
npm start 2>&1 | tee hudu-mcp.log
```

**PM2:**
```bash
pm2 logs hudu-mcp
```

---

## 🧪 Testing & Development

### Development Setup

```bash
# Clone repository
git clone https://github.com/DevSkillsIT/Skills-MCP-Hudu.git
cd Skills-MCP-Hudu

# Install dependencies
npm install

# Start development server (hot reload)
npm run dev

# Run linting
npm run lint

# Type checking
npm run type-check

# Build for production
npm run build
```

### Testing Commands

```bash
# Run all tests (179 tests, 12 suites)
npm test

# Run with verbose output
NODE_OPTIONS='--experimental-vm-modules' npx jest --verbose

# Type checking
npm run type-check

# Lint code
npm run lint

# Build project
npm run build
```

### Test Coverage

| Suite | Tests | Description |
|-------|-------|-------------|
| html-stripper | 25 | HTML stripping, truncation, Markdown escaping |
| markdown formatters | 30 | All 29 formatters + pagination helpers |
| response-formatter | 13 | Global interceptor for all 43 tools |
| tools-registry | 8 | Tool count, registration, naming conventions |
| annotations | 7 | readOnlyHint, destructiveHint, openWorldHint compliance |
| expirations | 8 | Expiration tracking executor with filters |
| websites | 17 | Website CRUD + query with validation |
| asset-layouts | 14 | Layout CRUD (no delete) + query |
| activity-logs | 9 | Audit log filters and error handling |
| relations | 17 | Relation CRUD + query with validation |
| magic-dash | 17 | Dashboard widget CRUD + query |
| resources | 13 | MCP Resources URI parsing and data retrieval |

---

## 📁 Project Structure

```
Skills-MCP-Hudu/
├── src/
│   ├── index.ts              # Entry point
│   ├── server.ts             # MCP HTTP server + instructions + resource handlers
│   ├── hudu-client.ts        # Hudu API client (941 lines, all endpoints + fetchAll)
│   ├── resources.ts          # MCP Resources handler (6 hudu:// URIs) — NEW
│   ├── types.ts              # TypeScript definitions + HuduPagedResponse<T>
│   ├── utils/
│   │   └── html-stripper.ts  # HTML cleanup: stripHtml, truncate, escapeMarkdown — NEW
│   ├── formatters/
│   │   ├── markdown.ts       # 29 Markdown formatters for all entity types — NEW
│   │   └── response-formatter.ts  # Global interceptor: Markdown for all 43 tools — NEW
│   └── tools/
│       ├── working-index.ts  # Primary tool registry (43 tools)
│       ├── base.ts           # Response helpers
│       ├── schema-utils.ts   # Shared schemas and properties
│       ├── companies.ts      # Company management (2 tools)
│       ├── assets.ts         # Asset inventory (2 tools)
│       ├── articles.ts       # Knowledge base articles (2 tools)
│       ├── passwords.ts      # Password vault (2 tools)
│       ├── procedures.ts     # Procedures and tasks (4 tools)
│       ├── folders.ts        # Folder organization (2 tools)
│       ├── networks.ts       # Networks, VLANs, IPs (8 tools)
│       ├── storage.ts        # Uploads, racks, photos (8 tools)
│       ├── expirations.ts    # Expiration tracking (1 tool) — NEW
│       ├── websites.ts       # Website monitoring (2 tools) — NEW
│       ├── asset-layouts.ts  # Asset layout templates (2 tools) — NEW
│       ├── activity-logs.ts  # Activity audit logs (1 tool) — NEW
│       ├── relations.ts      # Entity relations (2 tools) — NEW
│       ├── magic-dash.ts     # Dashboard widgets (2 tools) — NEW
│       ├── admin.ts          # Instance administration (1 tool)
│       ├── search.ts         # Global unified search (1 tool)
│       └── navigation.ts     # Quick navigation (1 tool)
├── src/__tests__/            # 179 tests across 12 suites — NEW
│   ├── utils/                # html-stripper tests
│   ├── formatters/           # markdown + response-formatter tests
│   ├── tools/                # Tool executor tests (6 files)
│   ├── integration/          # Registry + annotation compliance tests
│   └── resources.test.ts     # MCP Resources tests
├── dist/                     # Compiled JavaScript (generated)
├── jest.config.ts            # Jest configuration (ESM + ts-jest) — NEW
├── tsconfig.test.json        # TypeScript config for tests — NEW
├── hudu.json                 # Hudu OpenAPI spec (reference)
├── Dockerfile                # Multi-stage Docker build
├── docker-compose.yml        # Docker Compose configuration
├── package.json              # Node.js dependencies
├── tsconfig.json             # TypeScript configuration
├── .env.example              # Environment template
├── .gitignore                # Git ignore rules
├── LICENSE                   # MIT License
└── README.md                 # This file
```

---

## 🤝 Contributing

We welcome contributions! Here's how to get involved:

1. **Fork** the repository
2. **Create** your feature branch: `git checkout -b feature/AmazingFeature`
3. **Commit** your changes: `git commit -m 'feat: add amazing feature'`
4. **Push** to branch: `git push origin feature/AmazingFeature`
5. **Open** a Pull Request

### Commit Standards

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new feature
fix: correct bug
docs: update documentation
refactor: improve code structure
test: add tests
chore: update dependencies
style: formatting changes
perf: performance improvements
```

### Development Guidelines

- Write clean, documented TypeScript code
- Follow existing code style and patterns
- Add tests for new features
- Update documentation as needed
- Test with Claude Code before submitting PR

---

## 📚 Useful Links

- [Hudu Official Website](https://www.usehudu.com/) - IT documentation platform
- [Hudu API Documentation](https://www.usehudu.com/docs/api) - REST API documentation
- [MCP Specification](https://modelcontextprotocol.io/) - Model Context Protocol
- [Skills IT Website](https://skillsit.com.br/) - Our company
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk) - Official SDK

---

## 📞 Support

### Bug Reports
Found a bug? Please [open an issue](https://github.com/DevSkillsIT/Skills-MCP-Hudu/issues) with:
- Description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Environment details (Node.js version, OS, Hudu version)
- Relevant logs (with sensitive data removed)

### Discussions
Have questions or ideas? Join our [GitHub Discussions](https://github.com/DevSkillsIT/Skills-MCP-Hudu/discussions)

### Email
Technical support: contato@skillsit.com.br

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **[Hudu](https://www.usehudu.com/)** - The amazing IT documentation platform
- **[Anthropic](https://www.anthropic.com/)** - For Claude and the MCP specification
- **[Model Context Protocol](https://modelcontextprotocol.io/)** - The protocol that makes this possible
- **MSP Community** - For feedback and feature requests

---

<div align="center">

**Made with ❤️ by Skills IT - Soluções em TI - BRAZIL**

*We are an MSP empowering other MSPs with intelligent automation.*

**Version:** 1.2.0 | **Last Updated:** March 2026

🇧🇷 **Proudly Made in Brazil**

[⬆ Back to Top](#-skills-mcp-hudu)

</div>
