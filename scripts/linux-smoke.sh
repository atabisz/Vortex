#!/usr/bin/env bash
# Linux fork smoke test — the post-merge gate.
#
# Executes the binary probes from VORTEX-LINUX-MERGE-PLAYBOOK.md.
# Each section here mirrors a numbered section in the playbook.
#
# Exit codes:
#   0 — all probes passed; merge can ship
#   1 — at least one probe failed; escalate to GSD-debug
#
# Usage:
#   bash scripts/linux-smoke.sh           # human-readable
#   bash scripts/linux-smoke.sh --quiet   # only summary line + exit code
#   bash scripts/linux-smoke.sh --json    # machine-readable for CI

set -uo pipefail

QUIET=false
JSON=false
for arg in "$@"; do
  case "$arg" in
    --quiet) QUIET=true ;;
    --json)  JSON=true; QUIET=true ;;
    -h|--help)
      sed -n '2,16p' "$0" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
  esac
done

cd "$(dirname "$0")/.." || exit 2

PASS=0
FAIL=0
RESULTS=()

probe() {
  local name="$1"
  local status="$2"
  local detail="${3:-}"
  if [[ "$status" == "PASS" ]]; then
    PASS=$((PASS + 1))
    $QUIET || printf '  \033[32m✓\033[0m %s\n' "$name"
  else
    FAIL=$((FAIL + 1))
    $QUIET || printf '  \033[31m✗\033[0m %s — %s\n' "$name" "$detail"
  fi
  RESULTS+=("$(printf '{"probe":"%s","status":"%s","detail":"%s"}' "$name" "$status" "$detail")")
}

section() {
  $QUIET || printf '\n\033[1m§%s — %s\033[0m\n' "$1" "$2"
}

# §1 — Platform guards on extension build scripts
section 1 "Platform guards"
inline_guards=$(grep -l "node -e.*process.platform" extensions/*/package.json extensions/games/*/package.json 2>/dev/null || true)
if [[ -z "$inline_guards" ]]; then
  probe "no inline node -e process.platform guards" PASS
else
  probe "no inline node -e process.platform guards" FAIL "found in: $(echo "$inline_guards" | tr '\n' ' ')"
fi

[[ -f extensions/skip-on-windows.mjs ]] \
  && probe "skip-on-windows.mjs sentinel exists" PASS \
  || probe "skip-on-windows.mjs sentinel exists" FAIL "missing"
[[ -f extensions/skip-on-linux.mjs ]] \
  && probe "skip-on-linux.mjs sentinel exists" PASS \
  || probe "skip-on-linux.mjs sentinel exists" FAIL "missing"

# §2 — Webpack externals allowlist for winapi-bindings
section 2 "winapi-bindings allowlist"
if grep -q "winapi-bindings" src/renderer/webpack.config.cjs 2>/dev/null; then
  probe "winapi-bindings in nodeExternals allowlist" PASS
else
  probe "winapi-bindings in nodeExternals allowlist" FAIL "not found in src/renderer/webpack.config.cjs"
fi

# §2.5 — rolldown.base.mjs alias param + linuxAlias wiring (winapi-shim swap)
section 2.5 "rolldown winapi-shim alias"
if grep -qE "^\s*alias\s*=\s*undefined" rolldown.base.mjs 2>/dev/null \
   && grep -qF '...(alias !== undefined && { resolve: { alias } })' rolldown.base.mjs 2>/dev/null; then
  probe "createConfig keeps 6th alias param + conditional spread" PASS
else
  probe "createConfig keeps 6th alias param + conditional spread" FAIL "rolldown.base.mjs missing alias param or spread"
fi
if grep -q "linuxAlias" src/main/build.mjs 2>/dev/null; then
  probe "build.mjs passes linuxAlias to createConfig" PASS
else
  probe "build.mjs passes linuxAlias to createConfig" FAIL "linuxAlias not wired in src/main/build.mjs"
fi

# §3 — LOOT call-site casing
# gamebryo-plugin-management moved into core in upstream 2.8 (extension deleted), so
# the probe follows it to src/renderer/src/extensions/gamebryo_plugin_management/.
section 3 "LOOT filePath usage"
AUTOSORT=src/renderer/src/extensions/gamebryo_plugin_management/autosort.ts
if [[ ! -f "$AUTOSORT" ]]; then
  probe "autosort.ts at core path" FAIL "$AUTOSORT missing — upstream moved it again; update this probe"
