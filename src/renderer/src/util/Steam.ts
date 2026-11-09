import * as path from "node:path";

import { parse as parseKV, type KVBlock } from "@nexusmods/steam-kv-parser";
import { parseError } from "@vortex/shared";
import { QualifiedPath } from "@vortex/shared/filesystem";
import { parse, type VDFObject, type VDFValue } from "simple-vdf";
import * as winapi from "winapi-bindings";
import { z } from "zod";

import { log } from "@/logging";

import type { IExecInfo } from "../types/IExecInfo";
import type { IExtensionApi } from "../types/IExtensionContext";
import type { ICustomExecutionInfo, IGameStore, IGameStoreSnapshot } from "../types/IGameStore";
import { GameEntryNotFound } from "../types/IGameStore";
import type { IGameStoreEntry } from "../types/IGameStoreEntry";
import { getProtonInfo, buildProtonEnvironment, buildProtonCommand } from "./linux/proton";
<<<<<<< HEAD
import { findAllLinuxSteamPaths, findLinuxSteamPath } from "./linux/steamPaths";
import { log } from "./log";
import opn from "./opn";
=======
import { findLinuxSteamPath } from "./linux/steamPaths";
>>>>>>> v2.10.1

/** VDF leaves are plain strings, so only nested blocks can be indexed further. */
const asBlock = (value: VDFValue | undefined): VDFObject | undefined =>
  typeof value === "object" ? value : undefined;

const manifestLeaf = (block: KVBlock, key: string): string | undefined => {
  const leaf = block.children.find((child) => child.type === "leaf" && child.key === key);
  return leaf?.type === "leaf" ? leaf.value : undefined;
};

const manifestBlock = (block: KVBlock, key: string): KVBlock | undefined => {
  const child = block.children.find((child) => child.type === "block" && child.key === key);
  return child?.type === "block" ? child : undefined;
};

const MANIFEST_INSTALL_SCHEMA = z.object({
  appId: z.coerce.number(),
  buildId: z.coerce.number(),
  stateFlags: z.coerce.number(),
  targetBuildId: z.coerce.number().catch(0),
  // current clients write "public" for the default branch, older ones leave it empty or omit it
  branch: z
    .union([z.string(), z.null()])
    .transform((value) =>
      value === null || value === "" || value.toLowerCase() === "public" ? null : value,
    ),
  language: z.string(),
  mountedLanguage: z.string(),
  depots: z.array(
    z.object({
      depotId: z.coerce.number(),
      manifestId: z.string(),
      dlcAppId: z.string().nullable(),
    }),
  ),
  sharedDepots: z.array(
    z.object({
      depotId: z.coerce.number(),
      ownerAppId: z.coerce.number(),
    }),
  ),
});

/** The install-relevant appmanifest fields, undefined when the manifest lacks
    the fields that identify an install. The steam-kv-parser tree keeps every
    child in file order, so the depots it walks keep their mount order - which
    simple-vdf (still parsing libraryfolders.vdf) would lose on depot keys. */
