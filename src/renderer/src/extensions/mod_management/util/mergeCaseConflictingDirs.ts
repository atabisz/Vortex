import * as path from "path";

import * as fs from "../../../util/fs";

/**
 * On Linux, archives may contain entries with case-conflicting directory
 * paths (e.g. both "Data/SKSE/plugins/" and "data/SKSE/plugins/"). The
 * case-sensitive Linux filesystem extracts these as separate directories.
 * This function merges any case-conflicting directories by moving files
 * into the first-seen (canonical) directory and removing the now-empty
 * duplicates.
 *
 * No-op on win32 where the filesystem is case-insensitive. Re-applied from
 * commit 850a3cb40 after the upstream merge that reverted the paired
 * `normalizeBackslashPaths` fix also reverted this one.
 *
 * Call after `normalizeBackslashPaths` and before `buildFileList`.
 */
export async function mergeCaseConflictingDirs(basePath: string): Promise<void> {
  if (process.platform === "win32") {
    return;
  }

  let entries: string[];
  try {
    entries = await fs.readdirAsync(basePath);
  } catch {
    return;
  }

  const dirGroups = new Map<string, string[]>();
  for (const entry of entries) {
    const fullPath = path.join(basePath, entry);
    try {
      const stat = await fs.statAsync(fullPath);
      if (stat.isDirectory()) {
        const key = entry.toLowerCase();
        const group = dirGroups.get(key);
        if (group !== undefined) {
          group.push(entry);
        } else {
          dirGroups.set(key, [entry]);
        }
      }
    } catch {
      // stat error (entry removed mid-iteration); ignore
    }
  }

  for (const [, names] of dirGroups) {
    const canonical = names[0];
    const canonicalPath = path.join(basePath, canonical);
    await mergeCaseConflictingDirs(canonicalPath);

    for (const other of names.slice(1)) {
      const otherPath = path.join(basePath, other);
      await mergeCaseConflictingDirs(otherPath);

      let otherEntries: string[];
      try {
        otherEntries = await fs.readdirAsync(otherPath);
      } catch {
        continue;
      }

      for (const file of otherEntries) {
        const src = path.join(otherPath, file);
        const dst = path.join(canonicalPath, file);
        try {
          await fs.statAsync(dst);
          // canonical already has this entry; drop the duplicate
        } catch {
          try {
            await fs.renameAsync(src, dst);
          } catch {
            // best-effort; leave in place if the move fails
          }
        }
      }

      try {
        await fs.rmdirAsync(otherPath);
      } catch {
        // not empty (some moves failed); leave the directory
      }
    }
  }
}
