import path from "path";
<<<<<<< HEAD

import { useCallback, useEffect, useMemo, useState } from "react";
import { shallowEqual, useSelector } from "react-redux";

import { updateJumpList } from "../../../extensions/starter_dashlet/util";
import type { IState } from "../../../types/IState";
import * as fs from "../../../util/fs";
import { activeGameId } from "../../../util/selectors";
import type { IStarterInfo } from "../../../util/StarterInfo";
import type StarterInfo from "../../../util/StarterInfo";
=======
import { useCallback, useEffect, useMemo, useState } from "react";
import { shallowEqual, useSelector } from "react-redux";

import type { IState } from "../../../types/IState";
import type { IStarterInfo } from "../../../util/StarterInfo";
import type StarterInfo from "../../../util/StarterInfo";

import { updateJumpList } from "../../../extensions/starter_dashlet/util";
import * as fs from "../../../util/fs";
import { activeGameId } from "../../../util/selectors";
>>>>>>> v2.0.0
import { truthy } from "../../../util/util";
import { generateGameStarter, generateToolStarters } from "./toolStarters";

const MAX_PINNED_TOOLS = 5;

<<<<<<< HEAD
async function validateTools(starters: IStarterInfo[], discoveryPath: string): Promise<string[]> {
=======
async function validateTools(
  starters: IStarterInfo[],
  discoveryPath: string,
): Promise<string[]> {
>>>>>>> v2.0.0
  const validIds: string[] = [];
  for (const starter of starters) {
    if (!starter?.exePath) continue;
    const exePath = path.isAbsolute(starter.exePath)
      ? starter.exePath
      : path.join(discoveryPath, starter.exePath);
    try {
      await fs.statAsync(exePath);
      validIds.push(starter.id);
    } catch {
      // tool exe not found - not valid
    }
  }
  return validIds;
}

export const useToolsData = () => {
  const gameMode = useSelector(activeGameId);
<<<<<<< HEAD
  const knownGames = useSelector((state: IState) => state.session.gameMode.known);
  const discoveredGames = useSelector((state: IState) => state.settings.gameMode.discovered);
  const discoveredTools = useSelector(
    (state: IState) => state.settings.gameMode.discovered?.[gameMode]?.tools ?? {},
    shallowEqual,
  );
  const toolsOrder = useSelector(
    (state: IState) => state.settings.interface.tools?.order?.[gameMode] ?? [],
=======
  const knownGames = useSelector(
    (state: IState) => state.session.gameMode.known,
  );
  const discoveredGames = useSelector(
    (state: IState) => state.settings.gameMode.discovered,
  );
  const discoveredTools = useSelector(
    (state: IState) =>
      state.settings.gameMode.discovered?.[gameMode]?.tools ?? {},
    shallowEqual,
  );
  const toolsOrder = useSelector(
    (state: IState) =>
      state.settings.interface.tools?.order?.[gameMode] ?? [],
>>>>>>> v2.0.0
    shallowEqual,
  );
  const primaryTool = useSelector(
    (state: IState) => state.settings.interface.primaryTool?.[gameMode],
  );
  const pinnedToolsMap = useSelector(
<<<<<<< HEAD
    (state: IState) => state.settings.interface.tools?.pinned?.[gameMode] ?? {},
    shallowEqual,
  );
  const toolsRunning = useSelector((state: IState) => state.session.base.toolsRunning);
  const mods = useSelector((state: IState) => state.persistent.mods?.[gameMode]);
  const deploymentCounter = useSelector(
    (state: IState) => state.persistent?.deployment?.deploymentCounter?.[gameMode] ?? 0,
=======
    (state: IState) =>
      state.settings.interface.tools?.pinned?.[gameMode] ?? {},
    shallowEqual,
  );
  const toolsRunning = useSelector(
    (state: IState) => state.session.base.toolsRunning,
  );
  const mods = useSelector(
    (state: IState) => state.persistent.mods?.[gameMode],
  );
  const deploymentCounter = useSelector(
    (state: IState) =>
      state.persistent?.deployment?.deploymentCounter?.[gameMode] ?? 0,
>>>>>>> v2.0.0
  );

  // ── Tool generation & validation ────────────────────────────────────────
  const [validToolIds, setValidToolIds] = useState<string[]>([]);

  const tools = useMemo(() => {
<<<<<<< HEAD
    const gameStarter = generateGameStarter(knownGames, discoveredGames, gameMode);
=======
    const gameStarter = generateGameStarter(
      knownGames,
      discoveredGames,
      gameMode,
    );
>>>>>>> v2.0.0
    const newTools = generateToolStarters(
      knownGames,
      discoveredGames,
      discoveredTools,
      toolsOrder,
      gameMode,
      gameStarter?.id,
    );
<<<<<<< HEAD
    const jumpList = truthy(gameStarter) ? [gameStarter].concat(newTools) : newTools;
=======
    const jumpList = truthy(gameStarter)
      ? [gameStarter].concat(newTools)
      : newTools;
>>>>>>> v2.0.0
    updateJumpList(jumpList);
    return newTools;
  }, [knownGames, discoveredGames, discoveredTools, toolsOrder, gameMode]);

  useEffect(() => {
    const discoveryPath = discoveredGames[gameMode]?.path;
    if (discoveryPath !== undefined) {
      void validateTools(tools, discoveryPath).then(setValidToolIds);
    }
  }, [tools, discoveredGames, gameMode, mods, deploymentCounter]);

  // ── Derived: hidden / pinned / unpinned / launcher split ─────────────────

  const isToolHidden = useCallback(
    (starter: IStarterInfo) => discoveredTools[starter.id]?.hidden === true,
    [discoveredTools],
  );

  const isToolPinned = useCallback(
    (starter: IStarterInfo) => pinnedToolsMap[starter.id] === true,
    [pinnedToolsMap],
  );

  const { launcherTool, otherPinnedTools, unpinnedTools } = useMemo(() => {
    // Hidden tools (removed in classic UI) are excluded entirely
    const visible = tools.filter(
<<<<<<< HEAD
      (s) => s.isGame || discoveredTools[s.id] === undefined || !isToolHidden(s),
=======
      (s) =>
        s.isGame || discoveredTools[s.id] === undefined || !isToolHidden(s),
>>>>>>> v2.0.0
    );

    const launcher = visible.find((s) => s.id === primaryTool);
    const nonLauncher = visible.filter((s) => s.id !== primaryTool);

    // Tools with explicit pinned=true go to pinned section.
    // Tools with no pinned state (undefined) go to unpinned (default).
    // Tools with explicit pinned=false go to unpinned.
    const pinned = nonLauncher.filter((s) => isToolPinned(s));
    const unpinned = nonLauncher.filter((s) => !isToolPinned(s));

    return {
      launcherTool: launcher,
      otherPinnedTools: pinned,
      unpinnedTools: unpinned,
    };
<<<<<<< HEAD
  }, [tools, primaryTool, discoveredTools, pinnedToolsMap, isToolHidden, isToolPinned]);
=======
  }, [
    tools,
    primaryTool,
    discoveredTools,
    pinnedToolsMap,
    isToolHidden,
    isToolPinned,
  ]);
>>>>>>> v2.0.0

  const pinnedCount = otherPinnedTools.length;
  const maxPinnedReached = pinnedCount >= MAX_PINNED_TOOLS;

  const isToolValid = useCallback(
    (starter: IStarterInfo) => validToolIds.includes(starter.id),
    [validToolIds],
  );

  const isToolRunning = useCallback(
    (starter: IStarterInfo) => {
      const starterInfo = starter as StarterInfo;
<<<<<<< HEAD
      return starterInfo?.exePath !== undefined && toolsRunning[starterInfo.exePath] !== undefined;
=======
      return (
        starterInfo?.exePath !== undefined &&
        toolsRunning[starterInfo.exePath] !== undefined
      );
>>>>>>> v2.0.0
    },
    [toolsRunning],
  );

  return {
    gameMode,
    tools,
    toolsOrder,
    knownGames,
    discoveredGames,
    discoveredTools,
    primaryTool,
    launcherTool,
    otherPinnedTools,
    unpinnedTools,
    pinnedCount,
    maxPinnedReached,
    MAX_PINNED_TOOLS,
    isToolValid,
    isToolRunning,
    isToolHidden,
  };
};
