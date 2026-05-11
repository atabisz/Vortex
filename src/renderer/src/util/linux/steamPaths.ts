import * as fs from "fs";
import * as path from "path";

import getVortexPath from "../getVortexPath";
import { log } from "../log";
import { xdgDataHome } from "./xdg";

/**
 * Default Steam installation paths for Linux systems
 * Ordered by likelihood (most common first)
 */
export function getLinuxSteamPaths(): string[] {
  const home = getVortexPath("home");
  const candidates: string[] = [];

  // ~/.steam/root is a symlink Steam sets to its own installation directory.
  // Resolving it gives the real path regardless of how Steam was installed
  // (apt, snap, flatpak, manual). Check this first so it takes priority over
  // any hardcoded guesses below.
  try {
    const rootLink = path.join(home, ".steam", "root");
    const resolved = fs.realpathSync(rootLink);
    candidates.push(resolved);
  } catch {
    // symlink absent — fall through to hardcoded list
  }

  candidates.push(
    // XDG standard path: respects $XDG_DATA_HOME for XDG-compliant installs
    path.join(xdgDataHome(), "Steam"),
    path.join(home, ".steam", "debian-installation"), // Debian/Ubuntu
    path.join(home, ".var", "app", "com.valvesoftware.Steam", "data", "Steam"), // Flatpak
    path.join(home, ".var", "app", "com.valvesoftware.Steam", ".local", "share", "Steam"),
    path.join(home, "snap", "steam", "common", ".local", "share", "Steam"), // Snap
    path.join(home, ".steam", "steam"), // Legacy
  );

  // Deduplicate — realpathSync may resolve to one of the hardcoded paths
  return [...new Set(candidates)];
}

/**
 * Check if a path is a valid Steam installation
 */
export function isValidSteamPath(steamPath: string): boolean {
  const libraryFoldersPath = path.join(steamPath, "config", "libraryfolders.vdf");
  try {
    fs.statSync(libraryFoldersPath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Find the first valid Steam installation path on Linux
 */
export function findLinuxSteamPath(): string | undefined {
  for (const steamPath of getLinuxSteamPaths()) {
    if (isValidSteamPath(steamPath)) {
      ensureSteamSymlinks(steamPath);
      return steamPath;
    }
  }
  return undefined;
}

/**
 * Find ALL valid Steam installation paths on Linux.
 * Returns every valid root (native, Flatpak, Snap, etc.)
 */
export function findAllLinuxSteamPaths(): string[] {
  return getLinuxSteamPaths().filter(isValidSteamPath);
}

/**
 * Ensure ~/.steam symlinks exist so that Proton/Wine can locate the running
 * Steam instance. Native Steam creates these automatically, but Snap and
 * Flatpak installations don't expose them to the host filesystem.
 *
 * Required symlinks for Steamworks SDK to function:
 * - ~/.steam/steam.pipe  → Steam IPC named pipe
 * - ~/.steam/steam.pid   → Steam process ID file
 * - ~/.steam/steam       → Steam installation root
 * - ~/.steam/root        → Steam installation root
 * - ~/.steam/sdk64/steamclient.so → 64-bit Steam client library
 * - ~/.steam/sdk32/steamclient.so → 32-bit Steam client library
 */
export function ensureSteamSymlinks(steamPath: string): void {
  const home = getVortexPath("home");
  const dotSteam = path.join(home, ".steam");

  // Find the .steam control directory that the Steam installation uses.
  // For snap: ~/snap/steam/common/.steam/
  // For flatpak: ~/.var/app/com.valvesoftware.Steam/.steam/
  // For native: ~/.steam/ (already correct, nothing to do)
  // Walk up from the Steam installation to find a sibling .steam directory.
  let controlDir: string | undefined;
  let searchDir = path.dirname(steamPath);
  for (let i = 0; i < 5; i++) {
    const candidate = path.join(searchDir, ".steam");
    if (existsSync(path.join(candidate, "steam.pipe"))) {
      controlDir = candidate;
      break;
    }
    const parent = path.dirname(searchDir);
    if (parent === searchDir) break;
    searchDir = parent;
  }

  if (!controlDir) {
    return;
  }

  // If the control dir resolves to ~/.steam itself, nothing to do
  try {
    if (fs.realpathSync(controlDir) === fs.realpathSync(dotSteam)) {
      return;
    }
  } catch {
    // dotSteam might not exist yet
  }

  const pipePath = path.join(controlDir, "steam.pipe");
  if (!existsSync(pipePath)) {
    return;
  }

  log("info", "Setting up ~/.steam symlinks for non-native Steam", {
    steamPath,
    controlDir,
  });

  ensureDir(dotSteam);

  const symlinks: Array<[string, string]> = [
    [path.join(dotSteam, "steam.pipe"), pipePath],
    [path.join(dotSteam, "steam.pid"), path.join(controlDir, "steam.pid")],
    [path.join(dotSteam, "steam"), steamPath],
    [path.join(dotSteam, "root"), steamPath],
  ];

  for (const [linkPath, target] of symlinks) {
    ensureSymlink(linkPath, target);
  }

  // SDK libraries needed by Steamworks
  const sdk64Dir = path.join(dotSteam, "sdk64");
  const sdk32Dir = path.join(dotSteam, "sdk32");
  ensureDir(sdk64Dir);
  ensureDir(sdk32Dir);
  ensureSymlink(
    path.join(sdk64Dir, "steamclient.so"),
    path.join(steamPath, "linux64", "steamclient.so"),
  );
  ensureSymlink(
    path.join(sdk32Dir, "steamclient.so"),
    path.join(steamPath, "linux32", "steamclient.so"),
  );
}

function existsSync(p: string): boolean {
  try {
    fs.lstatSync(p);
    return true;
  } catch {
    return false;
  }
}

function ensureDir(dirPath: string): void {
  try {
    fs.mkdirSync(dirPath, { recursive: true });
  } catch {
    // already exists
  }
}

function ensureSymlink(linkPath: string, target: string): void {
  try {
    if (!existsSync(target)) return;
    const existing = fs.readlinkSync(linkPath);
    if (existing === target) return;
    fs.unlinkSync(linkPath);
  } catch {
    // doesn't exist yet, that's fine
  }
  try {
    fs.symlinkSync(target, linkPath);
  } catch (err: any) {
    log("debug", "Could not create Steam symlink", {
      linkPath,
      target,
      error: err?.message,
    });
  }
}
