# Changelog — Hudu MCP Server

All notable changes to this project are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased] — Auditing the audit: the defences were the defect

Two more audits over the round below — an adversarial review of the new
utilities and a documentation review. Both found real problems, and the code
review's were in the modules written to prevent problems. Tests 543 → 581.

### Fixed — the guard cried wolf, and its warning invited the damage
`guardedWrite` compared the union of keys from the GET and the PUT, and
`sameValue(x, undefined)` is false — so every field the PUT did not echo was
reported as destroyed, and the message told the caller to consider restoring
it. A defence against destructive writes that induces one is worse than none.
`echo-check.ts` had documented the opposite policy since the day it was written:
absence is not divergence. They now agree — collateral requires the field in
BOTH snapshots.

Same class, three more:
- Derived fields (`first_assigned_user_*`, subtask counters, roll-ups) fired on
  every legitimate write and put people's names in a warning. They are volatile.
- An array reordered by the server (`assigned_users` comes back sorted by id)
  read as "the API did not write this". Comparison is order-insensitive now.
- The warning had no size cap. A procedure GET carries every nested task, so a
  rename produced thousands of characters of serialised payload in the model's
  context.

The collateral message also explained the wrong cause — it blamed unreadable
input, which by definition belongs to the other bucket. It now names what can
actually produce it, including a concurrent edit by a person, and says not to
write the old value back without checking.

### Fixed — the parent guard checked one value and sent another
`Number()` and Ruby's `String#to_i` disagree, and the API uses `to_i`:
`'1e3'` is 1000 to JavaScript and 1 to Ruby; `'0x10'` is 16 and 0. The guard
validated with `Number()`, passed, and forwarded the raw string — so `'0x10'`
reproduced the exact corruption the guard exists to prevent, after the
existence check had vouched for a different task entirely. Digits only now, and
the coerced number is what gets sent.

### Fixed — a correct write reported as a failed one
The API normalises `31/12/2026` to `2026-12-31`. The echo check compared the
request string against the stored one and accused every Brazilian-format date
write of failing, with a suggested cause that was also wrong. The value is
normalised before sending, so request and response are the same string.

### Fixed — redaction failed in both directions at once
Masking any word after a trigger word destroyed the actionable half of the
commonest errors: `api_key is invalid` became `api_key is ****`; a duplicate-name
422 lost the name that collided. Meanwhile `chave de API invalida: hu_…` passed
through, because `chave` was not a trigger and the value was under the length
floor.

Entropy was the wrong instrument. Masking now requires evidence: a trigger word
with an explicit assignment or quotes, a known secret prefix, a JWT, or
`Bearer`. Unlabelled prefix-less secrets are not masked — a deliberate gap,
because the alternative was erasing asset names from the one message that says
which name collided.

### Fixed — passwords were written to disk in the clear (pre-existing)
`server.ts` logs the arguments of every tool call to a DailyRotateFile kept for
14 days, and `hudu_manage_password_credentials` takes `fields.password` as a
plain string. The HTTP path truncated to 200 characters, which is not
redaction — the password sits well inside the first 200. Both log paths now
pass through `redactPayload`. The smaller hole had been patched while this one
stayed open.

### Fixed — "does not exist" asserted where nothing was checked
`record-exists` mapped any TypeError to "the query returned 404", so a client
schema change would refuse every write with a confident false statement, and an
asset the key cannot scope was reported as nonexistent. Our own client's
"not found (tip: pass company_id)" now reads as unchecked, and the empty-body
case says what was observed instead of inventing a status code.

### Fixed — documentation that contradicted the code on the front page
The public README claimed 43 tools (55) and 179 tests (581), titled a section
"GLPI Configuration", promised a `docker-compose.yml` that does not exist in six
places plus four npm scripts, described the Dockerfile as multi-stage (it has
one stage), and carried an MIT badge linking to a LICENSE file that was never
committed — so the declared licence did not legally exist. All corrected, the
licence added, and the 12 undocumented tools given sections.

`Hudu.json.README.md` now states plainly that the bundled spec predates 2.44.3,
lists what it gets wrong, and points at the running instance as the authority.
That file produced three confident and wrong audit findings in one day.

