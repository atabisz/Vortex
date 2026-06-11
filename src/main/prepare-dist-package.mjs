<<<<<<< HEAD
import { readFile, writeFile, mkdir, glob } from "node:fs/promises";
import { resolve, relative, dirname, isAbsolute } from "node:path";
import { fileURLToPath } from "node:url";
=======
import { createWriteStream } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
>>>>>>> v2.1.0

const MAIN_DIR = resolve(import.meta.dirname);
const MAIN_PACKAGE_PATH = resolve(MAIN_DIR, "package.json");
const DIST_DIR = resolve(MAIN_DIR, "build");
const DIST_PACKAGE_PATH = resolve(DIST_DIR, "package.json");

<<<<<<< HEAD
/** Parse catalog from pnpm-workspace.yaml
 * @param {string} yamlText
 * @returns {Record<string, string>}
 */
function parseCatalog(yamlText) {
  const match = yamlText.match(/^catalog:[ \t]*\n((?:(?:[ \t]+.*|[ \t]*)(?:\n|$))*)/m);
  if (!match) return {};

  const catalog = {};
  const lines = match[1].split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const colonIdx = trimmed.indexOf(":");
    if (colonIdx === -1) continue;

    let key = trimmed.slice(0, colonIdx).trim();
    let value = trimmed.slice(colonIdx + 1).trim();

    if (key.startsWith('"') && key.endsWith('"')) {
      key = key.slice(1, -1);
    } else if (key.startsWith("'") && key.endsWith("'")) {
      key = key.slice(1, -1);
    }

    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.slice(1, -1);
    }

    if (key && value) {
      catalog[key] = value;
    }
  }

  return catalog;
}

/** Rewrite relative file dependencies to absolute file dependencies,
 *  and resolve workspace: dependencies to absolute file dependencies */
