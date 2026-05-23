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

## SYNC-36d — release-linux.yml smoke

- **Run URL:** [https://github.com/atabisz/Vortex/actions/runs/26323706583](https://github.com/atabisz/Vortex/actions/runs/26323706583)
- **Run conclusion:** success
- **Run duration:** 11m 37s (697 s) — within v8.0 RC baseline band (10m 58s)
- **Retries:** 0 — clean first-run; pnpm node-gyp chmod step (Pitfall 9) executed without flake
- **All 26 build steps:** success (24 ran, 2 skipped: `Update latest-linux tag`, `Create GitHub Release (master rolling)` — version-tag path took the alternate `Create GitHub Release (version tag)` step)
- **Release page:** [https://github.com/atabisz/Vortex/releases/tag/v2.0.1-linux-rebased](https://github.com/atabisz/Vortex/releases/tag/v2.0.1-linux-rebased)
- **Release name:** Linux Beta v2.0.1-linux-rebased
- **Published at:** 2026-05-23T04:52:29Z

### Assets

| Name                    | Size          | SHA256                                                             | SHA512 source      |
| ----------------------- | ------------- | ------------------------------------------------------------------ | ------------------ |
| `vortex-setup.AppImage` | 258 768 724 B | `13aa29288e8936a4dd7cdc3c9f3f669d15c7c65d3d416efee8ab2ba957059c9b` | `latest-linux.yml` |
| `vortex_amd64.deb`      | 158 044 146 B | `3d82353963d3625865bcd9281862172ede2a6f860812cc52579f1c1d7b22f3a6` | `latest-linux.yml` |
| `latest-linux.yml`      | 559 B         | (electron-updater manifest)                                        | self               |

**SHA source:** local-hash (D-36-09 boundary path — release exposes SHA512 via electron-updater `latest-linux.yml`; SHA256 obtained by `sha256sum` on downloaded artifacts; D-36-09 prohibits _running_ binaries, not hashing them).

**SHA512 cross-check (from `latest-linux.yml`, base64-encoded):**

- AppImage: `dmhP/kbpH42h8WV0V0LPGERUS577qvW9GeRY+6Ee4Yhbs+Nxd0BO/gH+JfJr7Hb3v5n70CpnEaBVN4G7p0LFTg==`
- .deb: `VVbfUJpA1UH99sZH+tlh8yLv9p5w9IN6MsTgHVNGhzA2aDO15RKrpxpyRlnQof1/0StS68OdQqvjE0l20s6fDg==`

**electron-builder version path:** internal version `1.16.202605230443` (electron-builder timestamp scheme); release tag `v2.0.1-linux-rebased` is the canonical user-visible identifier.

### Phase 37 carry-forward

Local-boot AppImage + .deb verification and 4-screenshot Skyrim walkthrough explicitly deferred to Phase 37 SYNC-37a per D-36-09. Phase 36 closes on CI-smoke evidence only (build + asset publish + manifests + SHA256). Operator UAT happens in Phase 37.

## SYNC-36c — Cherry-pick to linux-port

> Wave 5 fills.

## Done-criteria roll-up

> Wave 6 finalises (7-criterion gate).
