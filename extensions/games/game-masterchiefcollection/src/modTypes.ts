import path from "path";
<<<<<<< HEAD

import { types } from "vortex-api";

=======
import { types } from "vortex-api";
>>>>>>> v2.0.1
import { MOD_INFO_JSON_FILE } from "./common";

export async function testPlugAndPlayModType(instr: types.IInstruction[]) {
  const modInfo = instr.find(
    (instr) =>
<<<<<<< HEAD
      instr.type === "copy" && path.basename(instr.source).toLowerCase() === MOD_INFO_JSON_FILE,
=======
      instr.type === "copy" &&
      path.basename(instr.source).toLowerCase() === MOD_INFO_JSON_FILE,
>>>>>>> v2.0.1
  );
  return modInfo !== undefined;
}
