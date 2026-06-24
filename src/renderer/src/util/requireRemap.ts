import fs from "node:fs";
import Module from "node:module";
import path from "node:path";

import * as electron from "./electron";

interface InternalModule extends Module {
  _load(request: string, parent?: Module | null, isMain?: boolean): unknown;
  _nodeModulePaths(from: string): string[];
}

// When spawning a binary, code doing the spawning will be baked by webpack in
// release builds and thus reside in app.asar. Binaries spawned however will be
// unpacked, so if the path being spawned includes __dirname we update the path.
class ChildProcessProxy {
  public get(target, key: PropertyKey): any {
    if (key === "__isProxied") {
      return true;
    } else if (key === "spawn") {
      return (command: string, ...args: readonly unknown[]) => {
        const appAsar = `${path.sep}app.asar${path.sep}`;
        command = command.replace(appAsar, `${path.sep}app.asar.unpacked${path.sep}`);
        return target.spawn(command, ...args);
      };
    } else {
      return target[key];
    }
  }
}

const originalRequire = Module.prototype.require;
Module.prototype.require = function (modulePath) {
  if (modulePath === "libxmljs") {
    throw new Error(
      "libxmljs has been deprecated in favor of xml2js. Please disable any extensions that use it. (community extensions only)",
    );
  }
  return originalRequire.apply(this, arguments);
};

function withRealParentPath<T>(parent: Module | null | undefined, cb: () => T): T {
  if (
    parent?.filename === undefined ||
    !parent.filename.includes(`${path.sep}node_modules${path.sep}`)
  ) {
    return cb();
  }

  let realFilename: string;
  try {
    realFilename = fs.realpathSync.native(parent.filename);
  } catch {
    return cb();
  }

  if (realFilename === parent.filename) {
    return cb();
  }

  const originalFilename = parent.filename;
  const originalPaths = parent.paths;
  parent.filename = realFilename;
  parent.paths = (Module as unknown as InternalModule)._nodeModulePaths(path.dirname(realFilename));
  try {
    return cb();
  } finally {
    parent.filename = originalFilename;
    parent.paths = originalPaths;
  }
}

function patchedLoad(orig: InternalModule["_load"]): InternalModule["_load"] {
  return function (request, parent, ...rest) {
    if (
      request === "fs" &&
      (parent?.filename.includes("graceful-fs") || parent?.filename.includes("rimraf"))
    ) {
      request = "original-fs";
    } else if (request === "electron") {
      // Let the preload script get the real electron module.
      if (parent?.filename.includes("preload")) {
        return orig.apply(this, [request, parent, ...rest]);
      }

      return electron;
    }

    let res = withRealParentPath(parent, () => orig.apply(this, [request, parent, ...rest]));

    if (request === "child_process" && !res.__isProxied) {
      res = new Proxy(res, new ChildProcessProxy());
    }

    return res;
  };
}

export default function () {
  const castModule = Module as unknown as InternalModule;

  const orig = castModule._load;
  castModule._load = patchedLoad(orig);
  return () => {
    castModule._load = orig;
  };
}