`OAUTH_ENABLED` — which makes the server trust `x-auth-request-*` headers — was
used in production and documented nowhere. `MCP_TRANSPORT` was accepted by the
env schema and had no effect; it is gone rather than documented, because
documenting it would have made a promise the code does not keep.

---

## [Unreleased] — Black-box round: writes that reported success

The third audit ran against the live instance and found a family the two static
reviews could not: **the MCP read HTTP 200 as proof a write happened**, on an
API that answers 200 with the record unchanged. In every one of these the
response body already in hand contradicted the claim being made about it.

Every finding below was reconfirmed here before being fixed, with an
independent read-back through the REST API. Tests 486 → 543.

### Fixed — [BUG-18] An unparseable `due_date` ERASED the stored deadline
The worst of the set, and worse than BUG-13: that one failed to write, this one
destroyed what was there. Proven on a run task, reading back after each write:

    due_date="2026-12-31"  -> 200, servidor: 2026-12-31
    due_date="banana"      -> 200, servidor: None      <- apagou
    due_date="2026-12-31"  -> 200, restaurado
    due_date="12/31/2026"  -> 200, servidor: None      <- apagou
    due_date="31/12/2026"  -> 200, servidor: 2026-12-31

Rails parses an unreadable date to nil and stores the nil. Accepted formats are
now validated before the request: ISO 8601 and DD/MM/YYYY. Note the trap the
third line exposes — the date FILTERS use MM/DD with slashes, the opposite
order, in the same MCP. The refusal message says so.

### Added — echo verification on writes
`src/utils/echo-check.ts` compares what was requested against what the response
carries back and, on divergence, refuses to call it a success. This catches the
whole family rather than its known members: `position` on a process task
answered 200 and kept the old value; a repeat flag kept the old reason. A field
absent from the response is not treated as divergence — many endpoints return a
projection, and crying wolf on every write would make the signal worthless.

### Fixed — [BUG-19] Procedure search did nothing, and `name` was exact
Two ways to narrow, both broken, silently and in opposite directions:

    sem filtro        -> 9
    search=zzzzzzzz   -> 9      <- the parameter is inert
    name=teste        -> 2
    name=test         -> 0      <- exact, though the schema said "exato ou parcial"

So no partial search of procedures existed by any route: a term matching
nothing returned everything, and a partial name returned nothing, which reads
as "does not exist". `search` also carries the most prescriptive description in
the schema, teaching the model to extract a key term — for nothing.

Filtering now happens locally for procedures (small collection, one wide page)
and the response says so. `/procedure_tasks` differs — `name` IS partial there —
so a task search is routed to the parameter that works.

### Fixed — the rest of the black-box round
- A label or flag could be attached to an id that does not exist, creating a
  phantom pendency indistinguishable from a real one. Existence is checked
  first. Hudu answers "no such record" three different ways — 200 with a `null`
  body for articles, a JSON 404 for companies, an HTML 404 for assets — and all
  three now read as missing. A check that fails for another reason does not
  block the write, and says it did not happen.
- Re-flagging with a different `description` discarded it in silence; the caller
  is now told the reason was not stored and pointed at `action="update"`.
- An out-of-enum value in a search filter answered "Nenhuma etiqueta aplicada
  encontrada." — a wrong answer wearing the face of a fact. Wrong case
  (`asset`) and cross-domain values (`Company` is valid for flags, not labels)
  are refused with the reason. An unknown `type` on procedures returned the
  whole collection; also refused.
- The task list named only the first of N owners with nothing to mark the rest.
  It shows `Ana +2`. "Demais responsáveis" no longer repeats the principal.
- The date filters advertise what they actually do: the range end is EXCLUSIVE
  (the schema's own former example, `2026-01-01,2026-01-31`, discarded the 31st
  entirely), an invalid date is ignored and returns everything, and slashes mean
  MM/DD here versus DD/MM in `due_date`.

### Note on the audit itself
Of the three audits, the two static ones produced the critical BUG-13 and
BUG-14 — and also three false findings and one recommendation that would have
introduced a bug, all from reasoning over the bundled `Hudu.json`, which
predates 2.44.3. A stale spec inside the repository is worse than none: it
reads as primary source. The black-box audit corrected one of its own findings
after discovering its harness could not tell "wrote nothing" from "returned
422".

---

## [Unreleased] — Audit round: what the parity pass got wrong

