import type { list as drivelistListT } from "drivelist";
import type { IExtensionApi } from "../../../types/IExtensionContext";
import { log } from "../../../util/log";

// Injectable seam for testing — follows the _setSpawner pattern in elevated.ts.
// Production code never calls _setDrivelistLoader.
type DrivelistLoader = () => typeof drivelistListT;
let _drivelistLoader: DrivelistLoader = () => require("drivelist").list;

/** @internal Override the drivelist loader for testing. Do not call in production. */
export function _setDrivelistLoader(fn: DrivelistLoader): void {
  _drivelistLoader = fn;
}

/** @internal Reset the drivelist loader to the production default. */
export function _resetDrivelistLoader(): void {
  _drivelistLoader = () => require("drivelist").list;
}

function getDriveList(api: IExtensionApi): Promise<string[]> {
  let list: typeof drivelistListT;
  try {
    list = _drivelistLoader();
    if (typeof list !== "function") {
      throw new Error('Failed to load "drivelist" module');
    }
  } catch (err) {
    if (process.platform === "linux") {
      log("debug", "drivelist module unavailable on Linux, using root fallback", err);
      return Promise.resolve(["/"]);
    }
    api.showErrorNotification(
      "Failed to query list of system drives",
      {
        message:
          "Vortex was not able to query the operating system for the list of system drives. " +
          "If this error persists, please configure the list manually.",
        error: err,
      },
      { allowReport: false },
    );
    return Promise.resolve(["C:"]);
  }

  return list()
    .then((disks) =>
      disks
        .sort()
        .filter((disk) => disk.isSystem && !disk.isRemovable)
        .reduce((prev, disk) => {
          if (disk.mountpoints) {
            prev.push(...disk.mountpoints.map((mp) => mp.path));
          } else if (disk["mountpoint"] !== undefined) {
            prev.push(disk["mountpoint"]);
          }
          return prev;
        }, []),
    )
    .catch((err) => {
      if (process.platform === "linux") {
        log("debug", "drivelist failed on Linux, using root fallback", err);
        return ["/"];
      }
      api.showErrorNotification(
        "Failed to determine list of disk drives. " +
          "Please review the settings before scanning for games.",
        err,
        { allowReport: false },
      );
      return ["C:"];
    });
}

export default getDriveList;
