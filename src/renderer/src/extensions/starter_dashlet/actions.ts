import { createAction } from "redux-act";

export const setPrimaryTool = createAction(
  "SET_PRIMARY_TOOL",
  (gameId: string, toolId: string) => ({ gameId, toolId }),
);

<<<<<<< HEAD
export const setToolOrder = createAction("SET_TOOLS_ORDER", (gameId: string, tools: string[]) => ({
  gameId,
  tools,
}));
=======
export const setToolOrder = createAction(
  "SET_TOOLS_ORDER",
  (gameId: string, tools: string[]) => ({ gameId, tools }),
);
>>>>>>> v2.0.1

export const setToolValid = createAction(
  "SET_TOOL_IS_VALID",
  (gameId: string, toolId: string, valid: boolean) => ({
    gameId,
    toolId,
    valid,
  }),
);

export const setToolPinned = createAction(
  "SET_TOOL_PINNED",
  (gameId: string, toolId: string, pinned: boolean) => ({
    gameId,
    toolId,
    pinned,
  }),
);