Three independent audits over the parity pass below — an adversarial code
review, a naming review of all 55 tools, and black-box calls against a live
Hudu 2.44.3 instance. Findings were re-verified here before being accepted:
three of the code review's were refuted (it reasoned from the bundled
`Hudu.json`, which predates 2.44.3), and one of the naming review's
recommendations would have introduced a bug.

Tool count unchanged at 55. Tests 429 → 486.

### Fixed — [BUG-13] `complete` reported success and did nothing (CRITICAL)
Live: the tool answered "Tarefa marcada como concluída." while an independent
read of the same task still said `completed: false`. The rendered table said
`| Concluída | Não |` directly beneath the success message.

`Api::V1::ProcedureTasksController#update` calls `update!(procedure_task_params)`
and that `permit` does not list `completed` or `completion_notes`. Rails drops
them; the update succeeds having changed nothing.

Marking a task done is **not possible over the public REST API**. The official
in-product MCP can do it (`RunTaskCompleteTool`) because it goes through
ActiveRecord and never meets strong params — parity was assumed, not verified.
`complete`/`uncomplete` now refuse with a message naming the limitation and the
routes that still work; `completed` and `completion_notes` were removed from
`fields`, and sending either is refused rather than dropped in silence.

The unit test that shipped with the feature passed because it asserted the
payload SENT and never what the server did with it. It has been replaced.

### Fixed — [BUG-14] API error bodies reached the log and the model unfiltered
`describeApiError` copied the response body into `error.message`, which lands in
the winston DailyRotateFile on disk AND the model's context. The repo masks
secrets on every success path (`search.ts`, `formatPasswordDetail`) and had
nothing here. Demonstrated against the built client: a 401 body echoing a key,
and a uniqueness error quoting a password value, both passed through verbatim.

`src/utils/redact.ts` now masks labelled secrets (en + pt-BR), quoted values
after a secret word, and bare high-entropy runs, then caps the message. The
actionable part survives — `Color must be one of: Red, Blue, …` is unchanged.

### Fixed — [BUG-15] "sem mais resultados" became a lie
`toPagedResponse` infers `hasMore` from `records.length >= pageSize`. That held
only while the cap was 25 and coincided with the API's own ceiling. After the
cap rose to 1000, asking for 100 and receiving 25 printed "sem mais resultados"
— so `/asset_layouts`, which ceilings at 25, reported a 25-record instance.
A short page landing exactly on a known ceiling is now reported as
indeterminate; an arbitrary count is still a genuine end; a known total
overrides the guess entirely.

### Fixed — [BUG-16] `id` advertised actions the tool did not have
One shared literal named "get, update, delete ou archive" for 21 tools. 17 had
no `archive`; three were much further off (`hudu_manage_dashboard_widgets` and
`hudu_manage_entity_relations` offer only create and delete,
`hudu_manage_public_photo_gallery` only update). The sentence is now generated
from each tool's own action enum, and a test walks every registered tool so the
drift cannot come back.

### Fixed — [BUG-17] `hudu_search_asset_layout_templates` was dead (pre-existing)
Found by live revalidation, not by any audit. On saturation the executor
returned `{records, page_size_capped}` instead of the array, and the formatter
called `.map()` on it: **every call** on an instance with 25+ layouts died with
`paged.records.map is not a function`, including the no-argument one. Present
since before this work. The cap now travels in the response `warning` channel.

Same commit: the warning was rendered only on the SDK handler path, while the
Streamable HTTP transport this deployment serves goes through a second path
that dropped it — a caveat that existed in code and reached no caller. Both
paths render it, and a test asserts every `formatToolResponse` call site does.

### Fixed — smaller, all from the audits
- `priority` had no enum and claimed to vary per instance. It is closed:
  `unsure, low, normal, high, urgent`. Two of the five were unreachable.
- `include: ["meta"]` was fetched and then discarded by the label formatter.
- Absent progress rendered as `0/0`, inventing "a process with no tasks".
- `remove`/`unflag` skipped the record-type validation `apply`/`flag` perform.
- `escapeMarkdown` escaped `|` but not newlines, so a multi-line flag reason
  broke the table from that row down.
- Labels/flags bypass `HUDU_ALLOWED_COMPANY_IDS`; the log warning was a
  process-level latch. The caveat now rides in the response body.
