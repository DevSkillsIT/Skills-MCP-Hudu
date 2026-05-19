# Changelog — Hudu MCP Server

All notable changes to this project are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

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
