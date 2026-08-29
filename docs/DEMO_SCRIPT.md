# Demo script — target runtime 2:46

The final recording must show a real interactive Agent invoking the page's native WebMCP tools. Direct `document.modelContext` automation is strong lifecycle evidence, but it is not model-behavior evidence. The guided-demo button is only an ordinary-browser fallback and must not be the main recording.

## Before recording

- Start from a fresh tab with board v12 and exactly three registered base tools.
- Use the same Agent conversation for staging, committing, and undo.
- Keep the live registry, board version, semantic diff, digest prefix, and receipt readable at 1080p.
- Run this exact interactive-Agent journey successfully twice before the final take.
- Record clean English narration only: no copyrighted music, unrelated brands, private tabs, or notifications.

## 0:00–0:13 — Hook

**On screen:** Public URL, launch board, and live native WebMCP registry side by side.

**Narration:**

> When agents make several related changes, per-call approvals hide the combined outcome, while broad write access arrives too early. Staged lets an agent draft first, lets me review one diff, and grants only the reviewed commit.

## 0:13–0:27 — Prove absence

**On screen:** Zoom the registry. Show only `get_launch_board`, `stage_plan`, and `inspect_staged_plan`; point out that `commit_plan` is absent.

**Narration:**

> On this fresh page, the native WebMCP registry exposes only read, stage, and inspect tools. commit_plan is absent, so none of Staged's initial tools can change the canonical board.

## 0:27–0:55 — Real Agent stages work

**On screen:** In ChatGPT's in-app browser or an equivalent native site-tools client, send:

> Read the current launch board. Stage this plan for human review only: assign OPS-31 to Maya Chen; move OPS-31 to `this-week`; archive OPS-27 with value `duplicate`; and attempt to move BILL-8 to `this-week`. Give a brief reason for each operation. Do not commit anything. Report accepted and blocked operations, then wait for my decision.

Show the actual site-tool activity. Return to the page: three accepted changes are visible, `BILL-8` is policy-blocked, and the board remains v12.

**Narration:**

> From the same live page, the agent reads board version twelve and stages four requested operations. The site accepts three, blocks BILL-8 under its finance policy, and renders a reviewable preview. The board is still version twelve.

## 0:55–1:13 — Human edits the combined outcome

**On screen:** Change OPS-31's assignee from Maya Chen to Jon Bell and remove the OPS-27 archive operation. Show `2 selected` and briefly show that `commit_plan` is still absent.

**Narration:**

> Now I make the judgment. I change OPS-31's assignee from Maya to Jon and remove the archive operation. The proposal changes, canonical state does not, and commit_plan is still absent.

## 1:13–1:41 — Approval compiles a capability

**On screen:** Click **Compile capability · 2 operations**. Show the 60-second countdown, the UI's digest prefix, `commit_plan` appearing in the live registry, and the card stating that its input is `{}`. The Agent's later result will show the corresponding full digest.

**Narration:**

> Only when I click Compile exact capability does the page freeze those two operations with the base version, state hash, and sixty-second lifetime. It hashes that snapshot and registers an empty-input commit_plan. The agent cannot replace the reviewed payload at call time.

## 1:41–2:08 — Same Agent commits once

**On screen:** In the same conversation send:

> Refresh the page's available WebMCP tools. If `commit_plan` is present, invoke it once with `{}`. Report the approval digest, receipt ID, before and after versions, and operation count. Do not invoke undo.

Show the native invocation, board v13, receipt, `commit_plan` disappearing, and `undo_commit` appearing.

**Narration:**

> The same agent refreshes its tools and calls commit_plan with an empty object. The board advances once to version thirteen. The approval digest is linked to the receipt, commit authority is consumed, commit_plan disappears, and undo_commit appears.

## 2:08–2:31 — Guarded recovery

**On screen:** In the same conversation send:

> Refresh the page's available WebMCP tools. If `undo_commit` is present, invoke it once with `{}`. Report whether the receipt guard passed and the resulting board version.

Show restored task state at board v14 and the registry returning to the three base tools.

**Narration:**

> Undo is limited to the reversible operations in this demo. Before restoring them, it checks that the current version and state hash still match the receipt. Here the check passes, task state is restored at version fourteen, and undo_commit disappears.

## 2:31–2:46 — Close

**On screen:** Highlight the lifecycle: `absent → human-approved → temporarily available → consumed → guarded recovery`.

**Narration:**

> Staged is a reference control pattern: absent, human-approved, temporarily available, consumed, then guarded recovery. Approval changes not just whether a call runs, but which exact capability exists.

## Shot and evidence checklist

- The public URL and **Native WebMCP connected** badge are visible.
- A real native Agent tool call is visible before 0:55.
- `commit_plan` is visibly absent before approval.
- The human visibly changes the Agent's proposal from three selected operations to two.
- `commit_plan` visibly appears with `{}` input and a 60-second lifetime.
- The UI's digest prefix visibly matches the full digest returned to the Agent.
- The board changes once from v12 to v13 and the receipt is readable.
- `commit_plan` disappears; `undo_commit` appears, passes its guard, then disappears at v14.
- Cuts may remove Agent waiting time, but the prompt, native call, result, and page transition remain continuous evidence.
- Final video is 1080p, public on YouTube, under 3:00, has clear English audio, and plays while signed out.
- Do not claim “production,” “first ever,” “cryptographically authorized,” durable network exactly-once, or universal rollback.
