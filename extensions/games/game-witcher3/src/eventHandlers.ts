/* eslint-disable */
import { actions, types, selectors, util } from "vortex-api";
<<<<<<< HEAD
=======

import { setPriorityType } from "./actions";
>>>>>>> v2.0.1

import { setPriorityType } from "./actions";
import {
  GAME_ID,
  getPriorityTypeBranch,
  PART_SUFFIX,
  INPUT_XML_FILENAME,
  SCRIPT_MERGER_ID,
  I18N_NAMESPACE,
} from "./common";
<<<<<<< HEAD
import IniStructure from "./iniParser";
import * as menuMod from "./menumod";
import { storeToProfile, restoreFromProfile } from "./mergeBackup";
import { getPersistentLoadOrder } from "./migrations";
import { PriorityManager } from "./priorityManager";
import { IRemoveModOptions } from "./types";
=======

import * as menuMod from "./menumod";
import { storeToProfile, restoreFromProfile } from "./mergeBackup";
>>>>>>> v2.0.1
import {
  validateProfile,
  forceRefresh,
  suppressEventHandlers,
  notifyMissingScriptMerger,
} from "./util";
<<<<<<< HEAD
=======
import { PriorityManager } from "./priorityManager";
import { IRemoveModOptions } from "./types";

import IniStructure from "./iniParser";
import { getPersistentLoadOrder } from "./migrations";
>>>>>>> v2.0.1

type Deployment = { [modType: string]: types.IDeployedFile[] };

