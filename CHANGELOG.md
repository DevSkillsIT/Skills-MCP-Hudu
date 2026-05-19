# Changelog — Hudu MCP Server

All notable changes to this project are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

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
