# External Integrations

**Analysis Date:** 2026-03-30

## APIs & External Services

**Nexus Mods API:**
- Nexus Mods REST API for mod downloads, user profiles, endorsements, collections
  - SDK/Client: `@nexusmods/nexus-api` (custom fork at git+https://github.com/Nexus-Mods/node-nexus-api#4192c0c)
  - Auth: OAuth 2.0 token (stored in Redux state in `src/renderer/src/extensions/nexus_integration/`)
  - Endpoints accessed via: `src/renderer/src/extensions/nexus_integration/util/` (graph queries, endorsements, category retrieval)

**GitHub API:**
- Updates via GitHub Releases (Electron Builder integration)
  - Provider: electron-builder configured in `src/main/electron-builder.config.json`
  - Owner: Nexus-Mods, Repo: Vortex
  - Purpose: Automated release publishing and app updates

**Game Store APIs:**
- Steam API (via `extensions/gameinfo-steam/`)
- GOG API (via `extensions/gamestore-gog/`)
- Origin/EA App (via `extensions/gamestore-origin/`)
- Uplay/Ubisoft (via `extensions/gamestore-uplay/`)
- Xbox Game Pass (via `extensions/gamestore-xbox/`)
  - Purpose: Game discovery, launch, and runtime detection

**Third-Party APIs:**
- Epic Games Launcher detection (`src/renderer/src/util/EpicGamesLauncher.ts`)
- RSS Feed Parsing: feedparser 2.2.9 for mod update notifications

## Data Storage

**Databases:**
- DuckDB (`@duckdb/node-api 1.5.1-r.1`) - In-memory SQL query engine with level_pivot extension
  - Purpose: Complex relational queries on persistent state (replaces raw LevelDB queries)
  - Connection: `src/main/src/store/DuckDBSingleton.ts` (shared singleton instance)
  - Storage driver: `src/main/src/store/LevelPersist.ts` (uses DuckDB + LevelDB backend for persistence)

- LevelDB (levelup 4.4.0 + leveldown 5.6.0) - Key-value store
  - Purpose: Redux state persistence (being phased out for DuckDB)
  - Connection: via LevelPersist using DuckDB connections
  - Initialization: `src/main/src/store/mainPersistence.ts`

- In-Memory Redux Store - Runtime state management
  - Location: Actions in `src/actions/`, reducers in `src/reducers/`
  - Persistence mechanism: Redux persist via `src/main/src/store/ReduxPersistorIPC.ts`

**File Storage:**
- Local filesystem only (modular install directory, downloads directory, staging area)
- Paths: Managed by `@vortex/paths` and `@vortex/paths-node` packages
- Archives: 7-Zip, BA2, BSA formats extracted to disk

**Caching:**
- In-memory module cache (Redux selectors with reselect 4.1.7)
- Memoization via react-redux connect and reselect
- No external caching service (Redis, Memcached)

## Authentication & Identity

**Auth Provider:**
- Custom OAuth 2.0 integration with Nexus Mods
  - Implementation: `src/renderer/src/extensions/nexus_integration/util/oauth.ts`
  - Flow: Authorization code grant via NXM:// protocol callbacks
  - Token storage: Redux session state + persistent store
  - Token refresh: Automatic via Nexus API client

**Local User Session:**
- Session state: Redux store at `session` slice
- Actions: `src/renderer/src/extensions/nexus_integration/actions/session.ts`
- OAuth state management: `setOauthPending`, `setLoginId` actions

**JWT Support:**
- jsonwebtoken 9.0.0 - Token creation and verification
- Usage: Internal token validation (see `src/main/src/` and extension auth flows)

## Monitoring & Observability

**Error Tracking:**
- Built-in error handling in `src/renderer/src/util/errorHandling.ts`
- Native error capture via `crash-dump` module
- No external error reporting service configured (not detected)

**Logs:**
- Winston 2.4.3 - Structured logging
- Renderer: Uses window.api logging interface
- Main: Direct winston instance
- Log files: Stored in user's Vortex app directory (typically `%APPDATA%/Vortex/` on Windows)

**Tracing & Observability:**
- OpenTelemetry SDK integration (v1.30.0)
  - Trace exporter: OTLP HTTP (`@opentelemetry/exporter-trace-otlp-http 0.57.0`)
  - Exporter endpoint: Configurable (environment or config)
  - Setup: `src/renderer/src/telemetry/setup.ts` and `src/main/src/telemetry/`
  - Span processor: Custom ForwardingSpanProcessor in renderer, RingBufferSpanProcessor in main
  - Async context: AsyncLocalStorageContextManager with Bluebird promise patching

**Analytics:**
- Mixpanel 2.71.0 - Event telemetry
- Usage: User event tracking (see `src/main/` for event handlers)
- Configuration: Environment-based API key

## CI/CD & Deployment

**Hosting:**
- GitHub Releases - Distribution channel for Electron app
- NSIS Installer - Windows deployment (via electron-builder)
- Linux Zip - Linux distribution

**CI Pipeline:**
- GitHub Actions - Build and release automation (detected via `isGitHubCI` check in vitest config)
- Test reporters: JUnit XML + GitHub Actions reporter
- Coverage: v8 coverage with Cobertura output

**Release/Publishing:**
- Electron Builder 24.13.3 with code signing
  - Windows: NSIS installer with Comodoca RFC3161 timestamp server
  - Private key: Loaded from `src/main/sign.cjs`
  - Publisher: Black Tree Gaming Limited/Ltd

**Staging:**
- Development build: `src/main/out/` (via `pnpm run build`)
- Production build: `src/main/dist/` (via `pnpm run dist`)
- Assets: Compiled to respective directories via `InstallAssets.mjs`

## Environment Configuration

**Required env vars:**
- `NODE_ENV` - Set to `development` or `production` by build scripts
- `CI` - Detected for CI/CD workflows
- `GITHUB_ACTIONS` - GitHub Actions detection for test reporters
- Nexus Mods API credentials (not stored in code; handled at runtime)
- OpenTelemetry exporter endpoint (if tracing is enabled)

**Optional env vars:**
- Mixpanel API key (for analytics)
- Debug flags (logging levels, feature toggles)

**Secrets location:**
- `.env` file (project root, not committed; see `.gitignore`)
- Electron signing key: `src/main/sign.cjs` (private, not committed)
- OAuth tokens: Persisted in encrypted Redux store
- No .npmrc or credentials in git (verified; using pnpm catalog for dependency resolution)

## Webhooks & Callbacks

**Incoming:**
- NXM:// Protocol Handler - Nexus Mods URI scheme for deep linking
  - Routes: `nxm://oauth/callback` (OAuth completion)
  - Handler: `src/renderer/src/extensions/nexus_integration/NXMUrl.ts`
  - Registration: Electron app registers as protocol handler on startup

- IPC Channels (Electron main ↔ renderer)
  - Telemetry: `telemetry.forwardSpan` (span forwarding)
  - Persistence: Redux persist, state sync, query responses
  - API calls: Window.api namespace for main-process calls

**Outgoing:**
- GitHub Release API - Publish releases during packaging
- Mixpanel Events - Analytics tracking (if enabled)
- OpenTelemetry HTTP - Trace data export (if tracing enabled)
- Nexus Mods API - Downloads, metadata queries, user actions

## Secondary Extensions (Game Integrations)

**Game Store Connectors:**
- Steam: `extensions/gameinfo-steam/`
- GOG: `extensions/gamestore-gog/`
- Epic Games: `extensions/gamestore-epic/` (launcher detection)
- Origin/EA App: `extensions/gamestore-origin/`
- Uplay: `extensions/gamestore-uplay/`
- Xbox Game Pass: `extensions/gamestore-xbox/`

**Game-Specific Extensions:**
- `extensions/games/game-*/` - 100+ individual game mod format handlers
- Examples: Skyrim SE, Fallout 4, Cyberpunk 2077, Baldur's Gate 3, etc.
- Purpose: Mod type detection, deployment validation, runtime integration

**Modding Framework Support:**
- FNIS Integration (Skyrim foot IK)
- ENB/ReShade (post-processing)
- Script Extender (SKSE, F4SE, MSSE) error checking
- BepinEx mod loader support
- DinInput wrapper integration
- FOMOD Installer (IPC-based native module: `@nexusmods/fomod-installer-native`)

---

*Integration audit: 2026-03-30*
