import { useCallback, useContext, useState } from "react";
import { useDispatch } from "react-redux";
import { generate as shortid } from "shortid";

<<<<<<< HEAD
=======
import type { IGameStored } from "../../../types/IState";
import type { IStarterInfo } from "../../../util/StarterInfo";

>>>>>>> v2.0.0
import { setToolVisible } from "../../../extensions/gamemode_management/actions/settings";
import {
  setPrimaryTool,
  setToolOrder,
  setToolPinned,
} from "../../../extensions/starter_dashlet/actions";
<<<<<<< HEAD
import type { IGameStored } from "../../../types/IState";
import { showError } from "../../../util/message";
import type { IStarterInfo } from "../../../util/StarterInfo";
=======
import { showError } from "../../../util/message";
>>>>>>> v2.0.0
import StarterInfo from "../../../util/StarterInfo";
import { MainContext } from "../../MainWindow";
import { useToolsData } from "./useToolsData";

function swapInOrder(ids: string[], fromIdx: number, toIdx: number): string[] {
  const copy = [...ids];
  [copy[fromIdx], copy[toIdx]] = [copy[toIdx], copy[fromIdx]];
  return copy;
}

export const useToolsPage = () => {
  const context = useContext(MainContext);
  const reduxDispatch = useDispatch();

  const data = useToolsData();
  const {
    gameMode,
    tools,
    knownGames,
    discoveredGames,
    discoveredTools,
    primaryTool,
    isToolHidden,
  } = data;

  // ── Edit dialog state ─────────────────────────────────────────────────
<<<<<<< HEAD
  const [toolBeingEdited, setToolBeingEdited] = useState<StarterInfo>(undefined);
=======
  const [toolBeingEdited, setToolBeingEdited] =
    useState<StarterInfo>(undefined);
>>>>>>> v2.0.0
  const [counter, setCounter] = useState(1);

  const closeEditDialog = useCallback(() => {
    setToolBeingEdited(undefined);
    setCounter((c) => c + 1);
  }, []);

  const editTool = useCallback((starter: StarterInfo) => {
    setToolBeingEdited(starter);
  }, []);

  const addNewTool = useCallback(() => {
    const game = knownGames.find((g: IGameStored) => g.id === gameMode);
    const empty = new StarterInfo(game, discoveredGames[gameMode], undefined, {
      id: shortid(),
      path: "",
      hidden: false,
      custom: true,
      workingDirectory: "",
      name: "",
      executable: undefined,
      requiredFiles: [],
      logo: undefined,
      shell: false,
    });
    setToolBeingEdited(empty);
    context.api.events.emit("analytics-track-click-event", "Tools", "Add tool");
  }, [knownGames, discoveredGames, gameMode]);

  // ── Tool actions ──────────────────────────────────────────────────────

  const onShowError = useCallback(
    (message: string, details?: unknown, allowReport?: boolean) =>
      showError(reduxDispatch, message, details, { allowReport }),
    [reduxDispatch],
  );

  const startTool = useCallback(
    (info: StarterInfo) => {
      if (info?.exePath === undefined) {
        onShowError(
          "Tool missing/misconfigured",
          "Please ensure that the tool/game is configured correctly and try again",
          false,
        );
        return;
      }
<<<<<<< HEAD
      context.api.events.emit("analytics-track-click-event", "Tools", "Manually ran tool");
=======
      context.api.events.emit(
        "analytics-track-click-event",
        "Tools",
        "Manually ran tool",
      );
>>>>>>> v2.0.0
      StarterInfo.run(info, context.api, onShowError);
    },
    [onShowError],
  );

  const setToolPrimary = useCallback(
    (starter: StarterInfo) => {
      if (starter.id === primaryTool) {
        reduxDispatch(setPrimaryTool(starter.gameId, null));
      } else {
        context.api.events.emit(
          "analytics-track-click-event",
          "Tools",
          "Selected new primary tool",
        );
<<<<<<< HEAD
        reduxDispatch(setPrimaryTool(starter.gameId, starter.isGame ? null : starter.id));
=======
        reduxDispatch(
          setPrimaryTool(starter.gameId, starter.isGame ? null : starter.id),
        );
>>>>>>> v2.0.0
      }
    },
    [reduxDispatch, primaryTool],
  );

  const removeTool = useCallback(
    (starter: StarterInfo) => {
<<<<<<< HEAD
      context.api.events.emit("analytics-track-click-event", "Tools", "Removed tool");
=======
      context.api.events.emit(
        "analytics-track-click-event",
        "Tools",
        "Removed tool",
      );
>>>>>>> v2.0.0
      reduxDispatch(setToolVisible(gameMode, starter.id, false));
    },
    [reduxDispatch, gameMode],
  );

  const togglePin = useCallback(
    (starter: IStarterInfo) => {
<<<<<<< HEAD
      const currentlyPinned = data.otherPinnedTools.some((s) => s.id === starter.id);
=======
      const currentlyPinned = data.otherPinnedTools.some(
        (s) => s.id === starter.id,
      );
>>>>>>> v2.0.0
      reduxDispatch(setToolPinned(gameMode, starter.id, !currentlyPinned));
    },
    [reduxDispatch, gameMode, data.otherPinnedTools],
  );

  // ── Reordering ────────────────────────────────────────────────────────

  const applyOrder = useCallback(
    (ordered: string[]) => {
<<<<<<< HEAD
      const names = ordered.map((id) => tools.find((t) => t.id === id)?.name).filter(Boolean);
=======
      const names = ordered
        .map((id) => tools.find((t) => t.id === id)?.name)
        .filter(Boolean);
>>>>>>> v2.0.0
      context.api.events.emit(
        "analytics-track-event",
        "Tools",
        "Drag above/below",
        "Rearranged tools",
        names.join(),
      );
      reduxDispatch(setToolOrder(gameMode, ordered));
    },
    [reduxDispatch, gameMode, tools],
  );

  const getVisibleIds = useCallback(() => {
    return tools
<<<<<<< HEAD
      .filter((s) => s.isGame || discoveredTools[s.id] === undefined || !isToolHidden(s))
=======
      .filter(
        (s) =>
          s.isGame || discoveredTools[s.id] === undefined || !isToolHidden(s),
      )
>>>>>>> v2.0.0
      .map((s) => s.id);
  }, [tools, discoveredTools, isToolHidden]);

  const moveToolUp = useCallback(
    (starter: IStarterInfo) => {
      const ids = getVisibleIds();
      const idx = ids.indexOf(starter.id);
      if (idx > 0) {
        applyOrder(swapInOrder(ids, idx - 1, idx));
      }
    },
    [applyOrder, getVisibleIds],
  );

  const moveToolDown = useCallback(
    (starter: IStarterInfo) => {
      const ids = getVisibleIds();
      const idx = ids.indexOf(starter.id);
      if (idx < ids.length - 1) {
        applyOrder(swapInOrder(ids, idx, idx + 1));
      }
    },
    [applyOrder, getVisibleIds],
  );

  return {
    ...data,
    toolBeingEdited,
    counter,
    addNewTool,
    editTool,
    removeTool,
    startTool,
    setToolPrimary,
    togglePin,
    moveToolUp,
    moveToolDown,
    closeEditDialog,
  };
};
