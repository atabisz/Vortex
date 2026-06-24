#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const dist = "dist";
const lootBase = "./node_modules/loot";
const isLinux = process.platform === "linux";

if (!fs.existsSync(dist)) {
  fs.mkdirSync(dist, { recursive: true });
}

const files = [
  `${lootBase}/build/Release/node-loot.node`,
  `${lootBase}/async.js`,
  ...(isLinux
    ? [`${lootBase}/loot_api/libloot.so.0`, "./src/libloot_wstring_stub.so"]
    : [`${lootBase}/loot_api/libloot.dll`]),
];

const missing = files.filter((file) => !fs.existsSync(file));
if (missing.length > 0) {
  const allInDist = missing.every((file) => fs.existsSync(path.join(dist, path.basename(file))));
  if (!allInDist) {
    console.error("Missing native files:");
    for (const file of missing) {
      console.error(` - ${file}`);
    }
    process.exit(1);
  }
}

for (const file of files) {
  if (fs.existsSync(file)) {
    fs.copyFileSync(file, path.join(dist, path.basename(file)));
  }
}

function replaceOrFail(file, find, replacement) {
  const oldContent = fs.readFileSync(file, "utf8");
  const newContent = oldContent.replace(find, replacement);
  if (newContent === oldContent) {
    console.error(`Failed to rewrite ${file}: pattern not found`);
    process.exit(1);
  }
  fs.writeFileSync(file, newContent);
}

const asyncPath = path.join(dist, "async.js");
replaceOrFail(asyncPath, "./build/Release/node-loot", "./node-loot");

if (isLinux) {
  replaceOrFail(
    asyncPath,
    "const client = net.connect(`\\\\\\\\?\\\\pipe\\\\loot-ipc-${process.argv[2]}`, (arg) => {",
    "const lootIpcPath = process.platform === 'linux' ? `/tmp/loot-ipc-${process.argv[2]}` : `\\\\\\\\?\\\\pipe\\\\loot-ipc-${process.argv[2]}`;\nconst client = net.connect(lootIpcPath, (arg) => {",
  );

  replaceOrFail(
    path.join(dist, "index.cjs"),
    "this.ipc.listen(`\\\\\\\\?\\\\pipe\\\\loot-ipc-${this.id}`, () => {",
    "this.ipc.listen(process.platform === 'linux' ? `/tmp/loot-ipc-${this.id}` : `\\\\\\\\?\\\\pipe\\\\loot-ipc-${this.id}`, () => {",
  );
}
