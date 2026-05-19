import { createAction } from "redux-act";

<<<<<<< HEAD
export const setPriorityType = createAction("TW3_SET_PRIORITY_TYPE", (type) => type);
=======
export const setPriorityType = createAction(
  "TW3_SET_PRIORITY_TYPE",
  (type) => type,
);
>>>>>>> v2.0.1

export const setSuppressModLimitPatch = createAction(
  "TW3_SET_SUPPRESS_LIMIT_PATCH",
  (suppress) => suppress,
);
