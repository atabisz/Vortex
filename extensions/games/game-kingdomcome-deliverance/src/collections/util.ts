import { types, util } from "vortex-api";

import { transformId } from "../util";

export function isValidMod(mod: types.IMod) {
  return mod !== undefined && mod.type !== "collection";
}

export function isModInCollection(collectionMod: types.IMod, mod: types.IMod) {
  if (collectionMod.rules === undefined) {
    return false;
  }

  return (
<<<<<<< HEAD
    collectionMod.rules.find((rule) => util.testModReference(mod, rule.reference)) !== undefined
=======
    collectionMod.rules.find((rule) =>
      util.testModReference(mod, rule.reference),
    ) !== undefined
>>>>>>> v2.0.1
  );
}

export function genCollectionLoadOrder(
  loadOrder: string[],
  mods: { [modId: string]: types.IMod },
  collection?: types.IMod,
): string[] {
  const sortedMods = (loadOrder || []).filter((loId) => {
    const modId = getModId(mods, loId);
    return collection !== undefined
      ? isValidMod(mods[modId]) && isModInCollection(collection, mods[modId])
      : isValidMod(mods[modId]);
  });
  return sortedMods;
}

export function getModId(mods: { [modId: string]: types.IMod }, loId: string) {
  return Object.keys(mods).find((modId) => transformId(modId) === loId);
}
