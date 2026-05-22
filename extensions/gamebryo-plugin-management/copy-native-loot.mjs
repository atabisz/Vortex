#!/usr/bin/env node
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const dist = "dist";
if (!fs.existsSync(dist)) {
  fs.mkdirSync(dist, { recursive: true });
}

const lootBase = "./node_modules/loot";
const isLinux = process.platform === "linux";

const files = [
  `${lootBase}/build/Release/node-loot.node`,
  `${lootBase}/async.js`,
  ...(isLinux
    ? [`${lootBase}/loot_api/libloot.so.0`, "./src/libloot_wstring_stub.so"]
    : [`${lootBase}/loot_api/libloot.dll`]),
];

const missing = files.filter((f) => !fs.existsSync(f));
if (missing.length > 0) {
  const allInDist = missing.every((f) => fs.existsSync(path.join(dist, path.basename(f))));
  if (allInDist) {
    console.log("Source binaries missing but dist/ already has them — skipping copy");
    process.exit(0);
  }
  console.error("Missing native files:");
  for (const f of missing) console.error(`  - ${f}`);
  process.exit(1);
}

for (const file of files) {
  const basename = path.basename(file);
  fs.copyFileSync(file, path.join(dist, basename));
}

// Rewrite async.js to load node-loot from the same directory
const asyncPath = path.join(dist, "async.js");
let content = fs.readFileSync(asyncPath, "utf8");
content = content.replace("./build/Release/node-loot", "./node-loot");
fs.writeFileSync(asyncPath, content);
