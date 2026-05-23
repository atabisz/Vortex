# Phase 36 Done Gate

> Seeded Wave 3; populated through Wave 4–5; finalized Wave 6.

## SYNC-36b — SSH-signed canonical tag

- **Date:** 2026-05-23T04:41:06Z
- **Tag:** `v2.0.1-linux-rebased` (annotated, SSH-signed)
- **Tag-object SHA:** `git rev-parse v2.0.1-linux-rebased` → tag wrapper (annotated)
- **Target commit:** `c4d1b4555c06f4b549b2c2169a754918edb64530` (= Wave 1 merge commit)
- **Merge SHA referenced in body:** `c4d1b4555c06f4b549b2c2169a754918edb64530`
- **Path C anchors in body:**
    - `d494bcb7d` — 1st parent / pre-merge master tip
    - `f1425a5c8` — 2nd parent / v8.1/config-bucket tip
    - `f25ff55da` — upstream tag `v2.0.1`, reachable via 2nd-parent ancestry through `aa3faf7e5`
    - `e2127cecb..f1425a5c8` — Phase 32-35 atomic-commit range
    - `phase36/pre-surgical-snapshot` — rollback safety tag (= `f1425a5c8`)
- **Signature verify:** PASS — `git tag -v v2.0.1-linux-rebased` exit 0 (`Good "git" signature for alex@tabisz.org with ED25519 key SHA256:rZjFFKESAOV69TJWFlDoh/mz5xtoklS5CpPOL442wKc`)
- **Annotation body:** see `git cat-file -p v2.0.1-linux-rebased`
- **Push to fork:** OK — `git push git@github.com:atabisz/Vortex.git v2.0.1-linux-rebased` → `[new tag] v2.0.1-linux-rebased -> v2.0.1-linux-rebased`
- **Push to origin (Nexus-Mods/Vortex):** REJECTED — `ERROR: Permission to Nexus-Mods/Vortex.git denied to atabisz` (expected per memory `project_upstream_pr_policy.md`; non-blocking)
- **release-linux.yml run ID:** `26323706583`
- **release-linux.yml URL:** [https://github.com/atabisz/Vortex/actions/runs/26323706583](https://github.com/atabisz/Vortex/actions/runs/26323706583)
- **release-linux.yml status (at Wave 3 close):** `in_progress` (Wave 4 watches to conclusion)

### Side note: gpg.ssh.allowedSignersFile bootstrap

`git tag -v` initially errored with `gpg.ssh.allowedSignersFile needs to be configured`. Wave 0's signing-config check verified `gpg.format=ssh` + `tag.gpgsign=true` + `user.signingkey`, but didn't assert the verifier-side allowed_signers file. Created `~/.config/git/allowed_signers` with `alex@tabisz.org ssh-ed25519 ...` line; set `git config --global gpg.ssh.allowedSignersFile ~/.config/git/allowed_signers`. Sig now verifies. The tag itself was correctly signed throughout — only the verifier setup was missing.

## SYNC-36c — Cherry-pick to linux-port

> Wave 5 fills.

## SYNC-36d — release-linux.yml smoke

> Wave 4 fills.

## Done-criteria roll-up

> Wave 6 finalises (7-criterion gate).
