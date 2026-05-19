import type { IState } from "../types/api";
<<<<<<< HEAD
=======

>>>>>>> v2.0.1
import { getSafe } from "../util/storeHelper";

export const isTelemetryEnabled = (state: IState): boolean =>
  getSafe(state, ["settings", "analytics", "enabled"], false);