else
  if grep -q 'map((id) => path.basename(pluginList\[id\].filePath))' "$AUTOSORT"; then
    probe "loadPlugins gets real on-disk filenames" PASS
  else
    probe "loadPlugins gets real on-disk filenames" FAIL "loadPlugins is fed toPluginId()/lower-cased ids — ext4 ghost-probe error returns"
  fi
  for call in getPluginMetadata getPlugin; do
    if grep -q "loot\.$call(lootKey)" "$AUTOSORT"; then
      probe "$call uses lootKey (preserved case)" PASS
    else
      probe "$call uses lootKey (preserved case)" FAIL "$call called with lower-cased pluginName"
    fi
  done
fi

# Counts hits without tripping the `grep -c returns 1 on zero` exit path.
# Returns plain integer; 0 if file is absent.
count_hits() {
  local pattern="$1"
  local file="$2"
  [[ -f "$file" ]] || { echo 0; return; }
  # grep -c prints the count to stdout AND exits 1 when zero matches; ignore exit.
  local n
  n=$(grep -cE "$pattern" "$file" 2>/dev/null) || true
  echo "${n:-0}"
}

# §4 — Transfer-path platform guard (NEGATIVE — must NOT be present)
section 4 "transferPath.ts win32 guard"
hits=$(count_hits "platform !== \"win32\"|UnsupportedOperatingSystem" "src/renderer/src/util/transferPath.ts")
if [[ "$hits" -eq 0 ]]; then
  probe "no win32-only reject in transferPath.ts" PASS
else
  probe "no win32-only reject in transferPath.ts" FAIL "found $hits guard line(s)"
fi

# §5 — Bundled plugins populated (only meaningful post-build; skip otherwise)
section 5 "bundledPlugins populated"
if [[ -d src/main/build/bundledPlugins ]]; then
  count=$(ls src/main/build/bundledPlugins 2>/dev/null | wc -l)
  if [[ "$count" -ge 100 ]]; then
    probe "bundledPlugins has >=100 entries" PASS
  else
    probe "bundledPlugins has >=100 entries" FAIL "only $count entries"
  fi
else
  $QUIET || printf '  \033[33m·\033[0m bundledPlugins skipped (no build artefact)\n'
fi

# §6 — Staging-integrity guard in doDownload
section 6 "stagingDirHasFiles guard"
hits=$(count_hits "stagingDirHasFiles" "src/renderer/src/extensions/mod_management/InstallManager.ts")
if [[ "$hits" -ge 2 ]]; then
  probe "stagingDirHasFiles import + call (>=2 hits)" PASS
else
  probe "stagingDirHasFiles import + call (>=2 hits)" FAIL "only $hits hits"
fi
[[ -f src/renderer/src/extensions/mod_management/util/stagingIntegrity.ts ]] \
  && probe "stagingIntegrity.ts sibling exists" PASS \
  || probe "stagingIntegrity.ts sibling exists" FAIL "missing"

# §7 — Four-fix backslash/case cluster
section 7 "Four-fix backslash/case cluster"
hits=$(count_hits "normalizeBackslashPaths" "src/renderer/src/extensions/mod_management/InstallManager.ts")
if [[ "$hits" -ge 3 ]]; then
  probe "(a) normalizeBackslashPaths import + 2 calls (>=3 hits)" PASS
else
  probe "(a) normalizeBackslashPaths import + 2 calls (>=3 hits)" FAIL "only $hits hits"
fi
[[ -f src/renderer/src/extensions/mod_management/util/normalizeBackslashPaths.ts ]] \
  && probe "(a) normalizeBackslashPaths.ts sibling exists" PASS \
  || probe "(a) normalizeBackslashPaths.ts sibling exists" FAIL "missing"

hits=$(count_hits "mergeCaseConflictingDirs" "src/renderer/src/extensions/mod_management/InstallManager.ts")
if [[ "$hits" -ge 3 ]]; then
  probe "(b) mergeCaseConflictingDirs import + 2 calls (>=3 hits)" PASS
