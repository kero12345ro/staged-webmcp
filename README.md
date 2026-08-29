# Staged

**Git-style control for agent actions.**

Staged lets an AI agent prepare a multi-step plan on an isolated branch while canonical application state stays untouched. A human reviews and edits one deterministic diff. Approval dynamically exposes an exact, expiring, one-use WebMCP `commit_plan` capability. A successful commit produces a verifiable receipt and exposes `undo_commit` only while the receipt still matches current state.

![Staged launch-control demo](artifacts/initial.png)

## Why this exists

Browser agents are getting the ability to act, but the usual controls are poorly matched to multi-step work:

- Per-call approval interrupts the user without showing the whole outcome.
- Broad session approval gives the agent more authority than the current task needs.
- A final “Are you sure?” dialog arrives too late to make the plan understandable.
- Retrying partially completed actions can duplicate side effects.
- Undo is often promised without checking whether newer work would be overwritten.

Staged borrows the control model that made collaborative software development safe: **branch → diff → review → commit → receipt → revert**.

## The demo

The included launch-operations workspace makes the mechanism visible:

1. The agent reads the canonical board through `get_launch_board`.
2. It calls `stage_plan` with several proposed operations.
3. Valid operations appear as a ghost preview; a protected billing operation is blocked by policy.
4. The human changes an assignee or removes operations from the diff.
5. `commit_plan` is still absent from the browser tool registry.
6. The human approves the exact edited diff.
7. The page dynamically registers `commit_plan` for 60 seconds using `AbortSignal`.
8. The agent calls it once. The plan lands as one state transition and returns a receipt.
9. `commit_plan` disappears. `undo_commit` appears only while the receipt matches.
10. Undo verifies version and state hash before compensating the reversible changes.

![Receipt after an approved commit](artifacts/committed.png)

## Native WebMCP tool lifecycle

| Tool | Availability | Authority |
| --- | --- | --- |
| `get_launch_board` | Always | Read canonical board and policy locks |
| `stage_plan` | Always | Write only to an isolated review branch |
| `inspect_staged_plan` | Always | Read the current diff and approval state |
| `commit_plan` | Only after human approval; 60-second TTL; one use | Commit only the closure-bound approved plan |
| `undo_commit` | Only after a successful reversible commit | Compensate only if the receipt still matches |

The important part is what the agent **cannot** submit to `commit_plan`: no plan ID, approval token, nonce, operations, or replacement payload. Those values are bound inside the website when the human approves. The tool has an empty input schema.

## Why WebMCP is essential

Staged is not a backend MCP server placed behind a web UI. Its core behavior depends on the browser-native relationship between a live page, its signed-in state, the human, and the agent:

- The agent sees the same current board and policy state the human sees.
- Tool availability changes with page state.
- `AbortController` revokes approval immediately, without trusting the agent to stop.
- The human edits the plan in normal UI before any consequential capability exists.
- The browser registry itself proves whether commit authority is available.

Without WebMCP, the product would need a separate remote tool server, duplicated authentication and state synchronization, and an out-of-band approval channel.

## Safety invariants demonstrated

- **Stage is not execute.** `stage_plan` never mutates canonical board data.
- **Policy precedes approval.** Protected `BILL-*` work is rejected before the review branch is created.
- **Approval is exact.** The capability is bound to one edited plan, not a category of future actions.
- **Authority expires.** Approval is removed through the registration's `AbortSignal`.
- **Commit is stale-safe.** A base-version mismatch refuses the commit and requires restaging.
- **Retry is idempotent.** Concurrent calls share the same in-flight result; an already committed plan is not applied twice.
- **Undo is conflict-safe.** It refuses to overwrite state that no longer matches the receipt.
- **Receipts are inspectable.** Before/after versions and SHA-256 state hashes make the transition visible.

## Architecture

```text
WebMCP-aware agent
        │
        ├── get_launch_board / stage_plan / inspect_staged_plan
        ▼
Isolated staged plan ───────────────┐
        │                           │
        ▼                           │
Human-editable semantic diff        │ canonical state unchanged
        │                           │
        └── explicit approval ──────┘
                    │
                    ▼
      dynamic commit_plan registration
      (closure-bound · TTL · AbortSignal)
                    │
                    ▼
         version check → state transition
                    │
                    ▼
       receipt → conditional undo_commit
```

The hackathon demo keeps its deterministic state engine in the browser so the entire mechanism is inspectable. A production adapter should place canonical data, idempotency records, and compare-and-swap commit logic in the application's authenticated server transaction while preserving the same WebMCP capability lifecycle.

## Run locally

Requirements:

- Node.js 22.13 or newer
- npm, pnpm, or Bun
- Chrome 149+ with WebMCP testing enabled for native tool inspection

```bash
npm install
npm run dev
```

Open the printed local URL. In an ordinary browser the guided demo uses the exact same tool handlers through a local preview registry.

For native WebMCP:

1. Open `chrome://flags/#enable-webmcp-testing`.
2. Set it to **Enabled** and relaunch Chrome.
3. Open the app and inspect the Application → WebMCP panel.

The equivalent automation flags are:

```text
--enable-experimental-web-platform-features
--enable-features=WebMCPTesting,DevToolsWebMCPSupport
```

## Verification

```bash
npm run lint
npx tsc --noEmit
npm run build
npx playwright install chromium
npm run test:webmcp
```

The Playwright suite drives Chrome's real `document.modelContext` API. It verifies:

- only the three base tools exist initially;
- native `executeTool()` can stage a plan;
- policy-blocked work does not enter the diff;
- `commit_plan` appears only after a human click;
- native commit consumes that tool and exposes `undo_commit`;
- native undo removes its own capability;
- revoking approval removes `commit_plan` without touching canonical state.

## Scope and limitations

This project demonstrates a control primitive, not a claim that every external action is reversible.

- Demo operations are deliberately reversible board changes.
- Receipts are hashes, not signatures.
- Tab-local demo state is not a production system of record.
- Irreversible payments, emails, deployments, and third-party calls need domain-specific preview, server-side idempotency, compensation, and escalation policy.
- WebMCP is still an evolving browser API, so the app retains an interactive fallback rather than becoming WebMCP-only.

## Built for the OpenAI WebMCP Challenge

Staged is a new project built for the 2026 OpenAI WebMCP Challenge. Its goal is simple:

> WebMCP gives agents capability. Staged gives people understanding, control, and the right to change their mind.

## License

[MIT](LICENSE)