function rewriteFileDependencies(deps = {}, workspacePackageMap = {}, catalog = {}) {
  const rewritten = {};

=======
async function resolveDepVersions(deps, nodeModulesDir) {
  if (!deps) return deps;
  const resolved = { ...deps };
>>>>>>> v2.1.0
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

<<<<<<< HEAD
/**
 * Builds a map from workspace package name to absolute directory path.
 * Glob patterns containing "*" are skipped.
 * @param {string[]} packagePaths
 * @returns {Promise<Record<string, string>>}
 */
async function buildWorkspacePackageMap(packagePaths) {
  const map = {};

  const resolvedPaths = [];
  for (const pkgPath of packagePaths) {
    if (pkgPath.includes("*")) {
      const matches = await Array.fromAsync(glob(pkgPath, { cwd: ROOT_DIR }));
      for (const match of matches) {
        resolvedPaths.push(match);
      }
    } else {
      resolvedPaths.push(pkgPath);
    }
  }

  for (const pkgPath of resolvedPaths) {
    const pkgDir = resolve(ROOT_DIR, pkgPath);
    const pkgJsonPath = resolve(pkgDir, "package.json");

    try {
      const raw = await readFile(pkgJsonPath, "utf8");
      const pkg = JSON.parse(raw);
      if (pkg.name) {
        map[pkg.name] = pkgDir;
      }
    } catch {
      // Skip packages whose package.json cannot be read
    }
  }

  return map;
}

/** Creates a minimal package.json file */
async function createMinimalPackageJson(workspacePackageMap, catalog) {
  const mainRawJSON = await readFile(MAIN_PACKAGE_PATH, "utf8");
  const mainPkg = JSON.parse(mainRawJSON);

  const rootRawJSON = await readFile(ROOT_PACKAGE_PATH, "utf8");
  const rootPkg = JSON.parse(rootRawJSON);

  const minimal = {
    name: "Vortex",
    version: process.env.VORTEX_VERSION || "1.0.0",
    main: mainPkg.main.replace(/^build\//, ""),
    author: "Black Tree Gaming Ltd.",
    description: "The elegant, powerful, and open-source mod manager from Nexus Mods",
    homepage: "https://www.nexusmods.com/site/mods/1",
    license: "GPL-3.0",
    type: mainPkg.type,
    packageManager: rootPkg.packageManager,
    engines: rootPkg.engines,
    volta: rootPkg.volta,
  };

  if (mainPkg.dependencies && Object.keys(mainPkg.dependencies).length > 0) {
    minimal.dependencies = rewriteFileDependencies(
      mainPkg.dependencies,
      workspacePackageMap,
      catalog,
    );
  }

  await mkdir(DIST_DIR, { recursive: true });

  await writeFile(DIST_PACKAGE_PATH, JSON.stringify(minimal, null, 2) + "\n", "utf8");

  console.log("✔  Created build/package.json");
}

/**
 * Extracts the raw "overrides:" block from a pnpm-workspace.yaml file
 * @param {string} yamlText
 * @returns {string | null}
 */
function extractOverridesBlock(yamlText) {
  const match = yamlText.match(/^overrides:[ \t]*\n((?:[ \t]+\S.*\n?)*)/m);
  if (!match) return null;
  return "overrides:\n" + match[1];
}

/**
 * Extracts the raw "catalog:" block from a pnpm-workspace.yaml file
 * @param {string} yamlText
 * @returns {string | null}
 */
function extractCatalogBlock(yamlText) {
  const match = yamlText.match(/^catalog:[ \t]*\n((?:(?:[ \t]+.*|[ \t]*)(?:\n|$))*)/m);
  if (!match) return null;
  return "catalog:\n" + match[1];
}

/**
 * Extracts "allowBuilds" from a pnpm-workspace.yaml file
 * @param {string} yamlText  */
function extractAllowBuildsBlock(yamlText) {
  const match = yamlText.match(/^allowBuilds:[ \t]*\n((?:[ \t]+\S.*\n?)*)/m);
  if (!match) return null;
  return "allowBuilds:\n" + match[1];
}

/**
 * Collects workspace packages that are `workspace:*` deps of the direct workspace
 * deps of @vortex/main. These must be listed in dist/pnpm-workspace.yaml so that
 * pnpm can resolve nested `workspace:*` references when installing file: packages.
 * @param {Record<string, string>} workspacePackageMap
 * @returns {Promise<Set<string>>} absolute package directory paths
 */
async function collectNeededWorkspacePkgs(workspacePackageMap) {
  const mainRawJSON = await readFile(MAIN_PACKAGE_PATH, "utf8");
  const mainPkg = JSON.parse(mainRawJSON);
  const allMainDeps = {
    ...mainPkg.dependencies,
    ...mainPkg.peerDependencies,
  };

  // Seed the queue with direct workspace deps of @vortex/main
  const queue = [];
  for (const [name, version] of Object.entries(allMainDeps)) {
    if (
      typeof version === "string" &&
      version.startsWith("workspace:") &&
      workspacePackageMap[name]
    ) {
      queue.push(workspacePackageMap[name]);
    }
  }

  const needed = new Set();
  const visited = new Set();

  while (queue.length > 0) {
    const pkgDir = queue.shift();
    if (visited.has(pkgDir)) continue;
    visited.add(pkgDir);

    try {
      const pkgJsonPath = resolve(pkgDir, "package.json");
      const raw = await readFile(pkgJsonPath, "utf8");
      const pkg = JSON.parse(raw);
      const allDeps = {
        ...(pkg.dependencies ?? {}),
        ...(pkg.peerDependencies ?? {}),
      };

      for (const [name, version] of Object.entries(allDeps)) {
        if (
          typeof version === "string" &&
          version.startsWith("workspace:") &&
          workspacePackageMap[name]
        ) {
          const depDir = workspacePackageMap[name];
          needed.add(depDir);
          queue.push(depDir);
        }
      }
    } catch {
      // Skip packages whose package.json cannot be read
    }
  }

  return needed;
}

/** Prepares all PNPM related files */
async function preparePNPM(rawWorkspaceYaml, neededWorkspaceDirs) {
  const npmrc = ["node-linker=hoisted", "shamefully-hoist=true"].join("\n");
  await writeFile(resolve(DIST_DIR, ".npmrc"), npmrc);
  console.log("✔  Created build/.npmrc");

  const allowBuilds = extractAllowBuildsBlock(rawWorkspaceYaml);
  const catalog = extractCatalogBlock(rawWorkspaceYaml);
  const overrides = extractOverridesBlock(rawWorkspaceYaml);

  // Emit a packages: section so pnpm can resolve workspace:* refs in file: deps.
  // Without this, any workspace package that depends on another workspace package
  // via workspace:* will fail with ERR_PNPM_WORKSPACE_PKG_NOT_FOUND in the dist context.
  let packagesSection = "";
  if (neededWorkspaceDirs && neededWorkspaceDirs.size > 0) {
    const lines = [...neededWorkspaceDirs]
      .map((absPath) => `  - ${relative(DIST_DIR, absPath)}`)
      .join("\n");
    packagesSection = `packages:\n${lines}\n\n`;
  }

  const minimalYaml =
    packagesSection + (overrides ? overrides + "\n" : "") + catalog + "\n" + allowBuilds + "\n";

  await writeFile(resolve(DIST_DIR, "pnpm-workspace.yaml"), minimalYaml);
  console.log("✔  Created build/pnpm-workspace.yaml");
=======
async function prepareWin() {
  const tempDir = resolve(MAIN_DIR, "temp");
  await downloadFile(
    "https://aka.ms/vs/17/release/vc_redist.x64.exe",
    resolve(tempDir, "VC_redist.x64.exe"),
  );
  await downloadFile(
    "https://aka.ms/dotnet/9.0/windowsdesktop-runtime-win-x64.exe",
    resolve(tempDir, "windowsdesktop-runtime-win-x64.exe"),
  );
>>>>>>> v2.1.0
}

async function main() {
  const json = await readFile(MAIN_PACKAGE_PATH, "utf8");
  const mainPkg = JSON.parse(json);

<<<<<<< HEAD
  await createMinimalPackageJson(workspacePackageMap, catalog);
  const neededWorkspaceDirs = await collectNeededWorkspacePkgs(workspacePackageMap);
  await preparePNPM(rawWorkspaceYaml, neededWorkspaceDirs);
=======
  mainPkg["name"] = "Vortex";
  mainPkg["main"] = mainPkg.main.replace(/^build\//, "");
  mainPkg["version"] = process.env.VORTEX_VERSION || "1.0.0";

  // NOTE(erri120): this is the minimal amount of bullshit required to get the piece of shit software called "electron-builder" to work with PNPM.
  const nodeModulesDir = resolve(MAIN_DIR, "node_modules");
  mainPkg.dependencies = await resolveDepVersions(mainPkg.dependencies, nodeModulesDir);
  mainPkg.devDependencies = await resolveDepVersions(mainPkg.devDependencies, nodeModulesDir);

  await writeFile(DIST_PACKAGE_PATH, JSON.stringify(mainPkg, null, 2) + "\n", "utf8");

  if (process.platform === "win32") {
    await prepareWin();
  }
>>>>>>> v2.1.0
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
