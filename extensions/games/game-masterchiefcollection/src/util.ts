import path from "path";
<<<<<<< HEAD

import { fs, types, selectors } from "vortex-api";

=======
import { fs, types, selectors } from "vortex-api";

>>>>>>> v2.0.1
import { GAME_ID, HALO_GAMES, MOD_MANIFEST_FILE_PATH } from "./common";
import { IHaloGame } from "./types";

export function identifyHaloGames(files: string[]): IHaloGame[] {
  // Function aims to identify the relevant halo game entry using the
  //  mod files.
  const filtered = files.filter((file) => path.extname(file) !== "");
  return Object.keys(HALO_GAMES).reduce((accum, key) => {
    const entry = HALO_GAMES[key];
    filtered.forEach((element) => {
      const segments = element.split(path.sep);
      if (segments.includes(entry.modsPath)) {
        accum.push(entry);
        return accum;
      }
    });

    return accum;
  }, []);
}

export async function applyToManifest(
  api: types.IExtensionApi,
  apply: boolean,
) {
  const state = api.getState();
  const activeGame = selectors.activeGameId(state);
  if (activeGame !== GAME_ID) {
    return;
  }
  let manifestData = "";
  try {
<<<<<<< HEAD
    manifestData = await fs.readFileAsync(MOD_MANIFEST_FILE_PATH, { encoding: "utf8" });
=======
    manifestData = await fs.readFileAsync(MOD_MANIFEST_FILE_PATH, {
      encoding: "utf8",
    });
>>>>>>> v2.0.1
  } catch (err) {
    if (!["ENOENT"].includes(err.code)) {
      api.showErrorNotification("Failed to read mod manifest file", err, {
        allowReport: err.code !== "EPERM",
      });
      return;
    }
  }
  const stagingPath = selectors.installPathForGame(state, GAME_ID);
  const lines = manifestData.split("\r\n");
<<<<<<< HEAD
  const hasStagingFolderEntry = lines.some((line) => line.includes(stagingPath));
=======
  const hasStagingFolderEntry = lines.some((line) =>
    line.includes(stagingPath),
  );
>>>>>>> v2.0.1
  if (apply && !hasStagingFolderEntry) {
    lines.push(stagingPath);
  } else if (!apply && hasStagingFolderEntry) {
    lines.splice(lines.indexOf(stagingPath), 1);
  }
  try {
    await fs.ensureDirWritableAsync(path.dirname(MOD_MANIFEST_FILE_PATH));
<<<<<<< HEAD
    await fs.writeFileAsync(MOD_MANIFEST_FILE_PATH, lines.filter((line) => !!line).join("\r\n"));
=======
    await fs.writeFileAsync(
      MOD_MANIFEST_FILE_PATH,
      lines.filter((line) => !!line).join("\r\n"),
    );
>>>>>>> v2.0.1
  } catch (err) {
    api.showErrorNotification("Failed to write mod manifest file", err, {
      allowReport: err.code !== "EPERM",
    });
  }
}
