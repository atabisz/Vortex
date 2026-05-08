---
status: resolved
trigger: "Essential Mods for Skyrim collection install is stuck at 'Waiting to install' at 94% after download reached 100% (1.92 GB / 1.92 GB). Linux build."
created: 2026-05-09T00:00:00Z
updated: 2026-05-09T02:00:00Z
---

## Current Focus

hypothesis: RESOLVED — two root causes identified and fixed
test: N/A
expecting: N/A
next_action: N/A

## Symptoms

expected: Collection downloads complete, mods install sequentially, install progress advances past 94%, Vortex reaches "Finish" state for the collection
actual: Downloads complete (100%, 1.92 GB / 1.92 GB) but collection install is stuck at "Waiting to install" at 94% indefinitely. UI shows `Cancel` as the only option; play/install button not advancing.
errors: None shown in UI. Unknown what vortex.log says.
reproduction: Install "Essential Mods for Skyrim" collection (revision 295 of curated collection from Nexus Mods) on Linux. Let downloads complete. Observe progress bar hangs at ~94% with "Waiting to install" label.
started: First attempt at installing this collection on the Linux build (Phase 1 Linux port)
platform: Linux (Vortex 1.16.202604081018, running on Linux per Phase 1 Linux port work)
game: Skyrim Special Edition

## Known Context (Linux port)

- FOMOD installer path was migrated to .NET 9 recompile (Wine wrapper explicitly rejected per CLAUDE.md constraints). Many mods in "Essential Mods for Skyrim" are likely FOMOD-based — if the .NET FOMOD installer is failing or hanging on Linux, all downstream mod installs queue up behind it.
- Collections use `installer_fomod_ipc`, `installer_fomod_native`, `installer_fomod_shared`, `installer_nested_fomod` extensions (confirmed loaded in vortex.log).
- There is a prior resolved session (skyrim-crash-after-mod-install-uninstall) about plugins.txt handling, but that was about POST-install crash, not stuck install.

## Eliminated

