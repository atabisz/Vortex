import type { IMainPage } from "../types/IMainPage";
<<<<<<< HEAD
=======

>>>>>>> v2.0.0
import { GameSettings } from "../views/GameSettings";
import { ToolsPage } from "../views/pages/Tools";
import { Settings } from "../views/Settings";

/**
 * Helper to define a built-in page with sensible defaults.
 * Avoids repeating `propsFunc: () => undefined, visible: () => true` everywhere.
 */
function definePage(
<<<<<<< HEAD
  page: Pick<IMainPage, "id" | "title" | "group" | "component" | "icon"> & Partial<IMainPage>,
=======
  page: Pick<IMainPage, "id" | "title" | "group" | "component" | "icon"> &
    Partial<IMainPage>,
>>>>>>> v2.0.0
): IMainPage {
  return {
    propsFunc: () => undefined,
    visible: () => true,
    ...page,
  };
}

/**
 * Pages that are part of the renderer core, not registered by extensions.
 * To add a new built-in page, add an entry here.
 */
export const builtInPages: IMainPage[] = [
  definePage({
    id: "application_settings",
    title: "Settings",
    group: "global",
    priority: 30,
    component: Settings,
    icon: "settings",
  }),
  definePage({
    id: "tools_page",
    title: "Tools",
    group: "per-game",
    priority: 50,
    isModernOnly: true,
    component: ToolsPage,
    icon: "tools",
  }),
  definePage({
    id: "game_settings",
    title: "Preferences",
    group: "per-game",
    priority: 80,
    isModernOnly: true,
    component: GameSettings,
    icon: "tune",
  }),
];
