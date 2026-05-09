import * as path from "path";

import * as fs from "../../../util/fs";

/**
 * On Linux, p7zip extracts ZIP entries that use Windows-style backslash path
 * separators (e.g. "Data\\SKSE\\Plugins\\file.dll") as literal files whose
 * name contains the backslash character, rather than creating a nested
 * directory tree. This walks the extraction root and moves any such files
 * into the correct directory structure so downstream `buildFileList`, the
 * FOMOD installer, and `basicInstaller.install` see the expected paths.
 *
 * No-op on win32 where p7zip handles the entries natively. Re-applied from
 * commit 728c91a85 after upstream PR #22607 (merge 5f44c9fdb) silently
 * reverted the fix.
 */
export async function normalizeBackslashPaths(basePath: string): Promise<void> {
  if (process.platform === "win32") {
    return;
  }
  const entries = await fs.readdirAsync(basePath);
  for (const entry of entries) {
    const fullPath = path.join(basePath, entry);
    if (entry.includes("\\")) {
      const normalizedRel = entry.replace(/\\/g, "/");
      const destPath = path.join(basePath, normalizedRel);
      await fs.ensureDirAsync(path.dirname(destPath));
      await fs.renameAsync(fullPath, destPath);
    } else {
      try {
        const stat = await fs.statAsync(fullPath);
        if (stat.isDirectory()) {
          await normalizeBackslashPaths(fullPath);
        }
      } catch {
        // ignore stat errors for entries that disappear during iteration
      }
    }
  }
}
