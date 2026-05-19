<<<<<<< HEAD
import { types, util } from "vortex-api";

import * as actions from "./actions";
=======
import * as actions from "./actions";
import { types, util } from "vortex-api";
>>>>>>> v2.0.1

// reducer
const reducer: types.IReducerSpec = {
  reducers: {
<<<<<<< HEAD
    [actions.setMigration as any]: (state, payload) => util.setSafe(state, ["migration"], payload),
=======
    [actions.setMigration as any]: (state, payload) =>
      util.setSafe(state, ["migration"], payload),
>>>>>>> v2.0.1
    [actions.setAutoExportLoadOrder as any]: (state, payload) =>
      util.setSafe(state, ["autoExportLoadOrder"], payload),
    [actions.setPlayerProfile as any]: (state, payload) =>
      util.setSafe(state, ["playerProfile"], payload),
    [actions.setBG3ExtensionVersion as any]: (state, payload) =>
      util.setSafe(state, ["extensionVersion"], payload.version),
    [actions.settingsWritten as any]: (state, payload) => {
      const { profile, time, count } = payload;
      return util.setSafe(state, ["settingsWritten", profile], { time, count });
    },
  },
  defaults: {
    migration: true,
    autoExportLoadOrder: true,
    playerProfile: "global",
    settingsWritten: {},
    extensionVersion: "0.0.0",
  },
};

export default reducer;
