import { spawn, type ChildProcess } from "node:child_process";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

const READY_MARKER = "[MAIN] window ready";
const FATAL_MARKERS = [
  "Duplicate @vortex/shared error module detected in this process",
  "[MAIN] quitting with exception",
  "[MAIN] unrecoverable error",
];
const STARTUP_TIMEOUT_MS = 60_000;
const POLL_INTERVAL_MS = 250;

interface LaunchTarget {
  command: string;
  args: string[];
  env: NodeJS.ProcessEnv;
}

function parseTarget(args: string[]): LaunchTarget {
  const appImageIndex = args.indexOf("--appimage");
  if (appImageIndex !== -1) {
    const appImage = args[appImageIndex + 1];
    if (!appImage) {
      throw new Error("--appimage requires a path");
    }

    return {
      command: path.resolve(appImage),
      args: ["--no-sandbox"],
      env: { APPIMAGE_EXTRACT_AND_RUN: "1" },
    };
  }

  return {
    command: process.platform === "win32" ? "pnpm.cmd" : "pnpm",
    args: ["--dir", "src/main", "exec", "electron", ".", "--no-sandbox"],
    env: {},
  };
}

async function terminateChild(child: ChildProcess): Promise<void> {
  if (child.pid === undefined || child.exitCode !== null) return;

  try {
    process.kill(-child.pid, "SIGTERM");
  } catch {
    child.kill("SIGTERM");
  }

  await Promise.race([
    new Promise<void>((resolve) => child.once("exit", () => resolve())),
    new Promise<void>((resolve) => setTimeout(resolve, 2_000)),
  ]);

  if (child.exitCode === null) {
    try {
      process.kill(-child.pid, "SIGKILL");
    } catch {
      child.kill("SIGKILL");
    }
  }
}

async function readIfPresent(filePath: string): Promise<string> {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return "";
    throw err;
  }
}

async function main(): Promise<void> {
  if (process.platform !== "linux") {
    console.log("Electron startup smoke is Linux-only; skipping.");
    return;
  }

  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "vortex-startup-smoke-"));
  const userData = path.join(tempRoot, "user-data");
  const appData = path.join(tempRoot, "app-data");
  await Promise.all([
    fs.mkdir(userData),
    fs.mkdir(path.join(appData, "@vortex", "main"), { recursive: true }),
    fs.mkdir(path.join(appData, "Vortex"), { recursive: true }),
  ]);

  const target = parseTarget(process.argv.slice(2));
  console.log(`Launching Electron startup smoke: ${target.command} ${target.args.join(" ")}`);
  const stdoutChunks: Buffer[] = [];
  const stderrChunks: Buffer[] = [];
  const child = spawn("xvfb-run", ["-a", target.command, ...target.args], {
    cwd: path.resolve(import.meta.dirname, ".."),
    detached: true,
    env: {
      ...process.env,
      ...target.env,
      ELECTRON_RUN_AS_NODE: "",
      NODE_OPTIONS: "",
      VORTEX_E2E: "1",
      VORTEX_E2E_HEADLESS: "1",
      ELECTRON_USERDATA: userData,
      ELECTRON_APPDATA: appData,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  child.stdout?.on("data", (chunk: Buffer) => stdoutChunks.push(chunk));
  child.stderr?.on("data", (chunk: Buffer) => stderrChunks.push(chunk));

  const logPath = path.join(userData, "vortex.log");
  const deadline = Date.now() + STARTUP_TIMEOUT_MS;
  let ready = false;

  try {
    while (Date.now() < deadline) {
      const log = await readIfPresent(logPath);
      const combined = `${Buffer.concat(stdoutChunks).toString("utf8")}\n${Buffer.concat(stderrChunks).toString("utf8")}\n${log}`;

      const fatalMarker = FATAL_MARKERS.find((marker) => combined.includes(marker));
      if (fatalMarker !== undefined) {
        throw new Error(`startup hit fatal marker: ${fatalMarker}\n${combined.slice(-8_000)}`);
      }
      if (log.includes(READY_MARKER)) {
        ready = true;
        break;
      }
      if (child.exitCode !== null) {
        throw new Error(
          `Electron exited before startup completed (exit ${child.exitCode})\n${combined.slice(-8_000)}`,
        );
      }

      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    }

    if (!ready) {
      const log = await readIfPresent(logPath);
      throw new Error(
        `Electron did not reach ${READY_MARKER} within ${STARTUP_TIMEOUT_MS}ms\n${log.slice(-8_000)}`,
      );
    }
  } finally {
    console.log("Stopping Electron smoke process.");
    await terminateChild(child);
    await fs.rm(tempRoot, { recursive: true, force: true });
  }

  console.log(`Electron startup smoke passed: ${READY_MARKER}`);
}

const keepAlive = setInterval(() => undefined, 1_000);
void main()
  .catch((err: unknown) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => clearInterval(keepAlive));
