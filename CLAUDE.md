@AGENTS.md

<!-- GSD:project-start source:PROJECT.md -->
## Project

**Vortex Linux Support — Phase 1: Boot on Linux**

Vortex is an Electron-based mod manager for Nexus Mods, currently Windows-only. This milestone ports it to Linux — starting with Phase 1: getting Vortex to launch and run on Linux without breaking the existing Windows build. The approach is surgical: platform-guarded additions, no large refactors, Windows CI stays green throughout.

**Core Value:** `pnpm run start` works on Linux without crashing — a developer can launch and use Vortex on a Linux machine.

### Constraints

- **Compatibility**: Windows build must never break — platform guards, not replacements
- **Diff size**: Prefer small, additive changes over refactors — no gutting existing modules
- **Dependencies**: No new runtime deps that affect Windows (Linux-only deps are fine)
- **FOMOD**: .NET 9 recompile path chosen — Wine wrapper explicitly rejected
- **Heroic Launcher**: Deferred to Phase 4 (not Phase 2)
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages
- TypeScript 5.9.3 - Core application code (main, renderer, shared, preload processes)
- JavaScript - Build configuration, tooling, and scripts
- SCSS 1.97.3 - Styling and Bootstrap theming
- CSS (Tailwind v4) - Modern utility-first styling via `src/stylesheets/tailwind-v4.css`
- HTML - Embedded in React components
- C++/C# - Native modules (separate Git repositories, managed via `scripts/manage-node-modules.js`)
## Runtime
- Node.js 22.22.0 (via Volta for toolchain management)
- Electron 39.8.0 - Desktop application framework
- pnpm 10.33.0 - Package manager with monorepo workspace support
- pnpm 10.33.0 - Strict lockfile enforced via `preinstall` script (`npx only-allow pnpm`)
- Lockfile: `pnpm-lock.yaml` (committed)
## Frameworks
- Electron 39.8.0 - Desktop application container (main + renderer + preload processes)
- React 16.12.0 - UI rendering in renderer process
- Redux 4.0.4 - State management (actions in `src/actions/`, reducers in `src/reducers/`)
- electron-redux - Shared Redux state between main and renderer processes
- Bootstrap SCSS 3.4.1 - Component design system (`react-bootstrap 0.33.0`)
- Tailwind CSS 4.1.17 - Utility-first CSS framework
- SASS 1.97.3 - Preprocessor for Bootstrap and custom styles
- Vitest 4.1.0 - Primary test runner (TypeScript projects)
- Jest 29.7.0 - Secondary test runner (React renderer: `src/renderer/jest.config.mjs`)
- Testing Library
- Enzyme 3.10.0 - Component inspection (legacy support)
- Happy DOM 20.8.3 - Lightweight DOM implementation for tests
- Webpack 5.94.0 - Bundle renderer process (`src/renderer/webpack.config.cjs`)
- Vite 8.0.0 - Test configuration runner
- ESBuild - Native bundling (via node_modules)
- TypeScript 5.9.3 - Type compilation to JavaScript
- Rolldown 1.0.0-rc.9 - Bundling tool for optimized builds
- Electron Builder 24.13.3 - Package and sign Electron applications
- Fork TS Checker - Parallel TypeScript type checking in webpack
- Source Map Support 0.5.16 - Source map resolution in stack traces
- ESLint 9.39.1 - Linting (with `@typescript-eslint/utils 8.47.0`)
- TypeScript ESLint 8.47.0 - TS linting rules
- Prettier (via oxfmt 0.41.0) - Code formatting
- ESLint Plugins:
## Key Dependencies
- electron 39.8.0 - Desktop application runtime; enables native module access and multi-process architecture
- react 16.12.0 - UI rendering; foundation for all interface components
- redux 4.0.4 - Predictable state management; enables time-travel debugging and state persistence
- @nexusmods/nexus-api - API client for Nexus Mods integration (custom fork, managed as git dependency)
- @duckdb/node-api 1.5.1-r.1 - SQL query engine for complex data analysis (replaces LevelDB for new queries)
- levelup 4.4.0 + leveldown 5.6.0 - Legacy persistent key-value store (being phased out in favor of DuckDB)
- @opentelemetry/api 1.9.0 - OpenTelemetry tracing specification
- @opentelemetry/exporter-trace-otlp-http 0.57.0 - OTLP HTTP exporter for trace data
- @opentelemetry/sdk-trace-base 1.30.0 - Trace processor and span management
- @opentelemetry/context-async-hooks 2.5.1 - Async context propagation
- winston 2.4.3 - Structured logging framework
- mixpanel-browser 2.71.0 - Analytics and telemetry collection
- xml2js 0.5.0 - XML parsing (game configuration, mod metadata)
- js-yaml 4.1.0 - YAML parsing for config files
- relaxed-json 1.0.3 - Lenient JSON parsing for modded game configs
- json-socket - Custom JSON socket implementation
- @msgpack/msgpack 2.7.0 - Efficient binary serialization
- jsonwebtoken 9.0.0 - JWT token creation and verification
- 7z-bin - 7-Zip binary wrapper for archive extraction
- node-7z - 7-Zip Node.js wrapper
- node-ba2tk - Bethesda BA2 archive support (custom fork)
- node-bsatk - Bethesda BSA archive support (custom fork)
- node-diskusage - Disk usage calculation
- turbowalk - High-performance file system traversal (custom fork)
- rimraf - Safe file deletion with retry logic (custom fork)
- fs-extra 9.1.0 - File system utilities (copy, move, etc.)
- write-file-atomic 3.0.1 - Atomic file writes
- electron-updater 4.2.0 - Auto-update framework for releases
- drivelist - List attached drives (mod deployment targets)
- diskusage - Monitor disk space
- permissions - File permission management (custom fork)
- winapi-bindings - Windows API access for native integration
- is-admin - Check admin privileges (required for deployment)
- vortexmt - Multi-threading utilities (custom fork)
- react-bootstrap 0.33.0 - Bootstrap components
- react-dnd 14.0.5 + react-dnd-html5-backend 14.0.5 - Drag-and-drop functionality
- react-select 1.2.1 - Accessible select/dropdown component
- react-datepicker 3.3.0 - Date picker widget
- react-sortable-tree 2.6.2 - Hierarchical tree with reordering
- react-resize-detector 4.2.1 - Container dimension tracking
- react-markdown 6.0.2 - Markdown rendering
- recharts 1.8.5 - Chart library (for visualizations)
- cytoscape 3.6.0 + cytoscape-cose-bilkent 4.1.0 - Graph visualization (dependency analysis)
- packery 2.1.2 - Grid layout
- draggabilly 2.2.0 - Drag behavior
- d3 5.14.1 - Data-driven visualization primitives
- lodash 4.17.21 - Functional programming utilities
- bluebird 3.7.2 - Promise utilities and control flow
- redux-thunk 2.3.0 - Async action middleware
- redux-act 1.8.0 - Action creator generator
- redux-batched-actions 0.5.0 - Batch Redux actions
- reselect 4.1.7 - Memoized selector creation
- p-queue 9.1.0 - Concurrency limiter for promises
- immutability-helper 3.0.1 - Immutable updates
- semver 7.6.0 - Semantic version parsing
- minimatch 3.0.5 - Glob pattern matching
- i18next 19.0.1 - Internationalization framework
- react-i18next 11.11.0 - React i18n bindings
- i18next 19.0.1 - Translation framework
- i18next-fs-backend 2.1.1 - Load translations from files
- react-i18next 11.11.0 - React component integration
## Configuration
- Volta lockfile: Package manager and Node version locked in `package.json` (node: 22.22.0, yarn: 1.22.19)
- pnpm workspaces: Monorepo structure in `pnpm-workspace.yaml` (strict catalog mode with `catalogMode: strict`)
- Environment variables: `.env` file mechanism (not committed; see `.gitignore`)
- Build modes: `NODE_ENV=development` and `NODE_ENV=production` via `cross-env`
- TypeScript: Root `tsconfig.json` with project references to each workspace
- Webpack (Renderer): `src/renderer/webpack.config.cjs`
- Jest (Renderer): `src/renderer/jest.config.mjs`
- Vitest (Main/Shared): `vitest.config.ts` with project array
- Tailwind: `tailwindcss` CLI invoked in build scripts
- SASS: `sass` CLI for custom styles and Bootstrap compilation
- Strict mode: Some packages have `tsconfig.strict.json` (indicated by build instructions)
- API Extractor: Generates `.d.ts` files for public API (`packages/vortex-api/`)
## Platform Requirements
- Node.js 22+ (managed by Volta)
- pnpm 10.33.0+
- Windows (primary target) OR Linux (secondary)
- C++ build tools (for native module compilation)
- Python 3 (for certain native build dependencies)
- Windows 10+ (x64) - Primary distribution via NSIS installer
- Linux (x64) - Zip distribution
- Electron application (self-contained; redistributables bundled)
- VC Runtime 2019+ (Windows; bundled as `VC_redist.x64.exe`)
- .NET Desktop Runtime 9.0 (Windows; bundled as `windowsdesktop-runtime-win-x64.exe`)
- Node.js test environment (no Electron binary required for Jest/Vitest)
- GitHub Actions CI/CD (uses `junit` reporter and GitHub Actions reporter)
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Naming Patterns
- PascalCase for classes and components: `ComponentEx.ts`, `Database.ts`, `Table.ts`
- camelCase for utilities and modules: `util.ts`, `logging.ts`, `errorHandling.ts`
- camelCase with `.test.ts` suffix for test files: `Database.test.ts`, `Debouncer.test.ts`
- Configuration files use kebab-case: `eslint.config.mjs`, `vitest.config.ts`
- Index files use `index.ts` for barrel exports
- camelCase for all functions: `countIf()`, `setdefault()`, `createTable()`
- Verb-first patterns for action creators: `startNotification()`, `updateNotification()`, `stopNotification()`
- `is`/`has` prefix for boolean checks: `isReady()`, `hasOwnProperty()`
- Private methods use `m` prefix (legacy class pattern): `mComponent`, `mPath`, `mBaseObject` in `StateProxyHandler`
- camelCase for all variables: `sourceModId`, `mockState`, `mockApi`
- `const` preferred over `let` and `var`
- Private class fields use `m` prefix (legacy): `mDelayed`, `mDelayedTimer`
- Callback functions use `Cb` suffix: `waitCb`, `installCb`
- PascalCase for interfaces: `INotification`, `IExtensionApi`, `IState`
- PascalCase for type aliases: `ModRow`, `NotificationFunc`
- PascalCase for enum names
- Prefixes: `I` for interfaces, `T` for generic type parameters
## Code Style
- Tool: `oxfmt` (Prettier-compatible)
- Print width: 80 characters (see `.oxfmtrc.json`)
- Semicolons required
- Quote style: double quotes preferred (enforced by prettier config)
- Trailing commas in multiline objects/arrays
- Tool: ESLint with TypeScript support
- Config: `src/{main,preload,renderer,shared}/eslint.config.mjs`
- Most rules configured to `warn` level for ease of refactoring legacy code
- Strictest rules in TypeScript: `@typescript-eslint/consistent-type-imports` (error), unused vars (warn with ignore patterns)
- `@typescript-eslint/consistent-type-imports`: Force `type` imports (error)
- `@typescript-eslint/no-unused-vars`: Warn on unused vars; ignore patterns starting with `_` (unused args)
- `no-var`: Warn
- `prefer-const`: Warn
- `@typescript-eslint/no-explicit-any`: Warn (not strict yet)
- React: `@eslint-react/jsx-shorthand-boolean` warn, `@eslint-react/no-useless-fragment` warn
- Perfectionist plugin: Sort imports and exports alphabetically
## Import Organization
- `@/` maps to `src/` in renderer (Jest config, vite tsconfig)
- Relative imports preferred for local modules
- No absolute paths in application code
- Used selectively in `controls/api.ts`, `types/` directories
- `export * from "../types/IDialog"` pattern for type aggregation
- Main entry points re-export public API
## Error Handling
- Typed error classes with custom inheritance: `UserCanceled`, `TimeoutError`
- Catch blocks explicitly handle all errors
- `.catch(() => { /* best-effort */ })` pattern for non-critical errors
- Error logging via `log()` function: `log("error", "context", error)`
- `getErrorMessage(error)` from `@vortex/shared` for user-friendly messages
- `errorToReportableError()` for telemetry conversion
- `throw new UserCanceled()` for user-initiated cancellation
- Error propagation preserves stack traces
## Logging
- `log(level, context, message, [data])`
- Levels: `"error"`, `"info"`, `"debug"`, `"warn"`
- Always include descriptive context: `log("error", "unrecoverable error", error)`
- User errors logged as `"info"`, system errors as `"error"`
## Comments
- JSDoc for public functions and exported classes
- Explain WHY, not WHAT (code shows WHAT)
- Complex algorithm steps warrant inline comments
- TODOs with responsible party if known: `// TODO: remove after fixing issue #123`
- NOTE for important gotchas: `// NOTE(erri120): Welcome, this file exists because...`
- Used for public API functions
- Parameters, return types, and exceptions documented
- Example from `util.ts`:
- Type annotations in JSDoc optional when TypeScript types are explicit
## Function Design
- Max 3-4 parameters; use object for related params
- Type all parameters explicitly (TypeScript enforced)
- Destructure object params for clarity
- Optional params with `?` suffix
- Always type return values explicitly
- Promises for async operations: `Promise<T>`
- `void` for side-effect-only functions
- Nullable returns use `T | null` or `T | undefined`
- Example: `async query<ModRow>(sql: string): Promise<ModRow[]>`
## Module Design
- Prefer named exports over default exports for modules
- Default exports used for Redux actions (legacy): `export default createAction`
- Deprecation warnings on legacy exports: `/** @deprecated Use createAction from redux-act directly */`
- Located in `controls/api.ts`, `types/` directories
- Aggregate related exports for public API
- Example: `export * from "../types/IDialog"`
- Minimize barrel files to avoid circular dependencies
- Prefix private/internal exports with underscore: `_internalHelper()`
- Use module-level `const` for private utilities
- Example from `notifications.ts`:
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## Pattern Overview
- Three-tier process model: Main (Electron), Renderer (React/Redux), Preload (IPC bridge)
- Redux-based state management centralized in renderer process
- Type-safe IPC communication between processes
- Plugin extension system with both renderer and main process hooks
- Persistence layer: LevelDB + DuckDB for state and queries
- Main process handles OS integration, filesystem, updater, extensibility coordination
- Renderer process owns Redux store, UI rendering, extension manager
## Layers
- Purpose: Secure bridge exposing Electron APIs to renderer without direct access
- Location: `src/preload/src/index.ts`
- Contains: Typed IPC wrappers (invoke, send, on, off), context bridge exposure
- Depends on: Electron IpcRenderer, shared type definitions
- Used by: Renderer process (all Electron/OS communication goes through here)
- Purpose: Native application lifecycle, OS integration, background services, persistence
- Location: `src/main/src/`
- Contains: Application bootstrap, IPC handlers, window management, persistence, extensions initialization, logging, error handling
- Key files: `main.ts` (entry point), `Application.ts` (lifecycle), `ipcHandlers.ts` (request handlers), `MainWindow.ts` (window management)
- Depends on: Electron APIs, Node.js native modules
- Used by: Preload layer via IPC
- Purpose: React UI rendering, Redux state management, extension loading, user interaction
- Location: `src/renderer/src/`
- Contains: React components, Redux actions/reducers, extension manager, views, UI utilities
- Entry point: `renderer.tsx`
- Depends on: React, Redux, ExtensionManager, main process services via preload
- Used by: Electron renderer window
- Purpose: Plugin architecture for adding game support, installers, tools, UI features
- Location: `src/renderer/src/extensions/`
- Contains: 40+ extensions (mod_management, gamemode_management, profile_management, etc.)
- Pattern: Each extension registers reducers, actions, UI components via IExtensionContext
- Depends on: Renderer core (Redux, components, utilities)
- Purpose: Type definitions and utilities shared between all processes
- Location: `src/shared/src/`
- Contains: IPC channel type definitions, error types, state types, logging, telemetry types
- Key files: `types/ipc.ts` (IPC contracts), `types/state.ts` (persisted state structure), `types/errors.ts`
- Purpose: Redux state durability and efficient data queries
- Location: `src/main/src/store/`
- Storage: LevelDB for state blobs, DuckDB for queryable data
- Key files: `LevelPersist.ts` (LevelDB interface), `DuckDBSingleton.ts` (query engine), `ReduxPersistorIPC.ts` (state sync), `Database.ts` (typed model access)
- Flow: Renderer sends state diffs via IPC → Main persists to LevelDB → On startup, main hydrates renderer with saved state
## Data Flow
## Key Abstractions
- Purpose: API surface for extensions to interact with core system
- Examples: `src/renderer/src/types/IExtensionContext.ts`
- Pattern: Plugins call methods like `context.registerReducer()`, `context.registerUIAPI()` during init
- Used by: All 40+ extensions to register functionality
- Purpose: Centralized application state
- Structure: State hives (settings, user, session, notifications, etc.) + extension-registered hives
- Persistence: Hives marked `[persisted: true]` get saved to LevelDB
- Accessed via: Redux selectors (`src/renderer/src/selectors.ts`)
- Purpose: Type-safe Electron method exposure
- Namespaces: `api.shell`, `api.dialog`, `api.persist`, `api.extensions`, `api.updater`, `api.log`
- Pattern: Each namespace maps to IPC channels with typed invoke/send
- Example: `window.api.dialog.showOpen(options)` → preload invoke `dialog:showOpen` → main handler
- Purpose: Self-contained feature modules that register with core
- Location: `src/renderer/src/extensions/{name}/`
- Structure: Usually contains `index.ts` (init), `actions/`, `reducers/`, `components/`
- Bootstrap: Module loads dynamically at renderer startup, calls extension API in module initialization
- Purpose: Logical partition of persisted state
- Examples: "settings", "user", "session", "gameMode", etc.
- Mechanism: Each hive maps to a LevelDB key prefix, synced independently
- Flow: Renderer diffs computed per hive → sent to main → persisted per hive
## Entry Points
- Location: `src/main/src/main.ts`
- Triggers: Electron app startup (when user runs Vortex.exe)
- Responsibilities: Error setup, app initialization, module import orchestration
- Location: `src/main/src/Application.ts` (class definition)
- Triggers: Instantiated in main.ts
- Responsibilities: Full application lifecycle (init, ready, shutdown), persistence setup, extension manager init, main window creation, auto-updater setup, crash reporting
- Location: `src/renderer/src/renderer.tsx`
- Triggers: Loaded when main process creates BrowserWindow
- Responsibilities: React app bootstrap, Redux store creation, extension manager setup, initial render
- Location: `src/preload/src/index.ts`
- Triggers: Loaded by BrowserWindow preload option
- Responsibilities: Expose typed API to renderer via contextBridge
## Error Handling
- Main process: Early error handler before Application init (reports to telemetry before exit)
- Main process: Unhandled rejection/exception handlers (tries to report, then terminates)
- Renderer process: Early error handler on window object
- User-triggered errors: Caught in Redux reducer try-catch, emitted via error action
- Extension errors: Wrapped at ExtensionManager level, tagged with extension name in action metadata
## Cross-Cutting Concerns
- Framework: Custom logging in `src/main/src/logging.ts` and `src/renderer/src/logging.ts`
- Pattern: `log(level, message, metadata)` where level = "info" | "debug" | "warn" | "error"
- Channel: Renderer logs sent via preload IPC to main, aggregated in main logs
- Pattern: Redux reducers verify action shapes before state update
- State verifier: `verify()` function in `src/renderer/src/reducers/verify.ts` checks persisted state against current schema
- Extension validation: Reducer specs can define validators in IReducerSpec
- Nexus API: Handled by `nexus_integration` extension
- OAuth flow: Renderer requests auth → main opens browser → redirects back
- Token storage: Persisted in state hive via Redux
- Infrastructure: Shared telemetry types in `src/shared/src/telemetry/`
- Impl main: `src/main/src/telemetry/` - providers, crash reporting
- Impl renderer: `src/renderer/src/telemetry/` - event tracking
- Disabled by flag in state (user setting)
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## Branch Strategy

This fork maintains two branches for clean upstream PR separation:

- **`linux-port`** — upstream PR candidate. Contains only Linux compatibility changes: platform guards, Linux code paths, devcontainer support, native addon work. No `.planning/` docs, no distribution CI, no fork tooling.
- **`master`** — full fork. Includes everything in `linux-port` plus GSD planning artifacts, AppImage/deb build config, GitHub Actions distribution CI, and any fork-specific work.

### Workflow rule

**Linux port work (upstream-eligible):** Commit to `linux-port` first, then merge into `master`.
**Fork-only work (distribution, planning, internal tooling):** Commit directly to `master` only.

### What belongs where

| Change type | Branch |
|---|---|
| Platform guards, Linux code paths | `linux-port` |
| Bug fixes with Linux platform guards | `linux-port` |
| Devcontainer Linux support | `linux-port` |
| Native addon / build tooling for Linux | `linux-port` |
| GSD `.planning/` docs | `master` only |
| AppImage / deb build config | `master` only |
| GitHub Actions distribution CI | `master` only |
| Fork-specific IDE config | `master` only |

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