- hypothesis 2 (modal dialog not rendering): No evidence of any dialog blocking in log or source. CollectionProgress.tsx shows "Waiting to install" when `installing.length === 0` — this means no mod has entered Redux "installing" state, not that a dialog is stuck.
- hypothesis 3 (FOMOD extraction failure of specific mod): The execute-permission bug affects all FOMOD mods uniformly, not one specific mod.
- hypothesis 4 (p-queue deadlock): mDependencyInstallsLimit is a ConcurrencyLimiter, not p-queue. No deadlock evidence.
- hypothesis 5 (permission dialog that Linux can't present): No polkit or privilege-escalation dialog in the install path for non-deployment steps.

## Evidence

- timestamp: 2026-05-09T00:00:00Z
  checked: .config/Vortex/vortex.log exists; `installer_dotnet`, `installer_fomod_ipc`, `installer_fomod_native`, `installer_fomod_shared`, `installer_nested_fomod` extensions all loaded (lines 197-201 of log grep).
  found: Collections extension loaded. Multiple FOMOD installers loaded. No immediate error in summary grep.
  implication: Install subsystem initialized. Root cause likely deeper — either in queue processing, FOMOD dispatch to .NET host, dialog blocking, or collection meta state.

- timestamp: 2026-05-09T01:00:00Z
  checked: CollectionProgress.tsx line 195 — "Waiting to install" label logic.
  found: `labelLeft={installing.length > 0 ? t("Installing") : t("Waiting to install")}` — label shows "Waiting to install" when `installing.length === 0`, meaning no mod has entered Redux "installing" state.
  implication: InstallDriver session tracking is stuck. Either installs aren't starting at all, or they start, fail, and don't update tracking.

- timestamp: 2026-05-09T01:10:00Z
  checked: installer_fomod_ipc installer.ts — how FOMOD installs connect to .NET binary on Linux.
  found: Creates VortexIPCConnection. VortexIPCConnection strips `.exe` suffix on Linux (line 91-92). Resolves ModInstallerIPC path via `getVortexPath("package_unpacked")` pointing to app.asar.unpacked.
  implication: FOMOD installer correctly targets ModInstallerIPC (not .exe). If the binary exists but is non-executable, every FOMOD install will get EACCES or IPC timeout.

- timestamp: 2026-05-09T01:15:00Z
  checked: /opt/Vortex/resources/app.asar.unpacked/node_modules/@nexusmods/fomod-installer-ipc/dist/ModInstallerIPC permissions.
  found: `-rw-r--r--` — no execute bit. `file` confirms it is an ELF 64-bit LSB pie executable. Direct execution returns "Permission denied".
  implication: PRIMARY ROOT CAUSE CONFIRMED. ModInstallerIPC is not executable. Every FOMOD install attempt fails at the OS level.

- timestamp: 2026-05-09T01:20:00Z
  checked: npm package source permissions for node_modules/.pnpm/@nexusmods+fomod-installer-ipc@0.13.1/node_modules/@nexusmods/fomod-installer-ipc/dist/ModInstallerIPC
  found: `-rw-rw-r--` — no execute bit in the npm package itself.
  implication: Upstream npm package bug. electron-builder faithfully preserves the rw-rw-r-- permissions when extracting to app.asar.unpacked. Fix must set +x before packing (in beforePack hook).

- timestamp: 2026-05-09T01:25:00Z
  checked: InstallManager.ts startQueuedInstallation() catch block — what happens when a FOMOD install fails after 3 retries.
  found: Calls showDependencyError() then falls off the end. No event emitted. Session tracking in InstallDriver never updated. Mod stays in "downloaded" status indefinitely.
  implication: SECONDARY ROOT CAUSE CONFIRMED. After 3×30s FOMOD retry failures (~90s per mod), the mod is stuck in "downloaded" state. pollAllPhasesComplete() waits for the 5-minute stall timeout (then 10-minute) before resolving. With many FOMOD mods in a collection, this compounds into an apparent hang.

- timestamp: 2026-05-09T01:30:00Z
  checked: InstallDriver.ts — what events are listened to for tracking dependency state transitions.
  found: Listens to did-install-mod, did-install-dependencies, did-finish-download, did-import-downloads, free-user-skipped-download, collection-mod-skipped. No handler for install failure or user-canceled install.
  implication: Gap confirmed — the "downloaded → failed" and "downloaded → skipped" transitions are not covered. Adding did-fail-dependency / did-skip-dependency handlers closes the gap.

## Resolution

root_cause: |
Two compounding root causes:

1. PRIMARY: @nexusmods/fomod-installer-ipc ships ModInstallerIPC (a .NET 9 self-contained
   ELF binary) without the execute bit set — an upstream npm package bug. electron-builder
   preserves whatever permissions exist in node_modules, so the binary ends up with rw-r--r--
   in app.asar.unpacked. Every FOMOD install fails with EACCES / IPC connection timeout (30s
   per strategy). The IPC installer retries 3 times before giving up (~90s per FOMOD mod).

2. SECONDARY: When startQueuedInstallation() exhausts its retry count, it calls
   showDependencyError() but does not update session tracking. The mod stays in "downloaded"
   status forever. getTerminalModCount() never counts it, isComplete never fires, and
   pollAllPhasesComplete() waits for the 5-minute then 10-minute stall timeout before
   resolving. With many FOMOD mods in a 1.92GB collection, this compounds into an hours-long
   apparent hang.

fix: |
Three files modified:

1. src/main/electron-builder.config.cjs — Added chmod 0o755 on ModInstallerIPC in the
   Linux beforePack hook. This sets the execute bit before electron-builder scans the
   build directory, so app.asar.unpacked contains an executable binary.

2. src/renderer/src/extensions/mod_management/InstallManager.ts — In the
   startQueuedInstallation() catch block, emit did-fail-dependency after showDependencyError()
   (max retries path), and emit did-skip-dependency on UserCanceled/ProcessCanceled path.

3. extensions/collections/src/util/InstallDriver.ts — Added updateFailedOrSkipped helper
   and did-fail-dependency / did-skip-dependency event listeners. Uses lookupFromDownload()
   for matching (consistent with did-finish-download pattern), with a fallback to direct
   tag/MD5/logicalFileName comparison when the download is unavailable.

Runtime workaround for existing installs (without rebuild):
chmod +x /opt/Vortex/resources/app.asar.unpacked/node_modules/@nexusmods/fomod-installer-ipc/dist/ModInstallerIPC

files_changed:

- src/main/electron-builder.config.cjs
- src/renderer/src/extensions/mod_management/InstallManager.ts
- extensions/collections/src/util/InstallDriver.ts

## Hypothesis Seeds (to triage)

1. .NET FOMOD installer subprocess not starting or hanging on Linux (IPC to .NET host silently fails) — CONFIRMED ROOT CAUSE 1
2. Collection install queue blocked on a modal dialog (e.g. "Did you pay for Anniversary Edition?") that isn't rendering / isn't dismissible on Linux — ELIMINATED
3. A specific mod needing installer_fomod_native fails to extract, queue halts — ELIMINATED (affects all FOMOD uniformly)
4. Concurrent install limit or p-queue deadlock — ELIMINATED
5. Deployment/activation step awaiting permission dialog that Linux can't present — ELIMINATED
6. (emerged) startQueuedInstallation never emits fail/skip events so InstallDriver tracking freezes — CONFIRMED ROOT CAUSE 2