else
  probe "(b) mergeCaseConflictingDirs import + 2 calls (>=3 hits)" FAIL "only $hits hits"
fi
[[ -f src/renderer/src/extensions/mod_management/util/mergeCaseConflictingDirs.ts ]] \
  && probe "(b) mergeCaseConflictingDirs.ts sibling exists" PASS \
  || probe "(b) mergeCaseConflictingDirs.ts sibling exists" FAIL "missing"

# Pattern looks for source.replaceAll("\\", "/") — fixed-string grep avoids escape gymnastics.
hits=$(grep -cF 'replaceAll("\\", "/")' src/renderer/src/extensions/mod_management/InstallManager.ts 2>/dev/null || true)
hits="${hits:-0}"
if [[ "$hits" -ge 2 ]]; then
  probe "(c) backslash replaceAll source/dest (>=2 hits)" PASS
else
  probe "(c) backslash replaceAll source/dest (>=2 hits)" FAIL "only $hits hits"
fi

hits=$(count_hits "resolvePathCase\(tempPath" "src/renderer/src/extensions/mod_management/InstallManager.ts")
if [[ "$hits" -ge 1 ]]; then
  probe "(d) resolvePathCase(tempPath) in extractArchive" PASS
else
  probe "(d) resolvePathCase(tempPath) in extractArchive" FAIL "no hits"
fi

# §8 — Proton launch logic in StarterInfo
section 8 "Proton launch logic"
for sym in isPathPrefix shouldRunWithProton runToolWithProton; do
  if grep -q "$sym" src/renderer/src/util/StarterInfo.ts 2>/dev/null; then
    probe "$sym in StarterInfo.ts" PASS
  else
    probe "$sym in StarterInfo.ts" FAIL "not found"
  fi
done
# buildProtonEnvironment must carry both the fork's SteamAppId/SteamGameId
# (Steamworks init) and upstream's Steam overlay LD_PRELOAD — v2.7.1 conflicted here.
for sym in SteamAppId SteamGameId LD_PRELOAD; do
  if grep -q "$sym" src/renderer/src/util/linux/proton.ts 2>/dev/null; then
    probe "$sym in proton.ts buildProtonEnvironment" PASS
  else
    probe "$sym in proton.ts buildProtonEnvironment" FAIL "not found"
  fi
done

# §9 — Steam library path resolution reads ALL roots
section 9 "Steam multi-root resolution"
for sym in findAllLinuxSteamPaths steamRoots; do
  if grep -q "$sym" src/renderer/src/util/Steam.ts 2>/dev/null; then
    probe "$sym in Steam.ts" PASS
  else
    probe "$sym in Steam.ts" FAIL "not found"
  fi
done

# §14 — dart-sass not in beforePack deletion list
section 14 "dart-sass survives beforePack"
if grep -qE '^\s*"sass",' src/main/electron-builder.config.cjs 2>/dev/null; then
  probe "sass NOT in buildOnlyNative deletion list" FAIL "sass listed in src/main/electron-builder.config.cjs beforePack — startup crash"
else
  probe "sass NOT in buildOnlyNative deletion list" PASS
fi

# §15 — Renderer webpack output aligns with electron-builder pack dir
section 15 "renderer.js packs into asar"
if grep -qE 'path\.resolve\(__dirname,\s*"\.\.",\s*"main",\s*"build"\)' src/renderer/webpack.config.cjs 2>/dev/null; then
  probe "webpack writes renderer.js to src/main/build/" PASS
else
  probe "webpack writes renderer.js to src/main/build/" FAIL "webpack output path != src/main/build — renderer.js missing from app.asar, splash → blank window"
fi

# §16 — Linux packaging target builds AppImage + deb
section 16 "Linux target is AppImage + deb"
linux_target=$(awk '/^    linux: \{/{f=1} f && /target:/{print; exit}' src/main/electron-builder.config.cjs 2>/dev/null)
if [[ "$linux_target" == *'"AppImage"'* && "$linux_target" == *'"deb"'* ]]; then
  probe "electron-builder linux.target includes AppImage and deb" PASS
else
  probe "electron-builder linux.target includes AppImage and deb" FAIL "linux target is '${linux_target:-not found}' in src/main/electron-builder.config.cjs — release-linux.yml publishes no AppImage"
