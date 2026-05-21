# Changelog — Hudu MCP Server

All notable changes to this project are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased] — Live-validation gap fixes (REQ-01, REQ-05, REQ-09)

Found during live validation against doc.skillsit.com.br on 2026-05-21: three
SPEC requirements passed their unit tests but did NOT deliver against the real
consumption path / live API shape. The original implementations validated
against mocks/isolated paths only.

### [SPEC-HUDU-FIX-001 / REQ-01 / BUG-01] Prompt validation bypassed by bridge tool
- Root cause: `validatePromptArgs` was wired only into the native `GetPromptRequestSchema` handler. The `hudu_get_prompt` BRIDGE TOOL (`executeGetPromptTool`) called `getHuduPromptText` directly, so missing required args still leaked literal `undefined` into the rendered prompt (reproduced live).
- Fix: moved `validatePromptArgs` from `server.ts` to `prompts.ts` (avoids circular import); `executeGetPromptTool` now validates before interpolation and returns an error listing the missing args. `server.ts` imports it from `prompts.ts`.
- Test: `BUG-01-prompt-validation.test.ts` extended with 3 bridge-tool path tests asserting no `undefined` leak. Live-verified.

### [SPEC-HUDU-FIX-001 / REQ-05 / BUG-05] IP record context — network_id not exposed by API
- Live finding: Hudu API 2.41.2 does NOT return `network_id` on the IP record payload (OpenAPI declares it; live endpoint omits it). The earlier "no change needed" conclusion + characterization test pinned the buggy `Rede ID: -` output.
- The API DOES return `asset_id` + `asset_name` (+ `asset_url`) and `company_id`. Fix surfaces the asset as primary context (`| Ativo | Name (ID: N) |`), hydrates company when available, and only renders the `Rede ID` row when `network_id` is actually present (no misleading `-`).
- Files: `src/types.ts` (HuduIpAddress + asset_name/asset_url/company fields), `src/formatters/markdown.ts` (formatIpAddressList/Detail + ipAssetLabel helper). Test rewritten against real API shape. Live-verified: `| Ativo | GWPMWESCSC - Firewall (ID: 976) |`.

