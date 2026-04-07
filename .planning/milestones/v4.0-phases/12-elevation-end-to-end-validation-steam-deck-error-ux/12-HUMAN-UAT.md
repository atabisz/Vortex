# Phase 12 — Human UAT Checklist

**Requirement:** ELEV-05 — All user-triggered elevation operations complete successfully on desktop Linux without crashing or hanging

**Prerequisite:** Phase 11 persistent elevation token (polkit session rule) is installed.

## Desktop Linux (GNOME/KDE) — ELEV-05

Perform each operation on a desktop Linux system with a polkit agent running (standard GNOME or KDE session).

- [ ] **Mod deployment (hardlinks):** Install a mod for a managed game, trigger deployment. Deployment completes without error or hang. User is prompted for password at most once per session (Phase 11 token).
- [ ] **Mod deployment (symlinks via symlink_activator_elevate):** Switch deployment method to symlinks, deploy. Deployment completes. No crash or hang.
- [ ] **Permission repair:** Trigger a file permission fix operation. Completes without error.
- [ ] **Second elevation in same session:** After first password prompt, trigger another elevation operation. No re-prompt (Phase 11 session token active).
- [ ] **Fresh session re-prompt:** Close and relaunch Vortex. Trigger elevation. Password prompt appears (token does not persist across sessions).

## Steam Deck Game Mode — ELEV-06

Perform on SteamOS in Game Mode (no polkit agent), or simulate by setting `/etc/os-release` to contain `ID=steamos` and ensuring `sudo -n` fails.

- [ ] **Notification appears:** Trigger an elevation operation. A visible error notification appears with the message "Elevation is not available in Steam Game Mode. Switch to Desktop Mode to perform this operation."
- [ ] **Notification is dismissible:** The notification can be dismissed by the user. No "stuck" UI state.
- [ ] **Vortex remains functional:** After dismissing the notification, Vortex is still usable (not in a broken state).

## Pass Criteria

- All desktop Linux checkboxes pass on at least one GNOME or KDE system
- All Steam Deck checkboxes pass on SteamOS or simulated environment
- No crashes, hangs, or unhandled promise rejections observed in the console

## Notes

- If any desktop Linux operation fails, file a follow-on quick task or Phase 12.1 — per D-06, bugs found here are not Phase 12 code scope.
- ELEV-06 automated coverage is in `elevated.test.ts` (notifier tests). This manual check validates the end-to-end UX.