fi

# §17 — Linux keeps permission elevation (pkexec)
section 17 "Linux permission elevation"
n=$(count_hits 'process\.platform === "win32" \|\| process\.platform === "linux"' src/renderer/src/util/fs.ts)
if [[ "$n" -ge 3 ]]; then
  probe "fs.ts offers elevation on Linux at all 3 sites" PASS
else
  probe "fs.ts offers elevation on Linux at all 3 sites" FAIL "$n/3 — upstream fc0db1ad6 gates elevation to win32 only"
fi

# §18 — gamebryo plugin management Linux deltas (moved into core in 2.8)
section 18 "gamebryo plugin management (core)"
GBPM=src/renderer/src/extensions/gamebryo_plugin_management
if grep -q '"compatdata"' "$GBPM/util/gameSupport.ts" 2>/dev/null; then
  probe "appDataPath resolves the Proton prefix" PASS
else
  probe "appDataPath resolves the Proton prefix" FAIL "no compatdata branch in gameSupport.ts appDataPath"
fi
n=$(count_hits 'needsRestore' "$GBPM/util/PluginPersistor.ts")
if [[ "$n" -ge 3 ]] && grep -q 'foreign.detected && keys.length === 0' "$GBPM/util/PluginPersistor.ts"; then
  probe "PluginPersistor recovers a Proton plugins.txt reset" PASS
else
  probe "PluginPersistor recovers a Proton plugins.txt reset" FAIL "foreign-reset recovery missing ($n needsRestore hits)"
fi

# §19 — CI native rebuilds follow the installed Electron version
section 19 "No pinned Electron version in CI"
pinned=$(grep -nE -- '--target=[0-9]|electron/rebuild -f -v [0-9]' .github/workflows/*.yml 2>/dev/null | head -1)
if [[ -z "$pinned" ]]; then
  probe "workflows resolve ELECTRON_VERSION instead of pinning" PASS
else
  probe "workflows resolve ELECTRON_VERSION instead of pinning" FAIL "$pinned"
fi

# §11 — Deliberate test-runner divergences (NEGATIVE gates)
section 11 "Vitest-only renderer (no Jest scaffolding)"
[[ ! -f src/renderer/jest.config.mjs ]] \
  && probe "no jest.config.mjs in renderer" PASS \
  || probe "no jest.config.mjs in renderer" FAIL "file present"
[[ ! -d src/renderer/src/__mocks__ ]] \
  && probe "no top-level __mocks__/ in renderer" PASS \
  || probe "no top-level __mocks__/ in renderer" FAIL "dir present"
[[ ! -d src/renderer/src/__tests__ ]] \
  && probe "no top-level __tests__/ in renderer" PASS \
  || probe "no top-level __tests__/ in renderer" FAIL "dir present"
[[ ! -f src/renderer/src/setupTests.js ]] \
  && probe "no setupTests.js (Jest+enzyme)" PASS \
  || probe "no setupTests.js (Jest+enzyme)" FAIL "file present"
nested=$(find src/renderer/src -type d -name __mocks__ -print -quit 2>/dev/null)
[[ -z "$nested" ]] \
  && probe "no nested __mocks__/ dirs in renderer" PASS \
  || probe "no nested __mocks__/ dirs in renderer" FAIL "found: $nested"

# Summary
TOTAL=$((PASS + FAIL))
if $JSON; then
  printf '{"total":%d,"passed":%d,"failed":%d,"probes":[%s]}\n' \
    "$TOTAL" "$PASS" "$FAIL" "$(IFS=,; echo "${RESULTS[*]}")"
else
  echo
  if [[ "$FAIL" -eq 0 ]]; then
    printf '\033[1;32m✓ Linux smoke: %d/%d probes passed — sync clean\033[0m\n' "$PASS" "$TOTAL"
  else
    printf '\033[1;31m✗ Linux smoke: %d/%d probes passed (%d failed) — escalate to GSD-debug\033[0m\n' \
      "$PASS" "$TOTAL" "$FAIL"
    printf '\033[33m  See VORTEX-LINUX-MERGE-PLAYBOOK.md for context on each probe.\033[0m\n'
  fi
fi

[[ "$FAIL" -eq 0 ]] && exit 0 || exit 1
