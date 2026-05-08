#!/usr/bin/env node
/**
 * Platform guard for pnpm `build` / `dist` scripts chained with `||`.
 *
 * Sibling to skip-on-windows.mjs. Use this one for extensions that should
 * NOT build on Linux — typically because their native dependencies or
 * runtime integrations are Windows-only (registry reads, Windows Store
 * APIs, Xbox Game Pass detection, etc).
 *
 * Exits 0 on Linux — the `||` chain short-circuits, the build is skipped
 * without appearing as a failure to pnpm.
 *
 * Exits 1 on every other platform — the `||` chain falls through into
 * the actual build step.
 *
 * Replaces an earlier inline pattern:
 *
 *   "node -e \"if(process.platform==='win32')process.exit(1)\" || (…build…)"
 *
 * which was correct but used the opposite shell operator (`||`) for the
 * opposite-direction predicate. Using a named script here keeps the
 * intent readable (filename states the skipped platform) so future
 * merges can't silently flip the operator.
 *
 * Note the operator asymmetry with skip-on-windows.mjs: that sibling
 * uses `&&` because it exits non-zero on Windows; this one uses `||`
 * because it exits zero on Linux. Operator direction follows the exit
 * code, which follows the skipped platform — always read the filename
 * first.
 */
if (process.platform === "linux") {
  process.exit(0);
}
process.exit(1);
