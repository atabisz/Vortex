import path from "path";
<<<<<<< HEAD

import semver from "semver";
import { actions, fs, log, selectors, types, util } from "vortex-api";

import { GAME_ID, modsRelPath } from "./common";

=======
import semver from "semver";
import { actions, fs, log, selectors, types, util } from "vortex-api";

import { GAME_ID, modsRelPath } from "./common";

>>>>>>> v2.0.1
const oldModRelPath = path.join("BloodstainedRotN", "Content", "Paks", "~mod");

export async function migrate100(api: types.IExtensionApi, oldVersion: string) {
  if (semver.gte(oldVersion || "0.0.1", "1.0.0")) {
    return Promise.resolve();
  }

  const state = api.store.getState();
  const activatorId = selectors.activatorForGame(state, GAME_ID);
  const activator = util.getActivator(activatorId);

<<<<<<< HEAD
  const discovery = util.getSafe(state, ["settings", "gameMode", "discovered", GAME_ID], undefined);

  if (discovery === undefined || discovery.path === undefined || activator === undefined) {
    // if this game is not discovered or deployed there is no need to migrate
    log("debug", "skipping bloodstained migration because no deployment set up for it");
=======
  const discovery = util.getSafe(
    state,
    ["settings", "gameMode", "discovered", GAME_ID],
    undefined,
  );

  if (
    discovery === undefined ||
    discovery.path === undefined ||
    activator === undefined
  ) {
    // if this game is not discovered or deployed there is no need to migrate
    log(
      "debug",
      "skipping bloodstained migration because no deployment set up for it",
    );
>>>>>>> v2.0.1
    return Promise.resolve();
  }

  // would be good to inform the user beforehand but since this is run in the main process
  // and we can't currently show a (working) dialog from the main process it has to be
  // this way.
  return api
    .awaitUI()
<<<<<<< HEAD
    .then(() => fs.ensureDirWritableAsync(path.join(discovery.path, modsRelPath())))
    .then(() =>
      api.emitAndAwait("purge-mods-in-path", GAME_ID, "", path.join(discovery.path, oldModRelPath)),
=======
    .then(() =>
      fs.ensureDirWritableAsync(path.join(discovery.path, modsRelPath())),
    )
    .then(() =>
      api.emitAndAwait(
        "purge-mods-in-path",
        GAME_ID,
        "",
        path.join(discovery.path, oldModRelPath),
      ),
>>>>>>> v2.0.1
    )
    .then(() => {
      api.store.dispatch(actions.setDeploymentNecessary(GAME_ID, true));
    });
}
