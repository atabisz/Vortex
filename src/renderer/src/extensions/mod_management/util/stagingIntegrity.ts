import * as path from "path";

import * as fs from "../../../util/fs";

/**
 * Recursively check whether a staging directory contains at least one regular
 * file. Used to detect corrupt "installed" state where Vortex recorded a mod
 * as installed but only parent directories landed on disk (e.g. the Linux
 * empty-staging-dir bug triggered by a broken extract). Returns false on any
 * fs error so the caller treats missing or unreadable dirs as empty and
 * re-extracts.
 *
 * Short-circuits on the first file found to keep the happy path cheap — a
 * fully populated staging dir typically resolves after one readdir + stat.
 */
export async function stagingDirHasFiles(absPath: string): Promise<boolean> {
  let entries: string[];
  try {
    entries = await fs.readdirAsync(absPath);
  } catch {
    return false;
  }
  for (const entry of entries) {
    const child = path.join(absPath, entry);
    const stat = await fs.lstatAsync(child).catch(() => null);
    if (stat === null) continue;
    if (stat.isFile()) return true;
    if (stat.isDirectory() && (await stagingDirHasFiles(child))) return true;
  }
  return false;
}
