<<<<<<< HEAD
import * as path from "path";

/* eslint-disable */
import getVersion from "exe-version";
import * as semver from "semver";
import { types } from "vortex-api";

=======
/* eslint-disable */
import getVersion from "exe-version";
import * as path from "path";
import * as semver from "semver";
import { types } from "vortex-api";

>>>>>>> v2.0.1
import { LSLIB_FILES, GAME_ID } from "./common";
import { logDebug } from "./util";

export async function testLSLib(
  files: string[],
  gameId: string,
): Promise<types.ISupportedResult> {
  if (gameId !== GAME_ID) {
    return Promise.resolve({ supported: false, requiredFiles: [] });
  }
<<<<<<< HEAD
  const matchedFiles = files.filter((file) => LSLIB_FILES.has(path.basename(file).toLowerCase()));
=======
  const matchedFiles = files.filter((file) =>
    LSLIB_FILES.has(path.basename(file).toLowerCase()),
  );
>>>>>>> v2.0.1

  return Promise.resolve({
    supported: matchedFiles.length >= 2,
    requiredFiles: [],
  });
}

export async function testModFixer(
  files: string[],
  gameId: string,
): Promise<types.ISupportedResult> {
  const notSupported = { supported: false, requiredFiles: [] };

  if (gameId !== GAME_ID) {
    // different game.
    return Promise.resolve(notSupported);
  }

  const lowered = files.map((file) => file.toLowerCase());
  //const binFolder = lowered.find(file => file.split(path.sep).indexOf('bin') !== -1);

  const hasModFixerPak =
<<<<<<< HEAD
    lowered.find((file) => path.basename(file) === "modfixer.pak") !== undefined;
=======
    lowered.find((file) => path.basename(file) === "modfixer.pak") !==
    undefined;
>>>>>>> v2.0.1

  if (!hasModFixerPak) {
    // there's no modfixer.pak folder.
    return Promise.resolve(notSupported);
  }

  return Promise.resolve({
    supported: true,
    requiredFiles: [],
  });
}

export async function testEngineInjector(
  files: string[],
  gameId: string,
): Promise<types.ISupportedResult> {
  const notSupported = { supported: false, requiredFiles: [] };

  if (gameId !== GAME_ID) {
    // different game.
    return Promise.resolve(notSupported);
  }

  const lowered = files.map((file) => file.toLowerCase());
  //const binFolder = lowered.find(file => file.split(path.sep).indexOf('bin') !== -1);

<<<<<<< HEAD
  const hasBinFolder = lowered.find((file) => file.indexOf("bin" + path.sep) !== -1) !== undefined;
=======
  const hasBinFolder =
    lowered.find((file) => file.indexOf("bin" + path.sep) !== -1) !== undefined;
>>>>>>> v2.0.1

  if (!hasBinFolder) {
    // there's no bin folder.
    return Promise.resolve(notSupported);
  }

  return Promise.resolve({
    supported: true,
    requiredFiles: [],
  });
}

