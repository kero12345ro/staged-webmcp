# Devpost submission draft

This file is the copy-ready English submission for the OpenAI WebMCP Challenge. Replace each `PENDING` field only after the corresponding public artifact has been verified.

## Project details

- **Title:** Staged
- **Tagline:** Approval, compiled into capability.
- **One-line summary:** Staged turns one human-edited diff into a 60-second, empty-input WebMCP commit tool bound to that exact reviewed snapshot.
- **Live URL:** https://staged-webmcp.yihan.chatgpt.site
- **Public repository:** https://github.com/kero12345ro/staged-webmcp
- **Public YouTube demo:** `PENDING — record after two successful real-agent rehearsals`
- **License:** MIT

## Why this use case is a strong fit for WebMCP

Staged uses the live WebMCP tool registry as an authority surface, not merely as API transport. The agent begins with tools to read the board, stage a policy-checked plan, and inspect it; none can commit canonical state. After a person reviews and edits the combined diff, the page dynamically registers a no-argument `commit_plan` tool with `document.modelContext.registerTool()`. Its closure captures the frozen, digest-bound decision, and its `AbortSignal` removes the capability on invocation, human revocation, or 60-second expiry. This shared page state and dynamic tool lifecycle are the core product behavior, making WebMCP essential to the experience rather than an added integration.

## How it creates a better user experience

Per-call confirmations fragment a multi-step outcome into low-context interruptions. Staged instead lets the agent prepare the work while canonical data remains unchanged, then gives the person one semantic diff to understand and edit. In the demo, a protected billing operation is blocked before review, proposed changes appear as ghost state, and the reviewer can remove an operation or change its assignee. Approval grants only the capability needed to land that edited result. The commit returns a visible receipt linking the approval digest, before/after versions, and state hashes. A guarded `undo_commit` then rechecks the current version and state hash before compensation and refuses if newer state no longer matches.

## What people and agents can now do together

Ordinary confirmation usually approves an already selected call while the same tool remains continuously callable. Staged makes the person's review decision change the agent's live capability set. Before approval, no registered Staged WebMCP tool can commit canonical state. After approval, `commit_plan` appears briefly with an empty input schema, so the agent cannot substitute another plan at commit time. The first invocation consumes that authority; concurrent duplicates coalesce onto one transition and receipt. The receipt can then expose a different, state-bound recovery capability. Other architectures can reproduce parts of this with separate servers and approval channels, but WebMCP makes the handoff native, visible, and synchronized inside the same page where the person reviews the outcome.

## How WebMCP was implemented

The app uses React/Vinext and WebMCP's imperative API. A framework-independent compiler in `lib/staged-capability.ts` structured-clones and deeply freezes the reviewed operations, binds the base version, base-state SHA-256 hash, and TTL, then computes a canonical approval digest. The dynamically registered commit closure accepts `{}`, consumes its registration before asynchronous work completes, rechecks version and hash, coalesces concurrent duplicate calls onto one result, and emits a digest-linked receipt. Undo rechecks the committed version and state hash before restoring reversible demo state. Native Playwright tests drive Chrome's real `document.modelContext.getTools()` and `executeTool()` APIs to verify staging, human editing, policy rejection, dynamic registration, concurrent replay, revocation, expiry, commit, and undo.

## Potential impact

The demo uses a launch-operations board because the entire authority transition is easy to inspect, but the control pattern targets teams that let agents prepare consequential batches in CRM, CMS, admin, and operational systems. These workflows need more context than a sequence of isolated approval popups, but they should not require broad write access before a concrete plan exists. Staged offers a narrow contract: agents prepare mechanics, people judge the combined outcome, and the site grants only the exact temporary capability needed to land that reviewed decision. This project is a reference implementation; production adapters must bind the lifecycle to authenticated server transactions and durable audit records.

## Testing instructions

### Preferred: ChatGPT in-app browser

1. Open the live URL in ChatGPT's in-app browser.
2. Confirm the registry strip initially shows only `get_launch_board`, `stage_plan`, and `inspect_staged_plan`; `commit_plan` must be absent.
3. Ask the agent: **“Prepare the Friday launch board from the overdue work. Respect policy locks, show me the complete proposed change before anything lands, and wait for my decision.”**
4. Confirm the canonical board remains at v12, the proposed diff is visible, and protected `BILL-8` is blocked.
5. In the page UI, edit one assignee or remove one proposed operation, then click **Compile exact capability**.
6. Confirm the registry now shows `commit_plan`, its input schema is empty, and the approval digest and 60-second countdown are visible.
7. Ask the same agent: **“Refresh the page's available tools. If `commit_plan` is available, execute it with empty input and report the receipt.”**
8. Confirm the board advances once to v13, the returned receipt matches the page digest, `commit_plan` disappears, and `undo_commit` appears.
9. Invoke undo from the agent or UI. Confirm the receipt-bound state check succeeds, the board is restored, and `undo_commit` disappears.

### Chrome alternative

Use Chrome 149 or newer. Enable `chrome://flags/#enable-webmcp-testing`, relaunch, open the live URL, and inspect Application → WebMCP while following the same steps.

### Ordinary-browser fallback

If native WebMCP is unavailable, the guided demo runs the same handlers through the page's preview registry. This demonstrates the product flow, but native ChatGPT or Chrome is preferred because the judge can inspect the real tool lifecycle.

### Local verification

```bash
npm ci
npm run lint
npx tsc --noEmit
npm run build
npx playwright install chromium
npm run test:webmcp
```

The Playwright suite contains three native WebMCP lifecycle tests and two capability-compiler tests. Together they cover human edits, digest binding, concurrent duplicate calls, revocation, exact TTL expiry, guarded undo, and preservation of a still-valid undo receipt during non-canonical follow-up staging.

## Honest scope

- The SHA-256 digest is an inspectable integrity fingerprint, not a signature or cryptographic proof of human identity.
- The demo proves one tab-local state transition, not durable exactly-once delivery across processes or networks.
- Guarded undo covers the reversible board operations shown; it is not a promise that payments, emails, deployments, or arbitrary third-party side effects can be reversed.
- The reusable compiler is a reference primitive, not a production-ready authorization system.
