import * as path from "path";

import type { IExtensionApi } from "../../../types/IExtensionContext";
import type { IState } from "../../../types/IState";
import * as fs from "../../../util/fs";
import { log } from "../../../util/log";
import { activeGameId } from "../../../util/selectors";
import { getSafe } from "../../../util/storeHelper";
import { downloadPathForGame } from "../../download_management/selectors";
import { getGame } from "../../gamemode_management/util/getGame";
import { installPathForGame } from "../selectors";
import type { IDeployedFile } from "../types/IDeploymentMethod";
import { getManifest } from "./activationStore";

export type ValidationSeverity = "info" | "warning" | "error";

export type DiscrepancyKind =
  | "missing_in_staging"
  | "extra_in_staging"
  | "content_mismatch"
  | "missing_in_deployment"
  | "link_broken"
  | "source_missing";

export interface IValidationDiscrepancy {
  kind: DiscrepancyKind;
  filePath: string;
  severity: ValidationSeverity;
  detail?: string;
}

export interface IValidationResult {
  valid: boolean;
  timestamp: number;
  modId: string;
  discrepancies: IValidationDiscrepancy[];
  summary: Partial<Record<DiscrepancyKind, number>>;
}

export interface IValidationOptions {
  verifyContent?: boolean;
  /** Compare archive↔staging paths case-insensitively. Defaults to true on
   *  Linux because Vortex's extraction pipeline normalizes case via
   *  mergeCaseConflictingDirs — the on-disk casing may differ from archive
   *  entries. On Windows, NTFS is already case-insensitive. */
  caseInsensitive?: boolean;
  onProgress?: (current: number, total: number, phase: string) => void;
  signal?: AbortSignal;
}

function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, "/").replace(/^\/+/, "");
}

function normalizeForComparison(filePath: string, caseInsensitive: boolean): string {
  const normalized = normalizePath(filePath);
  return caseInsensitive ? normalized.toLowerCase() : normalized;
}

async function walkDirectory(dirPath: string): Promise<string[]> {
  const results: string[] = [];

  async function recurse(current: string, rel: string): Promise<void> {
    let entries: string[];
    try {
      entries = await fs.readdirAsync(current);
    } catch {
      return;
    }
    for (const entry of entries) {
      const fullPath = path.join(current, entry);
      const relPath = rel ? `${rel}/${entry}` : entry;
      const stat = await fs.lstatAsync(fullPath).catch(() => null);
      if (stat === null) continue;
      if (stat.isFile()) {
        results.push(relPath);
      } else if (stat.isDirectory()) {
        await recurse(fullPath, relPath);
      }
    }
  }

  await recurse(dirPath, "");
  return results;
}

export async function verifyHardlink(linkPath: string, sourcePath: string): Promise<boolean> {
  try {
    const [linkStats, sourceStats] = await Promise.all([
      fs.lstatAsync(linkPath),
      fs.lstatAsync(sourcePath),
    ]);
    return linkStats.nlink > 1 && linkStats.ino === sourceStats.ino;
  } catch {
    return false;
  }
}

function checkAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw new Error("Validation cancelled");
  }
}

function buildSummary(
  discrepancies: IValidationDiscrepancy[],
): Partial<Record<DiscrepancyKind, number>> {
  const summary: Partial<Record<DiscrepancyKind, number>> = {};
  for (const d of discrepancies) {
    summary[d.kind] = (summary[d.kind] ?? 0) + 1;
  }
  return summary;
}

