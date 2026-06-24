// scripts/verify-asar-unpacked.cjs
// Post-package smoke test: assert that all required paths exist inside
// app.asar.unpacked after `pnpm run package:nosign` completes.
//
// Converts "it worked once" into a regression gate — if a future change
// accidentally removes an asarUnpack entry or breaks the beforePack hook,
// this script fails the build with a clear error rather than silently
// shipping a broken package.
//
// Run after electron-builder:
//   node scripts/verify-asar-unpacked.cjs
//
// Exit codes:
//   0 — all required paths present
//   1 — one or more required paths missing (details printed to stderr)
"use strict";

const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const distDir = path.join(projectRoot, "dist");

// --- Locate the linux-unpacked staging directory ---
// electron-builder names it `linux-unpacked` or `linux-<arch>-unpacked`.
function findUnpackedDir(dist) {
    if (!fs.existsSync(dist)) {
        return null;
    }
    const entries = fs.readdirSync(dist, { withFileTypes: true });
    const dir = entries.find((e) => e.isDirectory() && e.name.endsWith("-unpacked"));
    return dir ? path.join(dist, dir.name) : null;
}

// Recursively collect all files matching a suffix under a root dir.
function findFilesWithSuffix(dir, suffix, results = []) {
    if (!fs.existsSync(dir)) return results;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            findFilesWithSuffix(full, suffix, results);
        } else if (entry.isFile() && entry.name.endsWith(suffix)) {
            results.push(full);
        }
    }
    return results;
}

const unpackedStaging = findUnpackedDir(distDir);
if (!unpackedStaging) {
    console.error(
        "ERROR: No *-unpacked directory found in dist/ — run `pnpm run package:nosign` first",
    );
    process.exit(1);
}

const asarUnpacked = path.join(unpackedStaging, "resources", "app.asar.unpacked");

if (!fs.existsSync(asarUnpacked)) {
    console.error(`ERROR: app.asar.unpacked not found at ${asarUnpacked}`);
    process.exit(1);
}

// --- Required directory paths (relative to app.asar.unpacked/) ---
const REQUIRED_DIRS = [
    "node_modules/modmeta-db",
    "node_modules/leveldown",
    "node_modules/levelup",
    "node_modules/encoding-down",
];

// --- Collect results ---
const failures = [];
const passes = [];

// 1. Check required directories
for (const rel of REQUIRED_DIRS) {
    const full = path.join(asarUnpacked, rel);
    if (fs.existsSync(full) && fs.statSync(full).isDirectory()) {
        passes.push(`  OK  ${rel}/`);
    } else {
        failures.push(`  MISSING  ${rel}/`);
    }
}

// 2. Assert at least one *.node binary exists anywhere in app.asar.unpacked
const nodeFiles = findFilesWithSuffix(asarUnpacked, ".node").map((f) =>
    path.relative(asarUnpacked, f),
);

if (nodeFiles.length === 0) {
    failures.push("  MISSING  **/*.node (no native binaries found in app.asar.unpacked)");
} else {
    passes.push(`  OK  *.node — ${nodeFiles.length} native binary(ies) found`);
    for (const f of nodeFiles) {
        passes.push(`         ${f}`);
    }
}

// 3. Assert renderer.js is bundled into app.asar itself.
// Failure mode: webpack writes renderer.js to a path electron-builder doesn't
// pack; index.html ships, splash shows for ~150ms, then the BrowserWindow stays
// blank with `Cannot find module './renderer.js'` from app.asar/index.html.
// Caught silently by upstream merges that swap webpack output to dist/out.
const asarFile = path.join(unpackedStaging, "resources", "app.asar");
const REQUIRED_ASAR_ENTRIES = [
    "renderer.js",
    "index.html",
    "main.cjs",
    "preload.cjs",
    "splash.html",
];
if (!fs.existsSync(asarFile)) {
    failures.push(`  MISSING  resources/app.asar at ${asarFile}`);
} else {
    try {
        const fd = fs.openSync(asarFile, "r");
        const sizeBuf = Buffer.alloc(4);
        fs.readSync(fd, sizeBuf, 0, 4, 12);
        const headerSize = sizeBuf.readUInt32LE(0);
        const headerBuf = Buffer.alloc(headerSize);
        fs.readSync(fd, headerBuf, 0, headerSize, 16);
        fs.closeSync(fd);
        // Trim trailing zero padding before JSON parse.
        let endIdx = headerBuf.length;
        while (endIdx > 0 && headerBuf[endIdx - 1] === 0) endIdx--;
        const header = JSON.parse(headerBuf.slice(0, endIdx).toString("utf8"));
        const rootKeys = Object.keys(header.files || {});
        for (const entry of REQUIRED_ASAR_ENTRIES) {
            if (rootKeys.includes(entry)) {
                passes.push(`  OK  app.asar contains ${entry}`);
            } else {
                failures.push(
                    `  MISSING  app.asar entry: ${entry} — webpack/rolldown output path likely diverged from electron-builder pack dir`,
                );
            }
        }
    } catch (err) {
        failures.push(`  ERROR  failed to parse app.asar header: ${err.message}`);
    }
}

// --- Report ---
console.log(`\nChecking: ${asarUnpacked}\n`);
for (const line of passes) {
    console.log(line);
}
if (failures.length > 0) {
    console.error("");
    for (const line of failures) {
        console.error(line);
    }
    console.error(`\nasar-unpacked verification FAILED — ${failures.length} path(s) missing`);
    process.exit(1);
}

console.log("\nasar-unpacked verification passed");
