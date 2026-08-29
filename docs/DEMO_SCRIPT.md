# Demo script — target runtime 2:38

The recording must show a real agent invoking the page's native WebMCP tools. The guided-demo button is only a fallback and should not be the main evidence.

## Before recording

- Start from a fresh tab with board v12 and exactly three registered base tools.
- Use the same agent conversation for staging and committing.
- Keep the live registry, board version, semantic diff, digest, and receipt readable at 1080p.
- Run the full journey successfully twice without intervention before the final take.
- Record clean narration only: no copyrighted music and no unrelated brands or notifications.

## 0:00–0:12 — Hook

**On screen:** Launch board and live WebMCP registry side by side.

**Narration:**

> An agent can propose five changes. But should I approve five low-context calls, or give it broad write access? Staged offers a third option: review the outcome, then create only the capability needed to land it.

## 0:12–0:27 — Prove absence

**On screen:** Zoom the registry. Show the three base tools; point out that `commit_plan` is absent.

**Narration:**

> Staged separates proposal from authority. Before review, commit is not denied—it does not exist in the page's WebMCP tool registry. None of these initial tools can change canonical state.

## 0:27–0:57 — Real agent stages work

**On screen:** In ChatGPT's in-app browser, send:

> Prepare the Friday launch board from the overdue work. Respect policy locks, show me the complete proposed change before anything lands, and wait for my decision.

Show the real agent discover and call native tools. Return to the page: ghost changes are visible, `BILL-8` is policy-blocked, and the board remains v12.

**Narration:**

> The agent reads the same live board I see and stages one bounded plan. Billing is protected before approval, and the proposed work appears as ghost state. Production is still v12.

## 0:57–1:19 — Human edits the combined outcome

**On screen:** Change one proposed assignee and remove one operation. Briefly show `commit_plan` is still absent.

**Narration:**

> I review the combined semantic effect, not a stream of scattered calls. I can correct the assignee and remove an operation without giving the agent execution authority.

## 1:19–1:43 — Approval compiles a capability

**On screen:** Click **Compile exact capability**. Show the 64-character digest, 60-second TTL, `toolchange` increment, and `commit_plan` appearing. Expand or highlight its empty `{}` input schema.

**Narration:**

> My click freezes the edited operations with the base version, state hash, and lifetime. Only now does the page register `commit_plan`. It accepts no plan ID, token, or replacement operations. The reviewed decision is captured by the tool itself.

## 1:43–2:04 — Same agent commits once

**On screen:** Tell the same agent:

> Refresh the page's available tools. If `commit_plan` is available, execute it with empty input and report the receipt.

Show native invocation, board v13, receipt, `commit_plan` disappearing, and `undo_commit` appearing.

**Narration:**

> The same agent discovers one new capability and invokes it with empty input. The exact reviewed transition lands once, returns a digest-linked receipt, and consumes its own authority. Commit disappears; a state-bound recovery tool appears.

## 2:04–2:24 — Guarded recovery

**On screen:** Invoke `undo_commit`. Show the version/hash check, restored board, and removal of undo.

**Narration:**

> Recovery is conditional, too. Undo proceeds only while the current state still matches the receipt, so it will not overwrite newer work. Here the check passes, the demo state is restored, and the recovery capability disappears.

## 2:24–2:38 — Close

**On screen:** Replay or highlight the lifecycle: `absent → human-approved → available → consumed → guarded undo`.

**Narration:**

> Most approval systems gate an action. Staged gates the existence of the action: one reviewed outcome, one temporary WebMCP capability, one inspectable transition. Approval, compiled into capability.

## Capture checklist

- The native agent call is visible before 0:57.
- `commit_plan` is visibly absent before approval.
- The human visibly changes the agent's proposed plan.
- `commit_plan` visibly appears through the registry lifecycle, with `{}` input.
- The board changes exactly once and the receipt is readable.
- `commit_plan` visibly disappears; `undo_commit` appears and then disappears.
- Final uploaded video is public on YouTube, under three minutes, has clear English audio, and plays correctly while signed out.
