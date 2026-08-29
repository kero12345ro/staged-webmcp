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
- [x] Anonymous clean-browser request returns HTTP 200 and the Staged app rather than an auth wall.
- [x] Complete the native lifecycle journey twice against the public site in ARM64 Chrome 151 with WebMCP enabled. These direct native API runs verify the browser lifecycle, not model behavior.
- [x] Verify the ordinary-browser fallback with WebMCP disabled: stage, human edit, compile, commit, and guarded undo all complete through the preview registry.
- [x] Repeat both ordinary-browser fallback and native registry checks after the final application deployment.
- [ ] Complete the exact flow twice with a real interactive Agent in ChatGPT's in-app browser or an equivalent native site-tools client before recording.
- [x] No authentication is required; judges need no credentials.

## Public repository

- [x] Complete source, assets, run instructions, tests, and MIT `LICENSE` exist locally.
- [x] Git history contains distinct, timestamped implementation commits.
- [x] Owner explicitly authorizes creation of the public repository.
- [x] Public GitHub URL opens while signed out and the anonymous GitHub API reports `visibility: public`.
- [x] Repository About/API detects the MIT license.
- [x] README hero, screenshots, local setup, limitations, and native verification are publicly readable.
- [ ] Record the exact submitted commit SHA; optionally create an annotated release tag.

## Release candidate verification

- [x] One canonical lockfile: `package-lock.json` with npm 11.17.0.
- [x] Fresh-copy `npm ci` succeeds with zero reported vulnerabilities.
- [x] Fresh-copy lint and TypeScript checks pass.
- [x] Fresh-copy Vinext/Vite production build passes.
- [x] Three native WebMCP lifecycle tests and two capability-compiler tests pass on ARM64 with Chrome 151.
- [x] Redeploy the final verified application build and repeat the signed-out live smoke test.

## Video

- [ ] Rehearse the exact real-Agent flow twice before recording. The two automated native Chrome journeys do not satisfy this model-behavior rehearsal.
- [ ] Record a clear functioning demo with English narration.
- [ ] Show a real native agent call within the first minute.
- [ ] Show `commit_plan` absent, dynamically added, invoked with `{}`, and removed.
- [ ] Show the human changing the proposed plan before approval.
- [ ] Show receipt-bound undo and its conflict-safe explanation.
- [ ] Final runtime is under 3:00; target 2:46.
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
- **Public repository URL:** `https://github.com/kero12345ro/staged-webmcp`
- **YouTube URL:** `PENDING`
- **Devpost URL:** `PENDING`
- **Submission timestamp:** `PENDING`