export async function validateArchiveToStaging(
  api: IExtensionApi,
  gameId: string,
  modId: string,
  options?: IValidationOptions,
): Promise<IValidationResult> {
  const state: IState = api.store.getState();
  const mod = getSafe(state, ["persistent", "mods", gameId, modId], undefined);

  if (mod === undefined) {
    return {
      valid: false,
      timestamp: Date.now(),
      modId,
      discrepancies: [
        {
          kind: "missing_in_staging",
          filePath: "",
          severity: "error",
          detail: "Mod not found in state",
        },
      ],
      summary: { missing_in_staging: 1 },
    };
  }

  const archiveId = mod.archiveId;
  const stagingRoot = installPathForGame(state, gameId);
  const stagingDir = path.join(stagingRoot, mod.installationPath);

  // Get archive file listing
  let archiveFiles: string[] = [];
  if (archiveId) {
    const download = getSafe(state, ["persistent", "downloads", "files", archiveId], undefined);
    if (download?.localPath) {
      const dlPath = downloadPathForGame(state, gameId);
      const archivePath = path.join(dlPath, download.localPath);
      try {
        const archive = await api.openArchive(archivePath);
        if (archive.readDir) {
          const rawList = await archive.readDir("");
          archiveFiles = rawList
            .filter((f) => !f.endsWith("/") && !f.endsWith("\\"))
            .map(normalizePath);
        }
      } catch (err: unknown) {
        log("warn", "Failed to read archive for validation", {
          archivePath,
          error: err instanceof Error ? err.message : "unknown error",
        });
      }
    }
  }

  checkAborted(options?.signal);

  // Get staging file listing
  let stagingFiles: string[];
  try {
    stagingFiles = (await walkDirectory(stagingDir)).map(normalizePath);
  } catch {
    return {
      valid: false,
      timestamp: Date.now(),
      modId,
      discrepancies: [
        {
          kind: "missing_in_staging",
          filePath: stagingDir,
          severity: "error",
          detail: "Staging directory unreadable or missing",
        },
      ],
      summary: { missing_in_staging: 1 },
    };
  }

  checkAborted(options?.signal);

  const hasInstallerChoices = mod.attributes?.installerChoices != null;
  const caseInsensitive = options?.caseInsensitive ?? true;

  // Build normalized sets for comparison
  const archiveSet = new Set(archiveFiles.map((f) => normalizeForComparison(f, caseInsensitive)));
  const stagingSet = new Set(stagingFiles.map((f) => normalizeForComparison(f, caseInsensitive)));

  const discrepancies: IValidationDiscrepancy[] = [];
  const total = archiveFiles.length + stagingFiles.length;
  let current = 0;

  // Files in archive but not in staging
  for (const archiveFile of archiveFiles) {
    checkAborted(options?.signal);
    current++;
    options?.onProgress?.(current, total, "archive→staging");

    const key = normalizeForComparison(archiveFile, caseInsensitive);
    if (!stagingSet.has(key)) {
      discrepancies.push({
        kind: "missing_in_staging",
        filePath: archiveFile,
        severity: hasInstallerChoices ? "warning" : "error",
        detail: hasInstallerChoices
          ? "File excluded (installer choices present)"
          : "File in archive but missing from staging",
      });
    }
  }

  // Files in staging but not in archive
  for (const stagingFile of stagingFiles) {
    checkAborted(options?.signal);
    current++;
    options?.onProgress?.(current, total, "archive→staging");

    const key = normalizeForComparison(stagingFile, caseInsensitive);
    if (!archiveSet.has(key)) {
      discrepancies.push({
        kind: "extra_in_staging",
        filePath: stagingFile,
        severity: "info",
        detail: "File in staging but not in archive (generated or patched)",
      });
    }
  }

  const summary = buildSummary(discrepancies);
  const hasErrors = discrepancies.some((d) => d.severity === "error");

  return {
    valid: !hasErrors,
    timestamp: Date.now(),
    modId,
    discrepancies,
    summary,
  };
}

