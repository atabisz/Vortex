#!/usr/bin/env node
/**
 * Platform guard for pnpm `build` / `dist` scripts chained with `&&`.
 *
 * Exits 0 on non-Windows platforms — the `&&` chain continues into the actual
 * build step.
 *
 * Exits 1 on Windows (win32) — the `&&` chain short-circuits, so the build is
 * skipped. Used for extensions that cannot currently build on Windows in this
 * tree (native bindings, shared-library assembly, etc. produced on Linux).
 *
 * Replaces an earlier inline pattern:
 *
 *   "node -e \"if(process.platform==='win32')process.exit(1)\" && (…build…)"
 *
 * The inline variant kept getting reversed back to `||` (which reads correctly
 * on Windows but short-circuits on Linux, skipping builds exactly where we
 * need them to run). A named script makes the intent explicit and the diff
 * harder to invert by accident during upstream merges.
 */
if (process.platform === "win32") {
  process.exit(1);
}
process.exit(0);
