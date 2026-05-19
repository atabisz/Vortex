#!/usr/bin/env node

<<<<<<< HEAD
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
=======
import fs from "node:fs";
import { execSync } from "node:child_process";
>>>>>>> v2.0.1

const args = process.argv.slice(2);

if (args.length === 0) {
  console.error("Usage: node copy-native.mjs <file1> <file2> ...");
  process.exit(1);
}

const files = args.filter((arg) => !arg.startsWith("-") && !/^\d+$/.test(arg));
const copyFlags =
<<<<<<< HEAD
  args.filter((arg) => arg.startsWith("-") || /^\d+$/.test(arg)).join(" ") || "-u 1 -f";
=======
  args.filter((arg) => arg.startsWith("-") || /^\d+$/.test(arg)).join(" ") ||
  "-u 1 -f";
>>>>>>> v2.0.1

const missingFiles = [];

for (const file of files) {
  if (!fs.existsSync(file)) {
    missingFiles.push(file);
  }
}

if (missingFiles.length > 0) {
<<<<<<< HEAD
  const destDir = "dist";
  const allInDist = missingFiles.every((f) =>
    fs.existsSync(path.join(destDir, path.basename(f))),
  );
  if (allInDist) {
    console.log("Source binaries missing but dist/ already has them — skipping copy");
    process.exit(0);
  }
=======
>>>>>>> v2.0.1
  console.error("Missing native files:");
  for (const file of missingFiles) {
    console.error(`  - ${file}`);
  }
  process.exit(1);
}

const destDir = "dist";
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

const fileList = files.join(" ");
const command = `copyfiles ${copyFlags} ${fileList} ${destDir}`;

try {
  execSync(command, { stdio: "inherit" });
} catch (err) {
  console.error("Failed to copy native files");
  process.exit(1);
}
