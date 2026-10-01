# Design

## Context

See proposal.md for motivation and specs for behavior. The project is greenfield with Node 20.16 / npm 10.8 and an initialized local OpenSpec root. User decisions are P0 first, built-in images only, and interrupted/retry recovery after reload. New graph, task and persistence modules justify this design artifact.

## Goals / Non-Goals

**Goals:** Keep one serializable domain document authoritative; separate asset lifetime from node lifetime; validate task inputs before submission; make asynchronous completion and reload deterministic and testable; provide a clear desktop demo in Chinese.

**Non-Goals:** Cross-tab merging, remote sync, image processing, resumable service work, asset garbage collection and unbounded graph performance are outside this local demo design.

## Decisions

### Runtime and UI

Use React 19, TypeScript, Vite 6 (compatible with local Node), React Flow 12, Zustand 5 and lucide-react icons. React Flow supplies controlled world-coordinate nodes, directed handles, panning and pointer-centered zoom; a custom canvas would add coordinate and pointer risks to the P0 budget. Use ordinary CSS and custom nodes rather than another component framework. The UI has a dark workspace, left resource palette, canvas, editable node cards and visible task state. Initial graph is empty. Blank left/middle/right drag pans, wheel zooms, header dragging moves nodes. Inputs/buttons use nodrag/nopan/nowheel where appropriate. Connections have fixed source `output` and target `image` / `prompt` handles. Canvas events update the same store; no initial fitView overrides a restored viewport.

### Domain interfaces

`CanvasDocument` is version 1 with `nodes`, `edges`, `assets` keyed by ID, `tasks` array, and `viewport: {x,y,zoom}`. `CanvasNode` is a React Flow node with type image/prompt/generator and serializable `data` (label, assetId, text, ratio, failNext). `Asset` has ID, name, built-in src, dimensions, origin, timestamps and optional taskId. `Task` has ID, nodeId, input snapshot `{imageAssetId,imageNodeId,promptNodeId,prompt}`, parameter snapshot `{ratio}`, queued/running/succeeded/failed/interrupted status, timestamps, optional error and resultAssetId. No binary files or object URLs are stored.

Domain helpers expose built-in sample metadata, input resolution, connection validation, latest-task lookup and document serialization/restore. Store API exposes `doc`, `saveStatus`, `saveError`, `notice`, creation by world position, node/edge changes, connection, node/edge/selection deletion, node data update, viewport change, generate/retry, explicit save retry and notice dismissal. Internal IDs use crypto.randomUUID. At most one image and one prompt edge per generator input; invalid/duplicate/self edges are rejected. Tasks retain snapshots when connected nodes change or are deleted. Assets are retained when their visual nodes are removed, preventing loss of historical references.

### Generation service boundary

Queue delay is approximately 600 ms and running delay approximately 1600 ms. Submission snapshots current inputs and ratio atomically and consumes failNext. Reject missing image/nonempty prompt and active duplicate work before allocating a task. A one-shot failure reaches failed with an explanation. Retry uses the original failed/interrupted snapshot, creates a new task, and does not rearm its failure. Each success creates a fresh asset referencing built-in `result.svg`, a fresh result image node placed to the right of its generator without replacing its source, and an automatic generator-to-result edge only if explicitly supported (this demo does not create one: results are outputs represented by task references). Generation input edges are image/prompt-to-generator only. Result nodes can connect normally to another generator. Callback guards check active status and generator existence. Deletion interrupts active tasks so callbacks cannot create orphan results.

### Persistence and recovery

Use localStorage key `infinite-canvas:v1`. A small debounced save avoids blocking every drag frame; flush on pagehide / visibility change and immediately for task transitions. Only serializable domain data persists, not transient selection/measurement/dragging state. Restore validates version, fields, finite coordinates, image paths and all graph/task/asset references. Existing queued/running tasks become interrupted and are saved with preserved snapshots and a reload explanation. Malformed/unknown data remains untouched and auto-save is blocked until the user explicitly starts a fresh local canvas; storage exceptions show a save error with retry. localStorage is sufficient for the small metadata-only demo; IndexedDB would mainly benefit future uploads. Version upgrades belong to a future explicit migration before parsing version 2.

### Verification and delivery

Vitest covers relationship cleanup, snapshot isolation, independent results, controlled failures, active duplicate protection, refresh interruption, storage errors and corrupt-data handling. Playwright Chromium exercises actual creation, handle connections, pointer anchoring, drag movement at multiple scales, success, failure/retry, result reuse, terminal restore and active refresh. Build includes type checking. README contains startup, dependency attribution, coordinate equations, entity references, 3–5 minute demo, verified paths, limits and backend API/idempotency discussion. AI log is an honest chronological summary of available conversation with decisions and real check results; it must identify itself as a summary rather than claim an unprovided raw export or screenshots.

## Risks / Trade-offs

- Synchronous localStorage on large graphs → debounce dragging, retain only metadata, document single-tab/small-graph limitation.
- Mock timers disappear on navigation → queued/running become interrupted, preserve snapshot and retry; guards prevent stale completion.
- Input controls may conflict with node dragging → use header drag handles and interaction classes; verify with browser input and drag tests.
- Fixed mock output is not a real image model → label it in UI and README; asset/task IDs remain independent.
- Corrupt or future-version storage → preserve original value, display recovery explanation, require explicit fresh start before replacement.

## Migration Plan

No existing app data needs migration. Install locked dependencies, run tests/build and start locally. Preserve version 1 documents; later schema changes must implement a versioned migration. No deployment, archive or spec synchronization occurs automatically in this change.
