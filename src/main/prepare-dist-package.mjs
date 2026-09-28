import { createWriteStream, existsSync } from "node:fs";
import { chmod, copyFile, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

const MAIN_DIR = resolve(import.meta.dirname);
const MAIN_PACKAGE_PATH = resolve(MAIN_DIR, "package.json");
const DIST_DIR = resolve(MAIN_DIR, "build");
const DIST_PACKAGE_PATH = resolve(DIST_DIR, "package.json");
const WINAPI_STUB_DIR = [
  resolve(MAIN_DIR, "../../../build/linux/winapi-bindings-stub"),
  resolve(MAIN_DIR, "../../build/linux/winapi-bindings-stub"),
].find((dir) => existsSync(dir));
// Runtimes bundled into the installer; also declared as winget dependencies by winget-release.yml.
const RUNTIME_DEPS_FILE = "runtime-dependencies.json";

// Walks up because MAIN_DIR is the pnpm-deployed copy (src/main/dist), not src/main.
function findUp(fileName, from) {
  let dir = from;
  for (;;) {
    const candidate = resolve(dir, fileName);
    if (existsSync(candidate)) return candidate;
    const parent = dirname(dir);
    if (parent === dir) throw new Error(`Could not find ${fileName} above ${from}`);
    dir = parent;
  }
}

async function resolveDepVersions(deps, nodeModulesDir) {
  if (!deps) return deps;
  const resolved = { ...deps };
  for (const [name, version] of Object.entries(deps)) {
    if (version === "catalog:" || version.startsWith("workspace:")) {
      try {
        const pkgJson = JSON.parse(
          await readFile(resolve(nodeModulesDir, name, "package.json"), "utf8"),
        );
        resolved[name] = pkgJson.version;
      } catch {
        // leave as-is if not found in node_modules
      }
    }
  }
  return resolved;
}

async function downloadFile(url, dest) {
  await mkdir(resolve(dest, ".."), { recursive: true });
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to download ${url}: ${response.statusText}`);
  await pipeline(Readable.fromWeb(response.body), createWriteStream(dest));
}

async function prepareWin() {
  const tempDir = resolve(MAIN_DIR, "temp");
  const runtimeDeps = JSON.parse(await readFile(findUp(RUNTIME_DEPS_FILE, MAIN_DIR), "utf8"));
  for (const { file, url } of runtimeDeps) {
    await downloadFile(url, resolve(tempDir, file));
  }
}

async function replaceWithWinapiStub(dir) {
  if (!WINAPI_STUB_DIR) throw new Error("winapi-bindings Linux stub not found");
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
  const files = await readdir(WINAPI_STUB_DIR);
  await Promise.all(
    files.map((file) => copyFile(resolve(WINAPI_STUB_DIR, file), resolve(dir, file))),
  );
}

async function findPackageDirs(root, packageName) {
  const dirs = [];
  async function walk(dir) {
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    await Promise.all(
      entries
        .filter((entry) => entry.isDirectory())
        .map(async (entry) => {
          const full = resolve(dir, entry.name);
          if (entry.name === packageName) {
            dirs.push(full);
          } else {
            await walk(full);
          }
        }),
    );
  }
  await walk(root);
  return dirs;
}

async function prepareLinux() {
  const nodeModulesRoots = [resolve(DIST_DIR, "node_modules"), resolve(MAIN_DIR, "node_modules")];
  const winapiDirs = new Set(
    (
      await Promise.all(nodeModulesRoots.map((root) => findPackageDirs(root, "winapi-bindings")))
    ).flat(),
  );
  winapiDirs.add(resolve(DIST_DIR, "node_modules", "winapi-bindings"));
  winapiDirs.add(resolve(MAIN_DIR, "node_modules", "winapi-bindings"));
  await Promise.all([...winapiDirs].map((dir) => replaceWithWinapiStub(dir)));

  const fomodIpcBinary = resolve(
    DIST_DIR,
    "node_modules",
    "@nexusmods",
    "fomod-installer-ipc",
    "dist",
    "ModInstallerIPC",
  );
  if (existsSync(fomodIpcBinary)) {
    await chmod(fomodIpcBinary, 0o755);
  }
}

async function main() {
  const json = await readFile(MAIN_PACKAGE_PATH, "utf8");
  const mainPkg = JSON.parse(json);

  mainPkg["name"] = "Vortex";
  mainPkg["main"] = mainPkg.main.replace(/^build\//, "");
  mainPkg["version"] = process.env.VORTEX_VERSION || "1.0.0";
  mainPkg["homepage"] = mainPkg.homepage || "https://github.com/atabisz/Vortex";

  // NOTE(erri120): this is the minimal amount of bullshit required to get the piece of shit software called "electron-builder" to work with PNPM.
  const nodeModulesDir = resolve(MAIN_DIR, "node_modules");
  mainPkg.dependencies = await resolveDepVersions(mainPkg.dependencies, nodeModulesDir);
  mainPkg.devDependencies = await resolveDepVersions(mainPkg.devDependencies, nodeModulesDir);

  await writeFile(DIST_PACKAGE_PATH, JSON.stringify(mainPkg, null, 2) + "\n", "utf8");

  if (process.platform === "win32") {
    await prepareWin();
  } else if (process.platform === "linux") {
    await prepareLinux();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
