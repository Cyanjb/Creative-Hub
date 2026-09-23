# V2 foundation milestone

Baseline: `add-v1-app` at `f85142a05ca2db8b7560eb09e83798eccfa9f1a6`.
Implementation branch: `v2-foundation`. No real-data importer or provider integration.

## Runtime and shared contract

Node 22.14.0 on Windows x64 was verified with better-sqlite3 12.8.0 (SQLite 3.51.3).
The existing JavaScript Express entrypoint runs through the explicit `tsx` runtime;
its storage modules and the React client import the same Zod schemas in
`shared/v2Schema.ts`. TypeScript domain types are derived from those runtime schemas.
There is no second hand-maintained server domain model. The schema rejects unsupported
versions, unexpected fields, duplicate IDs, invalid ownership/order and dangling wires.

Domain schema version: **2**. SQLite migration version (`user_version`): **1**.

## Run locally (synthetic data only)

From `app/`:

```powershell
npm ci
npm run seed:synthetic
npm run dev
```

Seed refuses any nonempty/revisioned database. It creates one synthetic Production,
Board A and Board B sharing Shot one, Shot two for editorial-order checks, one planning
Frame, free text/image cards, one wire and a locally generated synthetic pixel asset.
No browser dataset is read, imported or activated.

Open `http://127.0.0.1:5274`. The API binds to loopback port 8788. These differ from
V1 ports. The V2 store never reads or writes localStorage or IndexedDB. Existing
Character Bible, World Builder, Script Room and planning tools remain available;
no new deferred subsystems were implemented.

The default root is `%LOCALAPPDATA%\CreativeHub\v2-foundation`. Override it with
`CREATIVE_HUB_STORAGE_ROOT` in the server environment; no `.env` or credentials are needed.
Source/repository/preservation directories are rejected as runtime roots. SQLite,
managed media, staging files and backups live beneath this external root; test roots
and browser artifacts live in OS temporary storage. Git ignores provide a second guard.

## Ownership and visual compatibility

The existing `Project` name is retained as a TypeScript alias and `projects` collection
for a V2 Production; this is not a separate legacy authority. Canonical Shots live in
`shots`, owned by a Production. `shot` remains the editable human label; `id` is identity.
Production `shotOrder` includes every owned Shot exactly once, independent of geometry.

Board nodes discriminate planning `frame`, `placement`, `image` and `text`.
A placement contains only its own ID, Shot ID and presentation/geometry. `frameView`
derives the existing render shape for Whiteboard, FrameCard, storyboard, search,
enhancement context and PDF export. Derived content is never written into placements.

Use **Make Shot** on an existing planning Frame. Use **Place here** in the editorial
bar to place any owned Shot on the current Board. Ctrl-D duplicates the selected
placement, not its Shot. **Duplicate Shot** creates a new Shot and editorial-order entry;
it does not place that new Shot automatically. The editorial arrow changes canonical
order explicitly. Storyboard scene grouping remains a Board presentation, not a second
editorial-order authority. Board or placement deletion never cascades to Shots.

Planning cards, free text/images, wires, canvas geometry and existing editors are retained.
Project JSON export now includes canonical Shots, but it is metadata only; use the
managed backup for bytes and global collections.

## Persistence and failure behavior

SQLite stores Productions, Shots, order, Boards, nodes and wires in constrained tables.
Existing story/planning collections are preserved as validated JSON collections. The
initial write API commits a complete validated workspace snapshot atomically with an
expected revision; it is intentionally simple for a local single-user milestone.
Stale writers receive HTTP 409. The client serializes saves and tracks edit generations;
an earlier response cannot mark newer edits saved. Save failures remain visible with
unsaved client edits and a retry action. Load failures never silently create a fresh state.
There is no dual-write localStorage authority. Closing with unsaved edits prompts the browser.
A stale-client conflict requires reviewing unsaved edits and reloading; automatic merging
and a conflict-resolution editor are deferred.

## Media staging and recovery

1. Record an immutable media ID, expected SHA-256/size and staging/final paths as `staged`.
2. Exclusively write staging bytes, fsync and verify their hash.
3. Mark `finalizing`, rename within the managed root and verify final bytes.
4. Only then mark `ready`. Failures record `error`; failed records cannot back a saved
   managed Asset. A crash leaves an explicit non-ready state for inspection/recovery.
5. Startup/read verification demotes missing/corrupt ready files to visible errors.

No failed staging leftovers, orphan media or deleted-Asset bytes are automatically removed.
Explicit recovery:

```powershell
npx tsx server/storageCli.ts recover-media <media-id>
```

