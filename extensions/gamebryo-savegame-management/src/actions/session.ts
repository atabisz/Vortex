import { createAction } from "redux-act";

import { ISavegame } from "../types/ISavegame";

export const setSavegames = createAction(
  "SET_SAVEGAMES",
<<<<<<< HEAD
  (savegames: { [id: string]: ISavegame }, truncated: boolean) => ({ savegames, truncated }),
=======
  (savegames: { [id: string]: ISavegame }, truncated: boolean) => ({
    savegames,
    truncated,
  }),
>>>>>>> v2.0.1
);

export const setSavegameAttribute = createAction(
  "SET_SAVEGAME_ATTRIBUTE",
  (id: string, attribute: string, value: any) => ({ id, attribute, value }),
);

export const updateSavegame = createAction(
  "UPDATE_SAVEGAME",
  (id: string, saveGame: ISavegame) => ({ id, saveGame }),
);

export const clearSavegames = createAction("CLEAR_SAVEGAMES");

export const removeSavegame = createAction(
  "REMOVE_SAVEGAME",
  (id: string) => id,
);

export const setSavegamePath = createAction(
  "SET_SAVEGAME_PATH",
  (path: string) => path,
);

export const showTransferDialog = createAction(
  "SHOW_TRANSFER_DIALOG",
  (b: boolean) => b,
);