<<<<<<< HEAD
export async function installBG3SE(files: string[]): Promise<types.IInstallResult> {
=======
export async function installBG3SE(
  files: string[],
): Promise<types.IInstallResult> {
>>>>>>> v2.0.1
  logDebug("installBG3SE files:", files);

  // Filter out folders as this breaks the installer.
  files = files.filter((f) => path.extname(f) !== "" && !f.endsWith(path.sep));

  // Filter only dll files.
  files = files.filter((f) => path.extname(f) === ".dll");

  const instructions: types.IInstruction[] = files.reduce(
    (accum: types.IInstruction[], filePath: string) => {
      accum.push({
        type: "copy",
        source: filePath,
        destination: path.basename(filePath),
      });
      return accum;
    },
    [],
  );

  logDebug("installBG3SE instructions:", instructions);

  return Promise.resolve({ instructions });
}

<<<<<<< HEAD
export async function installModFixer(files: string[]): Promise<types.IInstallResult> {
=======
export async function installModFixer(
  files: string[],
): Promise<types.IInstallResult> {
>>>>>>> v2.0.1
  logDebug("installModFixer files:", files);

  // Filter out folders as this breaks the installer.
  files = files.filter((f) => path.extname(f) !== "" && !f.endsWith(path.sep));

  // Filter only pak files.
  files = files.filter((f) => path.extname(f) === ".pak");

<<<<<<< HEAD
  const modFixerAttribute: types.IInstruction = { type: "attribute", key: "modFixer", value: true };
=======
  const modFixerAttribute: types.IInstruction = {
    type: "attribute",
    key: "modFixer",
    value: true,
  };
>>>>>>> v2.0.1

  const instructions: types.IInstruction[] = files.reduce(
    (accum: types.IInstruction[], filePath: string) => {
      accum.push({
        type: "copy",
        source: filePath,
        destination: path.basename(filePath),
      });
      return accum;
    },
    [modFixerAttribute],
  );

  logDebug("installModFixer instructions:", instructions);

  return Promise.resolve({ instructions });
}

<<<<<<< HEAD
export async function installEngineInjector(files: string[]): Promise<types.IInstallResult> {
=======
export async function installEngineInjector(
  files: string[],
): Promise<types.IInstallResult> {
>>>>>>> v2.0.1
  logDebug("installEngineInjector files:", files);

  // Filter out folders as this breaks the installer.
  files = files.filter((f) => path.extname(f) !== "" && !f.endsWith(path.sep));

<<<<<<< HEAD
  const modtypeAttr: types.IInstruction = { type: "setmodtype", value: "dinput" };
=======
  const modtypeAttr: types.IInstruction = {
    type: "setmodtype",
    value: "dinput",
  };
>>>>>>> v2.0.1

  const instructions: types.IInstruction[] = files.reduce(
    (accum: types.IInstruction[], filePath: string) => {
      // see if we have a bin folder
      // then we need to use that as a new root incase the /bin is nested

      const binIndex = filePath.toLowerCase().indexOf("bin" + path.sep);

      if (binIndex !== -1) {
        logDebug(filePath.substring(binIndex));

        accum.push({
          type: "copy",
          source: filePath,
          destination: filePath.substring(binIndex),
        });
      }
      return accum;
    },
    [modtypeAttr],
  );

  logDebug("installEngineInjector instructions:", instructions);

  return Promise.resolve({ instructions });
}

export async function installLSLib(
  files: string[],
  destinationPath: string,
): Promise<types.IInstallResult> {
<<<<<<< HEAD
  const exe = files.find((file) => path.basename(file.toLowerCase()) === "divine.exe");
=======
  const exe = files.find(
    (file) => path.basename(file.toLowerCase()) === "divine.exe",
  );
>>>>>>> v2.0.1
  const exePath = path.join(destinationPath, exe);
  let ver: string = await getVersion(exePath);
  ver = ver.split(".").slice(0, 3).join(".");

  // Unfortunately the LSLib developer is not consistent when changing
  //  file versions - the executable attribute might have an older version
  //  value than the one specified by the filename - we're going to use
  //  the filename as the point of truth *ugh*
<<<<<<< HEAD
  const fileName = path.basename(destinationPath, path.extname(destinationPath));
=======
  const fileName = path.basename(
    destinationPath,
    path.extname(destinationPath),
  );
>>>>>>> v2.0.1
  const idx = fileName.indexOf("-v");
  const fileNameVer = fileName.slice(idx + 2);
  if (semver.valid(fileNameVer) && ver !== fileNameVer) {
    ver = fileNameVer;
  }
<<<<<<< HEAD
  const versionAttr: types.IInstruction = { type: "attribute", key: "version", value: ver };
  const modtypeAttr: types.IInstruction = { type: "setmodtype", value: "bg3-lslib-divine-tool" };
=======
  const versionAttr: types.IInstruction = {
    type: "attribute",
    key: "version",
    value: ver,
  };
  const modtypeAttr: types.IInstruction = {
    type: "setmodtype",
    value: "bg3-lslib-divine-tool",
  };
>>>>>>> v2.0.1
  const instructions: types.IInstruction[] = files.reduce(
    (accum: types.IInstruction[], filePath: string) => {
      if (
        filePath.toLowerCase().split(path.sep).indexOf("tools") !== -1 &&
        !filePath.endsWith(path.sep)
      ) {
        accum.push({
          type: "copy",
          source: filePath,
          destination: path.join("tools", path.basename(filePath)),
        });
      }
      return accum;
    },
    [modtypeAttr, versionAttr],
  );

  return Promise.resolve({ instructions });
}

<<<<<<< HEAD
export async function testBG3SE(files: string[], gameId: string): Promise<types.ISupportedResult> {
=======
export async function testBG3SE(
  files: string[],
  gameId: string,
): Promise<types.ISupportedResult> {
>>>>>>> v2.0.1
  if (gameId !== GAME_ID) {
    return Promise.resolve({ supported: false, requiredFiles: [] });
  }

  const hasDWriteDll =
<<<<<<< HEAD
    files.find((file) => path.basename(file).toLowerCase() === "dwrite.dll") !== undefined;
=======
    files.find((file) => path.basename(file).toLowerCase() === "dwrite.dll") !==
    undefined;
>>>>>>> v2.0.1

  return Promise.resolve({
    supported: hasDWriteDll,
    requiredFiles: [],
  });
}

export function testReplacer(
  files: string[],
  gameId: string,
): Promise<types.ISupportedResult> {
  if (gameId !== GAME_ID) {
    return Promise.resolve({ supported: false, requiredFiles: [] });
  }
<<<<<<< HEAD
  const paks = files.filter((file) => path.extname(file).toLowerCase() === ".pak");
  // do we have a public or generated folder?
  const hasGenOrPublicFolder: boolean = ["generated", "public"].some(
    (segment) =>
      files.find((file) => file.toLowerCase().indexOf(segment + path.sep) !== -1) !== undefined,
=======
  const paks = files.filter(
    (file) => path.extname(file).toLowerCase() === ".pak",
  );
  // do we have a public or generated folder?
  const hasGenOrPublicFolder: boolean = ["generated", "public"].some(
    (segment) =>
      files.find(
        (file) => file.toLowerCase().indexOf(segment + path.sep) !== -1,
      ) !== undefined,
>>>>>>> v2.0.1
  );

  return Promise.resolve({
    supported: hasGenOrPublicFolder || paks.length === 0,
    requiredFiles: [],
  });
}

<<<<<<< HEAD
export async function installReplacer(files: string[]): Promise<types.IInstallResult> {
  const directories = Array.from(new Set(files.map((file) => path.dirname(file).toUpperCase())));
=======
export async function installReplacer(
  files: string[],
): Promise<types.IInstallResult> {
  const directories = Array.from(
    new Set(files.map((file) => path.dirname(file).toUpperCase())),
  );
>>>>>>> v2.0.1
  let dataPath = undefined;
  const genOrPublic = directories.find((dir) =>
    ["PUBLIC", "GENERATED"].includes(path.basename(dir)),
  );
  if (genOrPublic !== undefined) {
    dataPath = path.dirname(genOrPublic);
  }
  if (dataPath === undefined) {
    dataPath = directories.find((dir) => path.basename(dir) === "DATA");
  }

  const instructions: types.IInstruction[] =
    dataPath !== undefined
      ? files.reduce((prev: types.IInstruction[], filePath: string) => {
          if (filePath.endsWith(path.sep)) {
            return prev;
          }
          const relPath = path.relative(dataPath, filePath);
          if (!relPath.startsWith("..")) {
            prev.push({
              type: "copy",
              source: filePath,
              destination: relPath,
            });
          }
          return prev;
        }, [])
      : files.map(
          (filePath: string): types.IInstruction => ({
            type: "copy",
            source: filePath,
            destination: filePath,
          }),
        );

  return Promise.resolve({
    instructions,
  });
}
