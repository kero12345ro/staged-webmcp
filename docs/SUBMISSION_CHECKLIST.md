# OpenAI WebMCP Challenge submission checklist

Authoritative source: [Official Rules](https://webmcp.devpost.com/rules). The rules take priority over the FAQ or any plugin-generated guidance.

## Deadline and freeze

- [ ] Submit before **September 3, 2026 at 1:00 PM PDT** (**20:00 UTC; September 4 at 04:00 Beijing time**).
- [ ] Treat the official Rules' August 25 at 11:00 AM PDT start as authoritative; the separate dates page says noon.
- [ ] After the deadline, do not edit the Devpost submission, submitted repository, or live site until winners are announced.
- [ ] Keep the submitted app free and unrestricted for judges through the judging period ending September 21, 2026 at 5:00 PM PDT.

## Eligibility and ownership

- [ ] Entrant is eligible under the country, age, employment, and conflict-of-interest rules.
- [ ] All project work is original or uses dependencies/assets under compatible licenses.
- [ ] No unlicensed music, third-party footage, or unnecessary third-party trademarks appear in the video.
- [x] Commit history clearly timestamps this new project inside the hackathon submission period.

## Live app

- [x] Production deployment exists at `https://staged-webmcp.yihan.chatgpt.site`.
- [x] Owner explicitly authorizes making the app publicly accessible.
- [ ] Anonymous clean-browser request returns the app rather than HTTP 401.
- [ ] Complete the native journey twice in ChatGPT's in-app browser or Chrome 149+ with WebMCP enabled.
- [ ] Verify both ordinary-browser fallback and native registry lifecycle after the final deployment.
- [ ] If authentication is retained, place working credentials and exact instructions in Devpost.

## Public repository

- [x] Complete source, assets, run instructions, tests, and MIT `LICENSE` exist locally.
- [x] Git history contains distinct, timestamped implementation commits.
- [x] Owner explicitly authorizes creation of the public repository.
- [ ] Public GitHub/GitLab/Bitbucket URL opens while signed out.
- [ ] Repository About section visibly detects the MIT license.
- [ ] README hero, screenshots, local setup, limitations, and native verification render correctly.
- [ ] Create a final immutable tag or release and record the submitted commit SHA.

## Release candidate verification

- [x] One canonical lockfile: `package-lock.json` with npm 11.17.0.
- [x] Fresh-copy `npm ci` succeeds with zero reported vulnerabilities.
- [x] Fresh-copy lint and TypeScript checks pass.
- [x] Fresh-copy Vinext/Vite production build passes.
- [x] Five native WebMCP Playwright tests pass on ARM64 with Chrome 151.
- [ ] Redeploy the final verified commit and repeat the signed-out live smoke test.

## Video

- [ ] Rehearse the exact real-agent flow twice before recording.
- [ ] Record a clear functioning demo with English narration.
- [ ] Show a real native agent call within the first minute.
- [ ] Show `commit_plan` absent, dynamically added, invoked with `{}`, and removed.
- [ ] Show the human changing the proposed plan before approval.
- [ ] Show receipt-bound undo and its conflict-safe explanation.
- [ ] Final runtime is under 3:00; target 2:38.
- [ ] Upload publicly to YouTube and verify playback while signed out.
- [ ] Confirm audio, text legibility, and 1080p processing before copying the URL.

## Devpost fields

- [ ] Live URL is correct and judge-accessible.
- [ ] Public repository URL is correct and contains a visible open-source license.
- [ ] Public YouTube URL is correct.
- [ ] All text and testing instructions are in English.
- [ ] Description explicitly covers: WebMCP fit, better UX, new human-agent collaboration, and implementation.
- [ ] Claims map to visible evidence and avoid “first,” “production-secure,” “cryptographically authorized,” “universal rollback,” or durable “exactly once.”
- [ ] Testing instructions state the browser/flag and give one reproducible prompt.
- [ ] Save and inspect a draft well before the deadline.
- [ ] Perform a signed-out clean-room audit of all three URLs.
- [ ] Submit, save confirmation evidence, then freeze all submitted artifacts.

## Final evidence record

- **Submitted commit SHA:** `PENDING`
- **Live deployment/version:** `PENDING`
- **Public repository URL:** `PENDING`
- **YouTube URL:** `PENDING`
- **Devpost URL:** `PENDING`
- **Submission timestamp:** `PENDING`