export async function validateStagingToDeployed(
  api: IExtensionApi,
  gameId: string,
  modId: string,
  options?: IValidationOptions,
): Promise<IValidationResult> {
  const state: IState = api.store.getState();
  const mod = getSafe(state, ["persistent", "mods", gameId, modId], undefined);

  if (mod === undefined) {
    return {
      valid: false,
      timestamp: Date.now(),
      modId,
      discrepancies: [
        {
          kind: "source_missing",
          filePath: "",
          severity: "error",
          detail: "Mod not found in state",
        },
      ],
      summary: { source_missing: 1 },
    };
  }

  const stagingRoot = installPathForGame(state, gameId);
  const game = getGame(gameId);
  const discovery = getSafe(state, ["settings", "gameMode", "discovered", gameId], undefined);

  if (!game || !discovery?.path) {
    return {
      valid: false,
      timestamp: Date.now(),
      modId,
      discrepancies: [],
      summary: {},
    };
  }

  const modPaths = game.getModPaths?.(discovery.path) ?? { "": discovery.path };
  const modType = mod.type ?? "";
  const deployPath = modPaths[modType];

  if (!deployPath) {
    return {
      valid: true,
      timestamp: Date.now(),
      modId,
      discrepancies: [],
      summary: {},
    };
  }

  // Load manifest for this mod type
  let manifest: { files: IDeployedFile[] };
  try {
    manifest = await getManifest(api, modType, gameId);
  } catch {
    return {
      valid: false,
      timestamp: Date.now(),
      modId,
      discrepancies: [
        {
          kind: "missing_in_deployment",
          filePath: "",
          severity: "error",
          detail: "Could not load deployment manifest",
        },
      ],
      summary: { missing_in_deployment: 1 },
    };
  }

  checkAborted(options?.signal);

  // Filter manifest entries for this mod
  const modFiles = manifest.files.filter((f) => f.source === mod.installationPath);

  const discrepancies: IValidationDiscrepancy[] = [];
  const total = modFiles.length;

  for (let i = 0; i < modFiles.length; i++) {
    checkAborted(options?.signal);
    options?.onProgress?.(i + 1, total, "staging→deployed");

    const file = modFiles[i];
    const relPath = normalizePath(file.relPath);
    const deployedPath = path.join(deployPath, relPath);
    const sourcePath = path.join(stagingRoot, file.source, relPath);

    // Check source exists in staging
    const sourceExists = await fs
      .lstatAsync(sourcePath)
      .then(() => true)
      .catch(() => false);

    if (!sourceExists) {
      discrepancies.push({
        kind: "source_missing",
        filePath: relPath,
        severity: "error",
        detail: "Source file missing from staging directory",
      });
      continue;
    }

    // Check deployed file exists
    const deployedExists = await fs
      .lstatAsync(deployedPath)
      .then(() => true)
      .catch(() => false);

    if (!deployedExists) {
      discrepancies.push({
        kind: "missing_in_deployment",
        filePath: relPath,
        severity: "error",
        detail: "File should be deployed but is missing from game directory",
      });
      continue;
    }

    // Verify hardlink integrity
    const linkValid = await verifyHardlink(deployedPath, sourcePath);
    if (!linkValid) {
      discrepancies.push({
        kind: "link_broken",
        filePath: relPath,
        severity: "warning",
        detail: "Deployed file is not linked to staging (may have been modified externally)",
      });
    }
  }

  const summary = buildSummary(discrepancies);
  const hasErrors = discrepancies.some((d) => d.severity === "error");

  return {
    valid: !hasErrors,
    timestamp: Date.now(),
    modId,
    discrepancies,
    summary,
  };
}

export async function validateModInstallation(
  api: IExtensionApi,
  gameId: string,
  modId: string,
  options?: IValidationOptions,
): Promise<IValidationResult> {
  const archiveResult = await validateArchiveToStaging(api, gameId, modId, options);

  checkAborted(options?.signal);

  const deployResult = await validateStagingToDeployed(api, gameId, modId, options);

  const discrepancies = [...archiveResult.discrepancies, ...deployResult.discrepancies];

  return {
    valid: archiveResult.valid && deployResult.valid,
    timestamp: Date.now(),
    modId,
    discrepancies,
    summary: buildSummary(discrepancies),
  };
}