export function onGameModeActivation(api: types.IExtensionApi) {
  return async (gameMode: string) => {
    if (gameMode !== GAME_ID) {
      // Just in case the script merger notification is still
      //  present.
      api.dismissNotification("witcher3-merge");
    } else {
      const state = api.getState();
      const lastProfId = selectors.lastActiveProfileForGame(state, gameMode);
      const activeProf = selectors.activeProfile(state);
<<<<<<< HEAD
      const priorityType = util.getSafe(state, getPriorityTypeBranch(), "prefix-based");
      api.store.dispatch(setPriorityType(priorityType));
      if (lastProfId !== activeProf?.id) {
        try {
          await storeToProfile(api, lastProfId).then(() => restoreFromProfile(api, activeProf?.id));
        } catch (err) {
          api.showErrorNotification("Failed to restore profile merged files", err);
=======
      const priorityType = util.getSafe(
        state,
        getPriorityTypeBranch(),
        "prefix-based",
      );
      api.store.dispatch(setPriorityType(priorityType));
      if (lastProfId !== activeProf?.id) {
        try {
          await storeToProfile(api, lastProfId).then(() =>
            restoreFromProfile(api, activeProf?.id),
          );
        } catch (err) {
          api.showErrorNotification(
            "Failed to restore profile merged files",
            err,
          );
>>>>>>> v2.0.1
        }
      }
    }
  };
}

export const onWillDeploy = (api: types.IExtensionApi) => {
  return async (profileId: string, deployment: Deployment) => {
    const state = api.store.getState();
    const activeProfile = validateProfile(profileId, state);
    if (activeProfile === undefined || suppressEventHandlers(api)) {
      return Promise.resolve();
    }

    return menuMod
      .onWillDeploy(api, deployment, activeProfile)
<<<<<<< HEAD
      .catch((err) => (err instanceof util.UserCanceled ? Promise.resolve() : Promise.reject(err)));
=======
      .catch((err) =>
        err instanceof util.UserCanceled
          ? Promise.resolve()
          : Promise.reject(err),
      );
>>>>>>> v2.0.1
  };
};

const applyToIniStruct = (
  api: types.IExtensionApi,
  getPriorityManager: () => PriorityManager,
  modIds: string[],
) => {
  const currentLO = getPersistentLoadOrder(api);
  const newLO: types.ILoadOrderEntry[] = [
    ...currentLO.filter((entry) => !modIds.includes(entry.modId)),
  ];
  IniStructure.getInstance(api, getPriorityManager)
    .setINIStruct(newLO)
    .then(() => forceRefresh(api));
};

export const onModsDisabled = (
  api: types.IExtensionApi,
  priorityManager: () => PriorityManager,
) => {
  return async (modIds: string[], enabled: boolean, gameId: string) => {
    if (gameId !== GAME_ID || enabled) {
      return;
    }
    applyToIniStruct(api, priorityManager, modIds);
  };
};

export const onDidRemoveMod = (
  api: types.IExtensionApi,
  priorityManager: () => PriorityManager,
) => {
<<<<<<< HEAD
  return async (gameId: string, modId: string, removeOpts: IRemoveModOptions) => {
=======
  return async (
    gameId: string,
    modId: string,
    removeOpts: IRemoveModOptions,
  ) => {
>>>>>>> v2.0.1
    if (GAME_ID !== gameId || removeOpts?.willBeReplaced) {
      return Promise.resolve();
    }
    applyToIniStruct(api, priorityManager, [modId]);
  };
};

export const onDidPurge = (
  api: types.IExtensionApi,
  priorityManager: () => PriorityManager,
) => {
  return async (profileId: string, deployment: Deployment) => {
    const state = api.getState();
    const activeProfile = validateProfile(profileId, state);
    if (activeProfile === undefined) {
      return Promise.resolve();
    }

    return IniStructure.getInstance(api, priorityManager).revertLOFile();
  };
};

let prevDeployment: Deployment = {};
export const onDidDeploy = (api: types.IExtensionApi) => {
  return async (profileId: string, deployment: Deployment) => {
    const state = api.getState();
    const activeProfile = validateProfile(profileId, state);
    if (activeProfile === undefined) {
      return Promise.resolve();
    }

    if (JSON.stringify(prevDeployment) !== JSON.stringify(deployment)) {
      prevDeployment = deployment;
      queryScriptMerge(
        api,
        "Your mods state/load order has changed since the last time you ran " +
          "the script merger. You may want to run the merger tool and check whether any new script conflicts are " +
          "present, or if existing merges have become unecessary. Please also note that any load order changes " +
          "may affect the order in which your conflicting mods are meant to be merged, and may require you to " +
          "remove the existing merge and re-apply it.",
      );
    }
    const loadOrder = getPersistentLoadOrder(api);
    const docFiles = (deployment["witcher3menumodroot"] ?? []).filter(
      (file) =>
<<<<<<< HEAD
        file.relPath.endsWith(PART_SUFFIX) && file.relPath.indexOf(INPUT_XML_FILENAME) === -1,
=======
        file.relPath.endsWith(PART_SUFFIX) &&
        file.relPath.indexOf(INPUT_XML_FILENAME) === -1,
>>>>>>> v2.0.1
    );
    const menuModPromise = () => {
      if (docFiles.length === 0) {
        // If there are no menu mods deployed - remove the mod.
        return menuMod.removeMenuMod(api, activeProfile);
      } else {
<<<<<<< HEAD
        return menuMod.onDidDeploy(api, deployment, activeProfile).then(async (modId: string) => {
          if (modId === undefined) {
=======
        return menuMod
          .onDidDeploy(api, deployment, activeProfile)
          .then(async (modId: string) => {
            if (modId === undefined) {
              return Promise.resolve();
            }

            api.store.dispatch(
              actions.setModEnabled(activeProfile.id, modId, true),
            );
            await api.emitAndAwait("deploy-single-mod", GAME_ID, modId, true);
>>>>>>> v2.0.1
            return Promise.resolve();
          }

          api.store.dispatch(actions.setModEnabled(activeProfile.id, modId, true));
          await api.emitAndAwait("deploy-single-mod", GAME_ID, modId, true);
          return Promise.resolve();
        });
      }
    };

    return menuModPromise()
      .then(() => IniStructure.getInstance().setINIStruct(loadOrder))
      .then(() => {
        forceRefresh(api);
        return Promise.resolve();
      })
      .catch((err) =>
<<<<<<< HEAD
        IniStructure.getInstance().modSettingsErrorHandler(err, "Failed to modify load order file"),
=======
        IniStructure.getInstance().modSettingsErrorHandler(
          err,
          "Failed to modify load order file",
        ),
>>>>>>> v2.0.1
      );
  };
};

export const onProfileWillChange = (api: types.IExtensionApi) => {
  return async (profileId: string) => {
    const state = api.getState();
    const profile = selectors.profileById(state, profileId);
    if (profile?.gameId !== GAME_ID) {
      return;
    }

<<<<<<< HEAD
    const priorityType = util.getSafe(state, getPriorityTypeBranch(), "prefix-based");
=======
    const priorityType = util.getSafe(
      state,
      getPriorityTypeBranch(),
      "prefix-based",
    );
>>>>>>> v2.0.1
    api.store.dispatch(setPriorityType(priorityType));

    const lastProfId = selectors.lastActiveProfileForGame(
      state,
      profile.gameId,
    );
    try {
<<<<<<< HEAD
      await storeToProfile(api, lastProfId).then(() => restoreFromProfile(api, profile.id));
    } catch (err) {
      if (!(err instanceof util.UserCanceled)) {
        api.showErrorNotification("Failed to store profile specific merged items", err);
=======
      await storeToProfile(api, lastProfId).then(() =>
        restoreFromProfile(api, profile.id),
      );
    } catch (err) {
      if (!(err instanceof util.UserCanceled)) {
        api.showErrorNotification(
          "Failed to store profile specific merged items",
          err,
        );
>>>>>>> v2.0.1
      }
    }
  };
};

export const onSettingsChange = (
  api: types.IExtensionApi,
  priorityManager: () => PriorityManager,
) => {
  return (prev: string, current: any) => {
    const state = api.getState();
    const activeProfile = selectors.activeProfile(state);
    if (activeProfile?.gameId !== GAME_ID || priorityManager === undefined) {
      return;
    }

<<<<<<< HEAD
    const priorityType = util.getSafe(state, getPriorityTypeBranch(), "prefix-based");
=======
    const priorityType = util.getSafe(
      state,
      getPriorityTypeBranch(),
      "prefix-based",
    );
>>>>>>> v2.0.1
    priorityManager().priorityType = priorityType;
  };
};

function getScriptMergerTool(api) {
  const state = api.store.getState();
  const scriptMerger = util.getSafe(
    state,
    ["settings", "gameMode", "discovered", GAME_ID, "tools", SCRIPT_MERGER_ID],
    undefined,
  );
  if (!!scriptMerger?.path) {
    return scriptMerger;
  }

  return undefined;
}

function runScriptMerger(api) {
  const tool = getScriptMergerTool(api);
  if (tool?.path === undefined) {
    notifyMissingScriptMerger(api);
    return Promise.resolve();
  }

<<<<<<< HEAD
  return api.runExecutable(tool.path, [], { suggestDeploy: true }).catch((err) =>
    api.showErrorNotification("Failed to run tool", err, {
      allowReport: ["EPERM", "EACCESS", "ENOENT"].indexOf(err.code) !== -1,
    }),
  );
=======
  return api
    .runExecutable(tool.path, [], { suggestDeploy: true })
    .catch((err) =>
      api.showErrorNotification("Failed to run tool", err, {
        allowReport: ["EPERM", "EACCESS", "ENOENT"].indexOf(err.code) !== -1,
      }),
    );
>>>>>>> v2.0.1
}

function queryScriptMerge(api: types.IExtensionApi, reason: string) {
  const state = api.store.getState();
  const t = api.translate;
  if ((state.session.base.activity?.installing_dependencies ?? []).length > 0) {
    // Do not bug users while they're installing a collection.
    return;
  }
  const scriptMergerTool = util.getSafe(
    state,
    ["settings", "gameMode", "discovered", GAME_ID, "tools", SCRIPT_MERGER_ID],
    undefined,
  );
  if (!!scriptMergerTool?.path) {
    api.sendNotification({
      id: "witcher3-merge",
      type: "warning",
<<<<<<< HEAD
      message: t("Witcher Script merger may need to be executed", { ns: I18N_NAMESPACE }),
=======
      message: t("Witcher Script merger may need to be executed", {
        ns: I18N_NAMESPACE,
      }),
>>>>>>> v2.0.1
      allowSuppress: true,
      actions: [
        {
          title: "More",
          action: () => {
            api.showDialog(
              "info",
              "Witcher 3",
              {
                text: reason,
              },
              [{ label: "Close" }],
            );
          },
        },
        {
          title: "Run tool",
          action: (dismiss) => {
            runScriptMerger(api);
            dismiss();
          },
        },
      ],
    });
  } else {
    notifyMissingScriptMerger(api);
  }
}