function collectInstallData(appState: KVBlock): ISteamInstallData | undefined {
  const userConfig = manifestBlock(appState, "UserConfig");
  const mountedConfig = manifestBlock(appState, "MountedConfig");

  const depots: Array<{ depotId: string; manifestId: string; dlcAppId: string | null }> = [];
  const depotsBlock = manifestBlock(appState, "InstalledDepots");
  if (depotsBlock !== undefined) {
    for (const depot of depotsBlock.children) {
      if (depot.type === "block") {
        const manifestId = manifestLeaf(depot, "manifest");
        // a manifest id is the depot's identity; pair/dashboard depots lack one
        if (manifestId === undefined || manifestId === "") continue;
        depots.push({
          depotId: depot.key,
          manifestId,
          dlcAppId: manifestLeaf(depot, "dlcappid") ?? null,
        });
      } else if (depot.type === "leaf" && depot.value !== "") {
        // older manifests map the depot key straight onto its manifest id
        depots.push({ depotId: depot.key, manifestId: depot.value, dlcAppId: null });
      }
    }
  }

  const sharedDepots: Array<{ depotId: string; ownerAppId: string }> = [];
  const sharedBlock = manifestBlock(appState, "SharedDepots");
  if (sharedBlock !== undefined) {
    for (const depot of sharedBlock.children) {
      if (depot.type === "leaf") {
        sharedDepots.push({ depotId: depot.key, ownerAppId: depot.value });
      }
    }
  }

  const installFields = {
    appId: manifestLeaf(appState, "appid"),
    buildId: manifestLeaf(appState, "buildid"),
    stateFlags: manifestLeaf(appState, "StateFlags"),
    targetBuildId: manifestLeaf(appState, "TargetBuildID") ?? "0",
    branch: (userConfig === undefined ? undefined : manifestLeaf(userConfig, "BetaKey")) ?? null,
    language: (userConfig === undefined ? undefined : manifestLeaf(userConfig, "language")) ?? "",
    mountedLanguage:
      (mountedConfig === undefined ? undefined : manifestLeaf(mountedConfig, "language")) ?? "",
    depots,
    sharedDepots,
  };

  const installData = MANIFEST_INSTALL_SCHEMA.safeParse(installFields);
  if (!installData.success) {
    return undefined;
  }
  // the schema output type leaves optional/nullish fields loose; complete to the entry type
  return {
    appId: installData.data.appId,
    buildId: installData.data.buildId,
    stateFlags: installData.data.stateFlags,
    targetBuildId: installData.data.targetBuildId ?? 0,
    branch: installData.data.branch ?? null,
    language: installData.data.language,
    mountedLanguage: installData.data.mountedLanguage,
    depots: installData.data.depots.map((depot) => ({
      depotId: depot.depotId,
      manifestId: depot.manifestId,
      dlcAppId: depot.dlcAppId ?? null,
    })),
    sharedDepots: installData.data.sharedDepots,
  };
}

const STORE_ID = "steam";
const STORE_NAME = "Steam";
const STEAM_EXEC = process.platform === "win32" ? "Steam.exe" : "steam.sh";
const STORE_PRIORITY = 40;

export interface ISteamManifestDepot {
  depotId: number;
  manifestId: string;
  dlcAppId: string | null;
}

export interface ISteamManifestSharedDepot {
  depotId: number;
  ownerAppId: number;
}

/** Install-relevant appmanifest fields, extracted from a steam-kv-parser tree and
    zod-validated. Depot arrays keep file order, mount order to the store. */
export interface ISteamInstallData {
  appId: number;
  buildId: number;
  stateFlags: number;
  targetBuildId: number;
  branch: string | null;
  language: string;
  mountedLanguage: string;
  depots: ISteamManifestDepot[];
  sharedDepots: ISteamManifestSharedDepot[];
}

export interface ISteamEntry extends IGameStoreEntry {
  /** Install-relevant appmanifest fields; undefined when those fields are missing. */
  installData?: ISteamInstallData;
  usesProton?: boolean;
  compatDataPath?: string;
  protonPath?: string;
}

/**
 * base class to interact with local steam installation
 * @class Steam
 */
class Steam implements IGameStore {
  public id: string = STORE_ID;
  public name: string = STORE_NAME;
  public priority: number = STORE_PRIORITY;

  #baseFolder: string | undefined;
  #snapshot: IGameStoreSnapshot;

  constructor() {
    if (process.platform === "win32") {
      // windows
      try {
        const steamPath = winapi.RegGetValue(
          "HKEY_CURRENT_USER",
          "Software\\Valve\\Steam",
          "SteamPath",
        );
        this.#baseFolder = steamPath.value as string;
        this.#snapshot = { entries: [], isInstalled: true };
      } catch (err) {
        log("info", "steam not found", err);
        this.#baseFolder = undefined;
        this.#snapshot = { entries: [], isInstalled: false };
      }
    } else {
      const linuxPath = findLinuxSteamPath();
      this.#baseFolder = linuxPath;
      this.#snapshot = { entries: [], isInstalled: linuxPath !== undefined };
    }
  }

  /**
   * find the first game that matches the specified name pattern
   */
  public async findByName(namePattern: string): Promise<ISteamEntry> {
    const re = new RegExp("^" + namePattern + "$");
    const entries = await this.allGames();
    const entry = entries.find((entry) => re.test(entry.name));
    if (entry === undefined) throw new GameEntryNotFound(namePattern, STORE_ID);

    return entry;
  }