- `uploadable_type` and `passwordable_type` gained enums — from their OWN
  validations. A blanket "reuse the record-type list" would have been wrong
  both ways: uploads exclude Company, and `ALLOWED_PASSWORDABLE_TYPES` is
  `["Asset"]` alone. Relations and activity logs stay free text because their
  models carry no inclusion validation.

### Changed — naming
- `hudu_manage_record_labels` → `hudu_manage_labeled_records`,
  `hudu_search_record_labels` → `hudu_search_labeled_records`. The pair was
  named from the label side while the flag pair was named from the record side;
  the cause was `hudu_manage_record_flags` landing at 24 characters against a
  25-character floor. Renamed before publication, so nothing broke.
- All 55 tools now satisfy the naming rules: names in range, descriptions in
  280–400, and the MCP identifier named at least twice. 10 of the 12
  descriptions that failed the last rule came from the parity pass.

### Norm
`DIRETRIZES-OBRIGATORIAS-MCP-TOOLS-NOMENCLATURA.md` gained an explicit
exemption for bridge tools. The naming rules prescribe `{MCP_ID}_get_prompt`
and also demand 25+ characters — mutually unsatisfiable for a short prefix
(`hudu_get_prompt` is 15, and `hudu_list_mcp_resources` still only 23). The
amendment states the arithmetic so the next audit does not re-flag it, and
keeps bridge DESCRIPTIONS bound by every other rule.

---

## [Unreleased] — Parity pass against the official Hudu MCP (labels, flags, process/run)

Hudu 2.4x ships its own in-product MCP server (Rails, `app/tools/*.rb`, OAuth,
`POST /mcp`). This round compared it tool by tool against ours and closed the
gaps that mattered. The two are not interchangeable: theirs reads through
ActiveRecord with per-user Pundit scoping over ~8 domains; ours is an external
REST client covering ~20 with write access. Validated live against a Hudu
2.44.3 instance on 2026-08-27 (30/30 checks, all test records cleaned up).

Tool count: 47 → 55.

### Added — Labels (4 tools)
The REST API exposes `/labels` and `/label_types` with full CRUD and the MCP
covered neither.
- `hudu_manage_label_definitions` / `hudu_search_label_definitions` — the
  catalogue: name, colour (hex), applicable record types, company scope.
- `hudu_manage_labeled_records` / `hudu_search_labeled_records` — assignments.
  `apply` is idempotent (a repeat returns the existing assignment instead of
  tripping the unique index) and `remove` resolves the assignment id from the
  `(label_type_id, labelable_type, labelable_id)` triple the caller actually
  knows — the API only deletes by an id the caller never sees.
- List rows hydrate `label_type_id` into the label's name and colour, so a
  listing reads as names rather than a wall of ids. Hydration failure degrades
  to ids rather than failing the call.

### Added — Flags (4 tools)
`/flags` and `/flag_types` are full CRUD in the REST API. The official Hudu MCP
does not expose them at all.
- `hudu_manage_flag_definitions` / `hudu_search_flag_definitions`
- `hudu_manage_flagged_records` / `hudu_search_flagged_records`
- `flag` refuses to duplicate a marker the record already carries. Unlike
  labels there is no unique index, so without that check re-flagging would
  silently pile up duplicates.

### Fixed — [BUG-11] `kickoff`, `duplicate` and `create_from_template` were dead
- The three member actions on `/procedures` are **POST** routes; the client
  issued **PUT**. Live check: all three returned `404` with a Rails HTML error
  page, so the user saw a parse error rather than "not found".
- They also sent no body, which made them useless even once routed: `kickoff`
  could not name the run or attach an asset, `duplicate` and
  `create_from_template` could not name the copy.
- Fix: POST plus the parameters. Regression test asserts the verb and the body,
  and pins that `archive`/`unarchive` (genuinely PUT) are left alone.

### Fixed — [BUG-12] Flag colours are names, not hex
- Live finding: `FlagType` validates `color` against a fixed palette
  (Red, Blue, Green, Yellow, Purple, Orange, LightPink, LightBlue, LightGreen,
  LightPurple, LightOrange, LightYellow, White, Grey). Labels take hex. Passing
  hex — the obvious guess after working with labels — is a 422.