### [SPEC-HUDU-FIX-001 / REQ-09 / BUG-09] Relation readability — per-endpoint names not exposed by API
- Live finding: the relations API returns a single `name` (the related entity's name) + per-endpoint `*_url`, but NO separate fromable_name/toable_name. The earlier implementation relied on those nonexistent fields, so relations rendered as opaque `Company#37`.
- Fix: render endpoints as `Type#id` (precise) and surface the `name` field as a Nome column (list) and the endpoint URLs (detail). No N+1 lookups. Full per-endpoint name resolution would require lookups and is deferred with rationale.
- Files: `src/types.ts` (HuduRelation + fromable_url/toable_url/is_inverse), `src/formatters/markdown.ts` (formatRelationList/Detail). Test rewritten against real API shape. Live-verified: Nome column shows "Skills IT Palmas", "GWPMWESCSC - Firewall".

---

## [Unreleased] — Search ergonomics (query decomposition pilot)

### [ENH-HUDU-SEARCH-001] Query over-literalization fix + token fallback

**Problem:** LLMs forward full natural-language phrases (e.g. "preciso da senha do banco de dados do Sankhya na Oracle da Acme") into the `search` field. Hudu indexes short proper names ("Sankhya", "Oracle-PROD"), so the literal phrase matches nothing.

**Solution (two layers):**

**Layer 1 — Description guidance:** Updated the `search` field description in `src/tools/schema-utils.ts` (shared by ~30 search tools) and the `query` field in `src/tools/search.ts` (`search_all_resource_types`) to explicitly instruct the LLM to use only the key proper noun, not the full phrase.

**Layer 2 — Server-side normalisation + token fallback (self-contained utility):**
- Added `src/utils/query-normalizer.ts` — zero Hudu-specific imports, copy-pasteable to GLPI/WHM/Veeam/Sankhya MCPs.
  - `STOPWORDS_PT`: 40 PT-BR function words + intent verbs (articles, prepositions, conjunctions, and verbs like `preciso`, `quero`, `buscar`). Generic nouns (`senha`, `banco`, `dados`) are intentionally NOT stripped.
  - `normalizeSearchTerm(raw)`: strips stopwords, keeps proper nouns, preserves original casing, never returns empty when input was non-empty.
  - `searchTokens(raw)`: returns significant tokens deduped and ordered by length descending, capped at 4.
  - `isSearchToolName(name)`: true for `search_*` and `navigate_to_resource_by_name`.
- Added `HuduMcpServer.runSearchAwareExecutor()` private method in `src/server.ts`:
  1. Normalises `search`/`query` field for all search tools.
  2. If result is empty AND original phrase had ≥ 2 significant tokens: iterates tokens one by one, returns first non-empty hit.
  3. Logs `Search token fallback succeeded` with original query and matched token.
- Wired into BOTH transport dispatch paths (SDK handler ~line 418; HTTP handler ~line 959) via the single private method — no logic duplication.

**Tests added (26 new):**
- `src/__tests__/query-normalizer.test.ts` — 21 unit tests (normaliseSearchTerm, searchTokens, isSearchToolName).
- `src/__tests__/query-decomposition.test.ts` — 5 integration-style tests with mocked client, covering: verbose-phrase fallback, single-term passthrough, non-search tool passthrough, company search fallback, all-tokens-exhausted graceful return.

**Before/after example:**
- Input: `"preciso da senha do banco de dados do Sankhya na Oracle da Acme"`
- After normalisation: `"senha banco dados Sankhya Oracle Acme"` (stopwords stripped)
- If empty → token fallback tries: `Sankhya` (7), `Oracle` (6), `Acme` (4), `senha` (5) — first hit wins.

---

## [Unreleased] — SPEC-HUDU-FIX-001 Phase 2C (P2 polish and schema hygiene)

### [SPEC-HUDU-FIX-001 / REQ-12 / PRB-01] Tool name prefix cleanup — REVERTED
- ~~Dropped redundant `hudu_` prefix from registered tool names.~~
- **REVERTED on 2026-05-21.** The `hudu_` prefix is the MCP server's namespace, not a mcphub-only artifact. This MCP can be connected directly to any client (Claude Desktop, Gemini CLI, etc.) where tool names share a flat namespace across all connected MCPs; without the prefix, names like `search_company_information` collide with other MCPs and lose their origin. The original premise (rename only matters for the mcphub double-prefix `hudu-hudu_*`) was wrong.
- Revert restored `hudu_*` names on all tool definitions and on the `WORKING_TOOLS` / `WORKING_TOOL_EXECUTORS` registry keys; removed `src/tools/aliases.ts`, the `resolveToolAlias` dispatch in `src/server.ts`, and `src/__tests__/PRB-01-tool-aliases.test.ts`. `isSearchToolName()` in `query-normalizer.ts` updated to accept the `hudu_` prefix so the search-ergonomics pilot keeps working. Registry tests now assert the prefix is present.
- Net effect: tool names are exactly as before the SPEC (`hudu_manage_*`, `hudu_search_*`). All other SPEC-HUDU-FIX-001 fixes (REQ-01..11, REQ-13..23) remain in place.

### [SPEC-HUDU-FIX-001 / REQ-13 / PRB-02] Total record count metadata
- Added optional `total?: number` to `HuduPagedResponse<T>` interface in `src/types.ts`.
- Added optional `total` parameter to `toPagedResponse()` in `src/formatters/markdown.ts`; when present, `pageInfo()` appends `| Total: N` to the metadata block alongside the existing pagination hint.
- Test: `src/__tests__/PRB-02-total-count.test.ts`.

### [SPEC-HUDU-FIX-001 / REQ-14 / PRB-03] Asset layout templates page_size cap
- Added `page_size: { type: 'number', maximum: 100, default: 25 }` to `search_asset_layout_templates` input schema in `src/tools/asset-layouts.ts`; the description documents that Hudu API 2.41.2 silently caps each page at 25 items and ignores the requested value.
- Executor now emits `page_size_capped: 25` metadata when the result count reaches the cap so consumers know there may be unseen records.
- Test: `src/__tests__/PRB-03-asset-layout-page-size.test.ts`.

### [SPEC-HUDU-FIX-001 / REQ-15 / PRB-04] Resource URI enum alignment
- Updated `readResourceTool` in `src/tools/resource-tools.ts`: `uri` enum lists only base collection URIs (`hudu://companies`, `hudu://assets`, `hudu://articles`). Detail access is provided via the optional `id` parameter which is concatenated to the chosen base. Description now matches the enum (no longer advertises parameterized forms `hudu://companies/{id}` that aren't in the enum).
- Test: `src/__tests__/PRB-04-resource-uri.test.ts`.

### [SPEC-HUDU-FIX-001 / REQ-16 / PRB-05] Manage action enum cleanup vs Hudu API 2.41.2
- `manage_entity_relations` (`src/tools/relations.ts`): action enum reduced from `['create', 'get', 'update', 'delete']` to `['create', 'delete']` — Hudu API does NOT expose GET-by-id or PUT for `/relations/{id}`. Reuses WIP audit from `wip/hudu-pre-spec-2026-05-19`.
- `manage_dashboard_widgets` (`src/tools/magic-dash.ts`): action enum reduced from `['create', 'get', 'update', 'delete']` to `['create', 'delete']` — Hudu API does NOT expose GET-by-id or PATCH for `/magic_dash/{id}`.
- `manage_file_upload_records` (`src/tools/storage.ts` uploadsTool): action enum reduced from `['get', 'update', 'delete']` to `['get', 'delete']` — Hudu API does NOT expose PUT for `/uploads/{id}`.
- `manage_public_photo_gallery` (`src/tools/storage.ts` publicPhotosTool): action enum reduced to `['update']` only — Hudu API only exposes PUT for `/public_photos/{id}`.
- Test: `src/__tests__/PRB-05-action-enums.test.ts`.

### [SPEC-HUDU-FIX-001 / REQ-17 / PRB-06] Dashboard widgets API gap documented
- Updated description of `manage_dashboard_widgets` in `src/tools/magic-dash.ts` (NOT `admin.ts` as the original spec.md placeholder said) to explicitly document that Hudu API 2.41.2 does not expose GET-by-id or PATCH; only create and delete are supported via this tool. Listing remains available via `search_dashboard_widgets`.

### [SPEC-HUDU-FIX-001 / REQ-18 / PRB-07] Asset history prompt template cleanup
- Removed instruction in `hudu_asset_history` prompt body (`src/prompts.ts`) that asked the LLM to call `manage_it_asset_inventory action=get` with `fields.company_id`. The `fields` parameter is only for filtered list views (search_*), not for `action=get`; the corrected prompt now calls `manage_it_asset_inventory` with just `{ action: 'get', id }`.
- Test: `src/__tests__/PRB-07-prompt-template.test.ts`.

### [SPEC-HUDU-FIX-001 / REQ-19 / PRB-08] pt-BR mojibake encoding cleanup
- Fixed mojibake across `src/resources.ts`, `src/server.ts`, `src/formatters/markdown.ts`, `src/tools/asset-layouts.ts`, `src/tools/expirations.ts`, `src/tools/magic-dash.ts`, `src/tools/prompt-tools.ts`, `src/tools/resource-tools.ts`, `src/tools/websites.ts` — restored `painéis`, `paginação`, `Ação`, `Descrição`, `informações`, `organizações`, `expirações`, `domínios`, `licenças`, `relatórios`, `análises`, `catálogo`, `disponíveis`, `disponível`, `obrigatória`, `obrigatório`, `endereço`, `específico`, `título`, `publicação`, `criação`, `verificação`, `observações`, `não`, `é`.
- Added `scripts/audit-encoding.ts`: CLI that scans every tracked `.ts` source file (excluding `__tests__/`) for known mojibake patterns and exits non-zero on any finding. Becomes the CI guard against regression.

### Housekeeping (pre-existing LSP diagnostics)
- `src/server.ts:769`: renamed unused `res` parameter to `_res` in OAuth2-Proxy middleware (TS6133).
- `src/hudu-client.ts:55`: removed unused `private` modifier on `_config` constructor parameter; field was never read outside the constructor (TS6138).

---

## [Unreleased] — SPEC-HUDU-FIX-001 Phase 2B (P1 hydration and data-quality fixes)

### [SPEC-HUDU-FIX-001 / REQ-06 / BUG-06] Enum resolution helpers
- Created `src/formatters/enums.ts` with `resolveNetworkType()` (0→IPv4, 1→IPv6, handles string-encoded ints, null, undefined), `resolveExpirationType()` (capitalises string, handles null/empty), and `resolveListItemLabel()` (name-over-id fallback).
- Integrated `resolveNetworkType` into `formatNetworkList` and `formatNetworkDetail` in `markdown.ts` so the Tipo column shows "IPv4"/"IPv6" instead of raw integers.
- Test: `src/__tests__/BUG-06-enum-resolution.test.ts` (26 cases).

### [SPEC-HUDU-FIX-001 / REQ-07 / BUG-07] Company name hydration
- Added LRU cache (`CompanyNameCache`, capacity 200, TTL 5 min) inside `HuduClient` class in `src/hudu-client.ts`.
- Added `resolveCompanyName(id)`, `resolveCompanyNames(ids[])`, and `hydrateCompanyNames(records[])` methods; all deduplicate company_id values to avoid N+1 fetches.
- Applied hydration in `getArticles`, `getArticle`, `getFolders`, `getFolder`, `getAssetPasswords`, `getAssetPassword`.
- Updated `formatArticleList` and `formatArticleDetail` in `markdown.ts`: column header changed from "Empresa ID" to "Empresa"; shows "Name (ID: N)" when name available.
- Updated `formatFolderList` in `markdown.ts`: column header changed from "Empresa ID" to "Empresa"; shows "Name (ID: N)".
- Test: `src/__tests__/BUG-07-company-hydration.test.ts` (14 cases).

### [SPEC-HUDU-FIX-001 / REQ-08 / BUG-07-sub] KB folder name in detail
- Updated `formatFolderDetail` in `markdown.ts`: added `| Nome | <value> |` row as first row in the detail table; changed "Empresa ID" label to "Empresa" with name hydration.
- Test: covered in `src/__tests__/BUG-07-company-hydration.test.ts`.

### [SPEC-HUDU-FIX-001 / REQ-09 / BUG-09] Entity relations name resolution
- Updated `formatRelationList` and `formatRelationDetail` in `markdown.ts` to use `formatRelationEndpoint()` helper that shows `Type "Name" (ID: N)` when optional `fromable_name`/`toable_name` fields are present in the hydrated payload; falls back to `Type#id` when absent.
- Test: `src/__tests__/BUG-09-relations-hydration.test.ts` (7 cases).

### [SPEC-HUDU-FIX-001 / REQ-05 / BUG-05] IP address network_id surfacing
- Confirmed `network_id` is present in Hudu.json IpAddress schema and already surfaced by `formatIpAddressList` and `formatIpAddressDetail`; no formatter change needed. Added characterization tests to pin behaviour.
- Test: `src/__tests__/BUG-05-ip-network-id.test.ts` (7 cases).

### [SPEC-HUDU-FIX-001 / REQ-10 / BUG-08] Public photo gallery name/filename
- Updated `formatPublicPhotoList` and `formatPublicPhotoDetail` in `markdown.ts`: replaced `esc(p.name)` / `esc(p.filename)` (which produced empty cells when absent) with `esc(p.name) || '-'` / `esc(p.filename) || '-'` pattern; added `| Nome |` row to detail formatter.
- Test: `src/__tests__/BUG-08-photo-fields.test.ts` (8 cases).

### [SPEC-HUDU-FIX-001 / REQ-11 / BUG-10] Website monitoring timestamps
- Investigation confirmed `created_at`/`updated_at` are already rendered by `formatWebsiteDetail` (L326-327) and present in `HuduWebsite` type; `getWebsite` in `hudu-client.ts` passes all raw fields through. No formatter change needed. Added characterization tests to pin behaviour.
- Test: `src/__tests__/BUG-10-website-timestamps.test.ts` (5 cases).

---

## [Unreleased] — SPEC-HUDU-FIX-001 Phase 2A (P0 critical fixes)

### [SPEC-HUDU-FIX-001 / REQ-01 / BUG-01] Prompt argument validation
- Added `validatePromptArgs()` function exported from `src/server.ts` that validates required arguments against `HUDU_PROMPTS_LIST` BEFORE template interpolation; returns `{ error, prompt, required, provided }` on failure or `null` on success; integrated into `GetPromptRequestSchema` handler to throw `McpError(InvalidParams)` with a clear message listing missing fields for the 7 prompts with `required: true`.

### [SPEC-HUDU-FIX-001 / REQ-02 / BUG-02] Rack detail retrieval — null guard
- Added null guard to `getRackStorage(id)` in `src/hudu-client.ts`: when the Hudu API returns HTTP 200 with `{ rack_storage: null }` (absent record without a 404), the method now throws `Error("Rack storage with ID ${id} not found")` instead of silently resolving to `null`/`undefined`.

### [SPEC-HUDU-FIX-001 / REQ-03 / BUG-03] Photo gallery ID type — investigation
- Investigation confirmed no type mismatch: `HuduPublicPhoto.id` is `number` in both `types.ts` and the OpenAPI spec; `publicPhotosTool` schema uses `commonProperties.id = { type: 'number' }` consistently; characterization tests added to prevent future regressions.

### [SPEC-HUDU-FIX-001 / REQ-04 / BUG-04] Global typed search — result wrapping
- Fixed `executeSearchTool` in `src/tools/search.ts`: when `type` is specified (e.g. `type: 'assets'`), the per-type results are now wrapped in `{ [type]: items, ...emptyOthers }` instead of being returned as a raw array, enabling `formatGlobalSearchResults` to render the correct Markdown section; confirmed OpenAPI spec uses `search` (not `query`) for all four endpoints — the R-11 hypothesis was incorrect.