  public async launchGame(appInfo: any, api?: IExtensionApi): Promise<void> {
    // We expect appInfo to be one of three things at this point:
    //  - The game extension's details object if provided, in which case
    //      we want to extract the steamAppId entry. (preferred case as this
    //      is used by the gameinfo-steam extension as well).
    //  - The steam Id in string form.
    //  - The directory path which contains the game's executable.
    if (this.isCustomExecObject(appInfo) && appInfo.launchType === "gamestore") {
      const posix = await this.getPosixPath(appInfo);
      window.api.shell.openUrl(posix);
      return;
    }

    const info = appInfo.steamAppId ? appInfo.steamAppId.toString() : appInfo;
    const execInfo = await this.getExecInfo(info);

    // TODO: Bluebird to native
    await Promise.resolve(
      api?.runExecutable(execInfo.execPath, execInfo.arguments, {
        cwd: path.dirname(execInfo.execPath),
        suggestDeploy: true,
        shell: true,
      }),
    );
  }

  public getPosixPath(appInfo: any): Promise<string> {
    const posixCommand = `steam://launch/${appInfo.appId}/${appInfo.parameters.join()}`;
    return Promise.resolve(posixCommand);
  }

  public async getExecInfo(appInfo: any): Promise<IExecInfo> {
    // Steam uses numeric values to id games internally; if the provided appId
    //  contains path separators, it's a clear indication that the game
    //  extension did not provide a steam id and the starter info object
    //  provided the game executables dirname instead.
    let appId;
    let parameters: string[] = [];
    if (this.isCustomExecObject(appInfo)) {
      appId = appInfo.appId;
      parameters = appInfo.parameters ?? [];
    } else {
      appId = appInfo.toString();
    }

    const isDirPath = appId.indexOf(path.sep) !== -1;
    const entries = await this.allGames();
    const found = entries.find((entry) =>
      !isDirPath
        ? entry.appid === appId
        : // Checking by gamepath is inefficient but I can't think of a different
          //  way to ascertain whether the launcher has this game entry with the
          //  provided information...
          appId.toLowerCase().indexOf(entry.gamePath.toLowerCase()) !== -1,
    );

    if (found === undefined) throw new GameEntryNotFound(appId, STORE_ID);

    return {
      execPath: path.join(this.#baseFolder, STEAM_EXEC),
      arguments: ["-applaunch", appId, ...parameters],
    };
  }

  /**
   * find the first game with the specified appid or one of the specified appids
   */
  public async findByAppId(appId: string | string[]): Promise<ISteamEntry> {
    // support searching for one app id or one out of a list (when there are multiple
    // variants of a game)
    const matcher = Array.isArray(appId)
      ? (entry) => appId.indexOf(entry.appid) !== -1
      : (entry) => entry.appid === appId;

    const entries = await this.allGames();
    const entry = entries.find(matcher);
    if (entry === undefined) {
      throw new GameEntryNotFound(Array.isArray(appId) ? appId.join(", ") : appId, STORE_ID);
    }

    return entry;
  }

  public allGames(): Promise<ISteamEntry[]> {
    return Promise.resolve(this.#snapshot.entries as ISteamEntry[]);
  }

  public snapshot(): IGameStoreSnapshot {
    return this.#snapshot;
  }

  public getGameStorePath(): Promise<string | undefined> {
    if (this.#baseFolder === undefined) return Promise.resolve(undefined);
    return Promise.resolve(path.join(this.#baseFolder, STEAM_EXEC));
  }

  public async reloadGames(): Promise<void> {
    const entries = await this.parseManifests();
    this.#snapshot = { entries, isInstalled: this.#snapshot.isInstalled };
  }

  public async identifyGame(
    gamePath: string,
    fallback: (gamePath: string) => PromiseLike<boolean>,
  ): Promise<boolean> {
    const custom = gamePath.toLowerCase().split(path.sep).includes("steamapps");

    const fbResult = await fallback(gamePath);
    if (fbResult !== custom) {
      log("warn", "(steam) game identification inconclusive", {
        gamePath,
        custom,
        fallback,
      });
    }

    return custom || fbResult;
  }

  private isCustomExecObject(object: any): object is ICustomExecutionInfo {
    if (typeof object !== "object") return false;
    return "appId" in object;
  }

  private async resolveSteamPaths(): Promise<string[]> {
    log("debug", "resolving Steam game paths");
    const basePath = this.#baseFolder;
    if (basePath === undefined) {
      // Steam not found/installed
      return [];
    }

    const steamPaths: string[] = [basePath];
    let parsedObj: VDFObject;

    try {
      const blob = await window.api.fs.readFile(
        QualifiedPath.fromNative(basePath).join("config", "libraryfolders.vdf"),
      );
      const data = new TextDecoder().decode(blob);

      try {
        parsedObj = parse(data);
      } catch (err) {
        log("warn", "unable to parse steamfolders.vdf", err);
        return steamPaths;
      }
    } catch (err) {
      // A Steam update has changed the way we resolve the steam library paths
      //  (we used to get these from config.vdf) the libraryfolders.vdf file
      //  appears to at times hold a reference to _all_ library folders; other times
      //  it only holds the path to the alternate steam libraries (the ones that aren't
      //  part of the base Steam installation folder)
      log("warn", "failed to read steam library folders file", err);

<<<<<<< HEAD
      // Fork: on Linux read libraryfolders.vdf from every Steam root, not just basePath.
      // Reading only basePath misses secondary libraries when the detected basePath isn't
      // the real installation (e.g. ~/.local/share/Steam found before
      // ~/.steam/debian-installation). See VORTEX-LINUX-MERGE-PLAYBOOK.md §9.
      const steamRoots: string[] =
        process.platform === "linux" ? findAllLinuxSteamPaths() : [basePath];

      if (steamRoots.length === 0) {
        return PromiseBB.resolve([]);
      }

      const steamPaths: string[] = [...steamRoots];

      const readVdf = (root: string): PromiseBB<void> =>
        PromiseBB.resolve(fsOG.readFile(path.resolve(root, "config", "libraryfolders.vdf")))
          .then((data: Buffer) => {
            let parsedObj: VDFObject;
            try {
              parsedObj = parse(data.toString());
            } catch (err) {
              log("warn", "unable to parse steamfolders.vdf", { root, err });
              return;
            }

            // older Steam versions spelled this key in mixed case
            const libKey = Object.keys(parsedObj).find(
              (key) => key.toLowerCase() === "libraryfolders",
            );
            const libObj = asBlock(libKey !== undefined ? parsedObj[libKey] : undefined) ?? {};

            // libraries are numbered contiguously, from 0 or 1 depending on the Steam version
            let counter = libObj["0"] !== undefined ? 0 : 1;
            let lib = asBlock(libObj[`${counter}`]);
            while (lib !== undefined) {
              const libPath = lib["path"];
              if (typeof libPath === "string" && libPath && !steamPaths.includes(libPath)) {
                steamPaths.push(libPath);
              }
              ++counter;
              lib = asBlock(libObj[`${counter}`]);
            }
          })
          .catch((err) => {
            // A Steam update has changed the way we resolve the steam library paths
            //  (we used to get these from config.vdf) the libraryfolders.vdf file
            //  appears to at times hold a reference to _all_ library folders; other times
            //  it only holds the path to the alternate steam libraries (the ones that aren't
            //  part of the base Steam installation folder)
            log("warn", "failed to read steam library folders file", { root, err });
            const code = getErrorCode(err);
            // one unreadable root on Linux must not hide the libraries of the others
            return (code !== null && ["EPERM", "ENOENT"].includes(code)) ||
              process.platform === "linux"
              ? PromiseBB.resolve()
              : PromiseBB.reject(err);
          });

      return PromiseBB.mapSeries(steamRoots, readVdf).then(() => {
        log("debug", "found steam install folders", { steamPaths });
        return PromiseBB.resolve(steamPaths);
      });
    });
  }

  private parseManifests(): PromiseBB<ISteamEntry[]> {
    return this.resolveSteamPaths().then((steamPaths: string[]) =>
      PromiseBB.mapSeries(steamPaths, (steamPath) => {
        log("debug", "reading steam install folder", { steamPath });
        const steamAppsPath = path.join(steamPath, "steamapps");
        return PromiseBB.resolve(fsOG.readdir(steamAppsPath))
          .then((names) => {
            const filtered = names.filter(
              (name) => name.startsWith("appmanifest_") && path.extname(name) === ".acf",
            );
            log("debug", "got steam manifests", { manifests: filtered });
            return PromiseBB.map(filtered, (name: string) =>
              fs.readFileAsync(path.join(steamAppsPath, name)).then((manifestData) => ({
                manifestData,
                name,
              })),
            );
          })
          .then((appsData) => {
            return appsData
              .map((appData) => {
                const { name, manifestData } = appData;
                try {
                  return { obj: parse(manifestData.toString()), name };
                } catch (err) {
                  log("warn", "failed to parse steam manifest", {
                    name,
                    error: getErrorMessageOrDefault(err),
                  });
                  return undefined;
                }
              })
              .map((res) => {
                if (res === undefined) {
                  return undefined;
                }
                const { obj, name } = res;
                if (
                  obj === undefined ||
                  obj["AppState"] === undefined ||
                  obj["AppState"]["installdir"] === undefined
                ) {
                  log("debug", "invalid appmanifest", name);
                  return undefined;
                }
                try {
                  const result: ISteamEntry = {
                    appid: obj["AppState"]["appid"],
                    gameStoreId: STORE_ID,
                    name: obj["AppState"]["name"],
                    gamePath: path.join(steamAppsPath, "common", obj["AppState"]["installdir"]),
                    lastUser: obj["AppState"]["LastOwner"],
                    lastUpdated: new Date(obj["AppState"]["LastUpdated"] * 1000),
                    manifestData: obj,
                  };
                  return result;
                } catch (err) {
                  log("warn", "failed to parse steam manifest", {
                    name,
                    error: getErrorMessageOrDefault(err),
                  });
                  return undefined;
                }
              })
              .filter((obj): obj is ISteamEntry => !!obj);
          })
          .then((entries: ISteamEntry[]) => {
            // Add Proton info on Linux
            if (process.platform === "win32") {
              return entries;
            }
            return this.mBaseFolder.then((basePath) =>
              PromiseBB.map(entries, async (entry) => {
                try {
                  const protonInfo = await getProtonInfo(
                    basePath,
                    steamAppsPath,
                    entry.appid,
                    entry.manifestData?.["AppState"]?.["oslist"],
                  );
                  entry.usesProton = protonInfo.usesProton;
                  entry.compatDataPath = protonInfo.compatDataPath;
                  entry.protonPath = protonInfo.protonPath;
                } catch (err) {
                  log("debug", "Could not get Proton info for game", {
                    appid: entry.appid,
                    error: getErrorMessageOrDefault(err),
                  });
                }
                return entry;
              }),
            );
          })
          .catch({ code: "ENOENT" }, (err: any) => {
            // no biggy, this can happen for example if the steam library is on a removable medium
            // which is currently removed
            log("info", "Steam library not found", {
              error: getErrorMessageOrDefault(err),
            });
            return [];
          })
          .catch((err) => {
            log("warn", "Failed to read steam library", {
              path: steamPath,
              error: getErrorMessageOrDefault(err),
            });
            return [];
          });
      })
        .then((games) =>
          games.reduce((prev, current) => (current ? prev.concat(current) : prev), []),
        )
        .then((games: ISteamEntry[]) => {
          // Fork: several Linux Steam roots can point at the same library (symlinked
          // ~/.steam/steam and ~/.local/share/Steam), so drop repeated app ids there.
          if (process.platform !== "linux") {
            return games;
          }
          const seen = new Set<string>();
          return games.filter((entry) => {
            if (seen.has(entry.appid)) return false;
            seen.add(entry.appid);
            return true;
          });
        })
        .tap(() => {
          log("info", "done reading steam libraries");
        }),
    );
=======
      const vortexError = parseError(err);
      if (vortexError.data.kind === "fs:not-found" || vortexError.data.kind === "fs:no-permissions")
        return steamPaths;
      throw err;
    }

    // older Steam versions spelled this key in mixed case
    const libKey = Object.keys(parsedObj).find((key) => key.toLowerCase() === "libraryfolders");
    const libObj = asBlock(libKey !== undefined ? parsedObj[libKey] : undefined) ?? {};

    // libraries are numbered contiguously, from 0 or 1 depending on the Steam version
    let counter = libObj["0"] !== undefined ? 0 : 1;
    let lib = asBlock(libObj[`${counter}`]);
    while (lib !== undefined) {
      const libPath = lib["path"];
      if (typeof libPath === "string" && libPath && !steamPaths.includes(libPath)) {
        steamPaths.push(libPath);
      }
      ++counter;
      lib = asBlock(libObj[`${counter}`]);
    }

    log("debug", "found steam install folders", { steamPaths });
    return steamPaths;
  }

  private async parseManifests(): Promise<ISteamEntry[]> {
    // A missing base folder means resolveSteamPaths yields nothing anyway,
    //  but reading the field up front lets us hand a non-undefined path down.
    const baseFolder = this.#baseFolder;
    if (baseFolder === undefined) {
      return [];
    }

    const steamPaths = await this.resolveSteamPaths();

    const games: ISteamEntry[] = [];
    for (const steamPath of steamPaths) {
      log("debug", "reading steam install folder", { steamPath });
      games.push(...(await this.parseLibrary(steamPath, baseFolder)));
    }

    log("info", "done reading steam libraries");
    return games;
  }

  /**
   * Parse one Steam library's appmanifest files.
   *
   * Errors are isolated per library: a disconnected or unreadable library is
   * logged and skipped, the remaining libraries keep scanning. (The
   * "not found" case is expected - Steam libraries can live on removable
   * media that is currently removed.)
   */
  private async parseLibrary(steamPath: string, baseFolder: string): Promise<ISteamEntry[]> {
    const steamAppsPath = path.join(steamPath, "steamapps");

    try {
      const entries: ISteamEntry[] = [];
      const iterator = await window.api.fs.enumerateDirectory(
        QualifiedPath.fromNative(steamAppsPath),
      );

      for await (const entry of iterator) {
        if (!entry.basename.startsWith("appmanifest_") || entry.extension !== "acf") continue;

        const game = await this.parseManifest(entry, steamAppsPath, baseFolder);
        if (game !== undefined) {
          entries.push(game);
        }
      }

      return entries;
    } catch (err) {
      if (parseError(err).data.kind === "fs:not-found") {
        log("info", "Steam library not found", { err });
      } else {
        log("warn", "Failed to read steam library", { path: steamPath, err });
      }
      return [];
    }
  }

  /**
   * Turn a single appmanifest_*.acf file into a game entry, enriching it with
   * Proton info on Linux. Returns undefined when the manifest is malformed;
   * a manifest that cannot be read propagates, which skips the rest of the
   * containing library.
   */
  private async parseManifest(
    entry: QualifiedPath,
    steamAppsPath: string,
    baseFolder: string,
  ): Promise<ISteamEntry | undefined> {
    const blob = await window.api.fs.readFile(entry);
    const manifestText = new TextDecoder().decode(blob);

    let appState: KVBlock;
    try {
      appState = parseKV(manifestText);
    } catch (err) {
      log("warn", "failed to parse steam manifest", { err, entry });
      return undefined;
    }

    const appId = manifestLeaf(appState, "appid");
    const name = manifestLeaf(appState, "name");
    const installDir = manifestLeaf(appState, "installdir");
    if (
      appState.key !== "AppState" ||
      appId === undefined ||
      appId === "" ||
      name === undefined ||
      installDir === undefined
    ) {
      log("debug", "invalid appmanifest", { entry });
      return undefined;
    }

    const installData = collectInstallData(appState);

    const result: ISteamEntry = {
      appid: appId,
      gameStoreId: STORE_ID,
      name,
      gamePath: path.join(steamAppsPath, "common", installDir),
      lastUser: manifestLeaf(appState, "LastOwner"),
      lastUpdated: new Date(Number(manifestLeaf(appState, "LastUpdated") ?? 0) * 1000),
      installData,
    };

    if (process.platform === "linux") {
      try {
        const protonInfo = await getProtonInfo(baseFolder, steamAppsPath, result.appid);
        result.usesProton = protonInfo.usesProton;
        result.compatDataPath = protonInfo.compatDataPath;
        result.protonPath = protonInfo.protonPath;
      } catch (err) {
        log("debug", "Could not get Proton info for game", {
          appid: result.appid,
          err,
          entry,
        });
      }
    }

    return result;
>>>>>>> v2.10.1
  }

  /**
   * Run a Windows tool through Proton using the game's prefix
   */
  public async runToolWithProton(
    api: IExtensionApi,
    exePath: string,
    args: string[],
    options: any,
    gameEntry: ISteamEntry,
  ): Promise<void> {
    if (!gameEntry.usesProton || !gameEntry.protonPath || !gameEntry.compatDataPath) {
      return api.runExecutable(exePath, args, options);
    }

    const steamPath = this.#baseFolder;
    const { executable, args: protonArgs } = buildProtonCommand(
      gameEntry.protonPath,
      exePath,
      args,
    );
    const protonEnv = buildProtonEnvironment(
      gameEntry.compatDataPath,
      steamPath,
      gameEntry.appid,
      options.env,
    );

    return api.runExecutable(executable, protonArgs, {
      ...options,
      env: protonEnv,
      shell: false,
    });
  }
}

const instance: Steam = new Steam();

export default instance;

export { Steam };