- Fix: the palette is an `enum` in the schema, the description says which is
  which, and a hex value is refused locally with a message naming the mistake.

### Fixed — [BUG-13] API refusals reached the model as a bare status code
- The API answers a rejected write with the reason
  (`{"error":"Validation failed","details":["Color must be one of: ..."]}`),
  but axios throws with `message = "Request failed with status code 422"` and
  the body only on `error.response`. The reason was discarded, leaving the
  model nothing to correct the call with.
- Fix: a response interceptor folds `error` + `details` into the thrown
  message. A Rails HTML error page is summarised ("endpoint não encontrado —
  verifique o método HTTP e o caminho") rather than quoted back.

### Fixed — Process vs Run were indistinguishable
- `GET /procedures` returns processes (the definition) and runs (one execution)
  in the same list. The search tool exposed neither the `type` filter nor the
  `status` / `completion_percentage` the API already sends, so a finished run
  and an untouched template rendered alike.
- Added filters: `type` (process|run), `process_scope` (global|company),
  `parent_process_id`, `archived`, `slug`, and `created_at`/`updated_at` date
  ranges.
- The list now carries a Tipo column (Template global / Processo / Execução),
  Status and Progresso, and warns in-band when a page mixes the two kinds.

### Fixed — Tasks lost their deadline, owner and subtasks
- `ProcedureTaskSerializer` has always returned `due_date`, `priority`,
  `assigned_users`, `completion_notes`, `parent_task_id`, `subtask_ids` and
  `optional`. The tool handled only name/description/position/completed.
- All of them are now writable and rendered. Added `complete` / `uncomplete`
  actions so "marcar como concluída" is one action rather than a hand-built
  update.

### Fixed — `page_size` capped at 25 on a false premise
- The shared schema capped `page_size` at 25 and told the model that 25 was
  "o limite da API Hudu". The API caps at **1000**
  (`calculate_page_size(max_size: 1000)`); live check returned 200 records in
  one page. Bulk reads were paginating 40x more than necessary.
- The cap is now 1000. The default stays 25, because a large page is what
  actually costs context — and the description now says that instead.

### Changed — Progressive field disclosure on new search tools
- Adopted the `include`-group pattern from the official MCP on the tools added
  here: rows ship trimmed to identity and the caller opts into extra groups.
  Existing search tools are unchanged; migrating them would alter the response
  shape of 20+ live-validated tools.

### Known limitation
- `/labels` and `/flags` take no `company_id`, so `HUDU_ALLOWED_COMPANY_IDS`
  cannot restrict them — scoping falls to the Hudu API key, which the API
  honours only for company-scoped keys. `FilteredHuduClient` logs a warning
  once per process when running with an allowlist. Use a company-scoped Hudu
  key for that deployment.

### Also
- Four tests in `response-formatter.test.ts` had been failing before this work
  (verified against HEAD in a scratch worktree): their expectations predated a
  dedicated global-search formatter and the manage-tool success message.
  Updated to match documented behaviour.

---

## [Unreleased] — Live-validation gap fixes (REQ-01, REQ-05, REQ-09)

Found during live validation against a live Hudu instance on 2026-05-21: three
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
- Files: `src/types.ts` (HuduIpAddress + asset_name/asset_url/company fields), `src/formatters/markdown.ts` (formatIpAddressList/Detail + ipAssetLabel helper). Test rewritten against real API shape. Live-verified against a production instance: the Ativo cell renders `<asset name> (ID: <n>)`.

### [SPEC-HUDU-FIX-001 / REQ-09 / BUG-09] Relation readability — per-endpoint names not exposed by API
- Live finding: the relations API returns a single `name` (the related entity's name) + per-endpoint `*_url`, but NO separate fromable_name/toable_name. The earlier implementation relied on those nonexistent fields, so relations rendered as opaque `Company#37`.
- Fix: render endpoints as `Type#id` (precise) and surface the `name` field as a Nome column (list) and the endpoint URLs (detail). No N+1 lookups. Full per-endpoint name resolution would require lookups and is deferred with rationale.
- Files: `src/types.ts` (HuduRelation + fromable_url/toable_url/is_inverse), `src/formatters/markdown.ts` (formatRelationList/Detail). Test rewritten against real API shape. Live-verified against a production instance: the Nome column shows the related entity's own name.

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