Recovery verifies staged/final bytes and refuses to overwrite a differing final file.
Only local PNG/JPEG/WebP/GIF uploads are accepted by the foundation media endpoint.
URL-only images remain explicitly remote and are not claimed as locally preserved.

## Consistent backup and separate restore

```powershell
npm run backup
npm run restore -- "<backup-folder>" "<new-external-root>"
```

Backup uses `better-sqlite3`'s SQLite online backup API while the database may use WAL;
it does not copy an active database file. It then copies immutable ready media referenced
by that database snapshot and writes a SHA-256/size manifest. Incomplete backups have no
completed manifest. Restore requires a new separate root, checks manifest/database/media
hashes, SQLite integrity/foreign keys, shared domain validation and managed Asset links.
An incomplete-restore marker prevents activation after failure. Only successful validation
removes the marker. Restore never changes the running application's configured root.

## Verification

```powershell
npm test
npm run test:browser
npm run build
```

- 16 Node tests: canonical ownership/editing, independent geometry, editorial order,
  placement and Board deletion, distinct duplication semantics, stable IDs on relabel,
  planning/free-card/wire preservation, runtime schema rejection, HTTP errors/origin
  checks, stale revision protection, database reopen and real Express process restart,
  simulated media write/rename/finalization failures and explicit recovery, corrupt media,
  live-WAL backup/restore equivalence, invalid backup domain rejection and save queue races.
- 3 headless Edge tests in a fresh temporary context: existing canvas/storyboard shared
  editing, save error and retry, page reload, drag/resize independence, managed image
  rendering, planning edits, free text editing, placement duplication/deletion and new
  Shot IDs. Browser storage access is explicitly forbidden in the shared-edit test.
- Production build includes TypeScript checks for client/shared/server TypeScript/test code.

All required milestone acceptance checks passed on the implementation host. Synthetic
runtime/test leftovers are deliberately retained outside Git; there is no automatic cleanup.

## Remaining limitations

No milestone test failures remain. Dependency audit reports 8 findings (5 moderate,
2 high, 1 critical) in the retained V1 dependency tree, including jsPDF and Vite; this
milestone does not silently perform their major-version upgrades. No finding was reported
against the added SQLite/Zod/tsx packages. A dependency-maintenance pass remains necessary.
The production build retains the existing lazy PDF export chunk warning (>500 kB).

This milestone is not a V1 data cutover. It adds no Character Variants, References,
Takes, receipts, cost UI, real-data importing, provider adapter framework, credentials,
generation, audio editing or delivery systems. No provider request was made.

## Verified demonstration artifacts

Synthetic runtime: `%LOCALAPPDATA%\CreativeHub\v2-foundation`, revision 2.
Backup: `backups/1789922138536-f98f1507-c275-4a50-8436-3031907d25c0` under that root.
Verified separate restore: `%LOCALAPPDATA%\CreativeHub\v2-foundation-restore-verification-20260920`, revision 2.
Neither root contains imported browser data.

## Exact changed-file inventory

- `.gitignore`
- `app/.gitignore`
- `app/docs/V2-FOUNDATION.md`
- `app/package-lock.json`
- `app/package.json`
- `app/playwright.config.ts`
- `app/server/index.js`
- `app/server/seedSynthetic.ts`
- `app/server/storage/backup.ts`
- `app/server/storage/config.ts`
- `app/server/storage/migrations/001-foundation.sql`
- `app/server/storage/repository.ts`
- `app/server/storageCli.ts`
- `app/server/v2Routes.ts`
- `app/shared/v2Domain.ts`
- `app/shared/v2Schema.ts`
- `app/src/App.tsx`
- `app/src/components/canvas/FrameCard.tsx`
- `app/src/components/canvas/Whiteboard.tsx`
- `app/src/components/hub/HubDashboard.tsx`
- `app/src/components/panels/EnhanceModal.tsx`
- `app/src/components/panels/SearchPalette.tsx`
- `app/src/components/storyboard/StoryboardView.tsx`
- `app/src/lib/exportJson.ts`
- `app/src/lib/exportPdf.ts`
- `app/src/lib/factories.ts`
- `app/src/lib/importImage.ts`
- `app/src/lib/v2Persistence.ts`
- `app/src/store/assetDb.ts`
- `app/src/store/types.ts`
- `app/src/store/useStore.ts`
- `app/src/styles/app.css`
- `app/tests/browser/foundation.spec.ts`
- `app/tests/browserServer.ts`
- `app/tests/domain.test.ts`
- `app/tests/fixtures/foundation.ts`
- `app/tests/http.test.ts`
- `app/tests/persistence.test.ts`
- `app/tests/restart.test.ts`
- `app/tests/restartServer.ts`
- `app/tsconfig.json`
- `app/vite.config.ts`
