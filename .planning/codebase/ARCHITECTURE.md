# Architecture

**Analysis Date:** 2026-03-30

## Pattern Overview

**Overall:** Electron + React + Redux multi-process architecture with plugin-based extensibility

**Key Characteristics:**
- Three-tier process model: Main (Electron), Renderer (React/Redux), Preload (IPC bridge)
- Redux-based state management centralized in renderer process
- Type-safe IPC communication between processes
- Plugin extension system with both renderer and main process hooks
- Persistence layer: LevelDB + DuckDB for state and queries
- Main process handles OS integration, filesystem, updater, extensibility coordination
- Renderer process owns Redux store, UI rendering, extension manager

## Layers

**Preload Layer:**
- Purpose: Secure bridge exposing Electron APIs to renderer without direct access
- Location: `src/preload/src/index.ts`
- Contains: Typed IPC wrappers (invoke, send, on, off), context bridge exposure
- Depends on: Electron IpcRenderer, shared type definitions
- Used by: Renderer process (all Electron/OS communication goes through here)

**Main Process (Electron):**
- Purpose: Native application lifecycle, OS integration, background services, persistence
- Location: `src/main/src/`
- Contains: Application bootstrap, IPC handlers, window management, persistence, extensions initialization, logging, error handling
- Key files: `main.ts` (entry point), `Application.ts` (lifecycle), `ipcHandlers.ts` (request handlers), `MainWindow.ts` (window management)
- Depends on: Electron APIs, Node.js native modules
- Used by: Preload layer via IPC

**Renderer Process (UI):**
- Purpose: React UI rendering, Redux state management, extension loading, user interaction
- Location: `src/renderer/src/`
- Contains: React components, Redux actions/reducers, extension manager, views, UI utilities
- Entry point: `renderer.tsx`
- Depends on: React, Redux, ExtensionManager, main process services via preload
- Used by: Electron renderer window

**Extension System (Renderer-side):**
- Purpose: Plugin architecture for adding game support, installers, tools, UI features
- Location: `src/renderer/src/extensions/`
- Contains: 40+ extensions (mod_management, gamemode_management, profile_management, etc.)
- Pattern: Each extension registers reducers, actions, UI components via IExtensionContext
- Depends on: Renderer core (Redux, components, utilities)

**Shared Layer:**
- Purpose: Type definitions and utilities shared between all processes
- Location: `src/shared/src/`
- Contains: IPC channel type definitions, error types, state types, logging, telemetry types
- Key files: `types/ipc.ts` (IPC contracts), `types/state.ts` (persisted state structure), `types/errors.ts`

**Data Persistence:**
- Purpose: Redux state durability and efficient data queries
- Location: `src/main/src/store/`
- Storage: LevelDB for state blobs, DuckDB for queryable data
- Key files: `LevelPersist.ts` (LevelDB interface), `DuckDBSingleton.ts` (query engine), `ReduxPersistorIPC.ts` (state sync), `Database.ts` (typed model access)
- Flow: Renderer sends state diffs via IPC → Main persists to LevelDB → On startup, main hydrates renderer with saved state

## Data Flow

**Startup Flow:**
1. Electron app starts (`main.ts`)
2. Application class initializes: logging, extensions IPC handler, persistence layer, main window
3. Main window loads renderer (React app)
4. Preload script exposes safe API to renderer
5. Renderer bootstrap: Redux store creation, extension manager initialization
6. Renderer requests hydration data from main via IPC
7. Main sends persisted state chunks, renderer replays to Redux
8. Renderer renders UI, extensions load and register their components/actions/reducers

**User Action → State Update Flow:**
1. User interacts with React component
2. Component dispatches Redux action (e.g., `setModsEnabled`)
3. Reducer processes action, updates store
4. Redux middleware: if persisted state, computes diff operations
5. Diff sent via preload IPC to main (`persist:diff` channel)
6. Main receives diff, applies to LevelDB via SubPersistor
7. Reducer subscription listeners notify dependent components
8. Components re-render with updated state

**Extension Registration Flow:**
1. Extension calls `registerReducer()`, `registerAction()`, `registerUIComponent()` etc. during initialization
2. ExtensionManager collects registrations into a map keyed by register function name
3. Components use `useExtensionObjects(registerSettingsPanel)` hook
4. Hook queries ExtensionManager cache, collects all registered components
5. Components render collected extensions

**Main Process Service Flow (e.g., update check):**
1. Renderer sends `updater:check-for-updates` via preload IPC
2. Main process handler invoked in `ipcHandlers.ts`
3. Handler executes update check logic in `src/main/src/extensions/updater.ts`
4. Handler sends progress updates back via `ipcRenderer.send('updater:status', ...)`
5. Renderer receives event and updates app state
6. UI reflects update availability

## Key Abstractions

**IExtensionContext:**
- Purpose: API surface for extensions to interact with core system
- Examples: `src/renderer/src/types/IExtensionContext.ts`
- Pattern: Plugins call methods like `context.registerReducer()`, `context.registerUIAPI()` during init
- Used by: All 40+ extensions to register functionality

**Redux State Tree (IState):**
- Purpose: Centralized application state
- Structure: State hives (settings, user, session, notifications, etc.) + extension-registered hives
- Persistence: Hives marked `[persisted: true]` get saved to LevelDB
- Accessed via: Redux selectors (`src/renderer/src/selectors.ts`)

**Preload API (`window.api`):**
- Purpose: Type-safe Electron method exposure
- Namespaces: `api.shell`, `api.dialog`, `api.persist`, `api.extensions`, `api.updater`, `api.log`
- Pattern: Each namespace maps to IPC channels with typed invoke/send
- Example: `window.api.dialog.showOpen(options)` → preload invoke `dialog:showOpen` → main handler

**Extension Module (Dynamic Plugin):**
- Purpose: Self-contained feature modules that register with core
- Location: `src/renderer/src/extensions/{name}/`
- Structure: Usually contains `index.ts` (init), `actions/`, `reducers/`, `components/`
- Bootstrap: Module loads dynamically at renderer startup, calls extension API in module initialization

**Persistence Hive:**
- Purpose: Logical partition of persisted state
- Examples: "settings", "user", "session", "gameMode", etc.
- Mechanism: Each hive maps to a LevelDB key prefix, synced independently
- Flow: Renderer diffs computed per hive → sent to main → persisted per hive

## Entry Points

**Main Process Entry:**
- Location: `src/main/src/main.ts`
- Triggers: Electron app startup (when user runs Vortex.exe)
- Responsibilities: Error setup, app initialization, module import orchestration

**Main Application Class:**
- Location: `src/main/src/Application.ts` (class definition)
- Triggers: Instantiated in main.ts
- Responsibilities: Full application lifecycle (init, ready, shutdown), persistence setup, extension manager init, main window creation, auto-updater setup, crash reporting

**Renderer Entry:**
- Location: `src/renderer/src/renderer.tsx`
- Triggers: Loaded when main process creates BrowserWindow
- Responsibilities: React app bootstrap, Redux store creation, extension manager setup, initial render

**Preload Entry:**
- Location: `src/preload/src/index.ts`
- Triggers: Loaded by BrowserWindow preload option
- Responsibilities: Expose typed API to renderer via contextBridge

## Error Handling

**Strategy:** Multi-layer error capture with crash reporting

**Patterns:**
- Main process: Early error handler before Application init (reports to telemetry before exit)
- Main process: Unhandled rejection/exception handlers (tries to report, then terminates)
- Renderer process: Early error handler on window object
- User-triggered errors: Caught in Redux reducer try-catch, emitted via error action
- Extension errors: Wrapped at ExtensionManager level, tagged with extension name in action metadata

**Error Flow:**
1. Error caught at layer (main handler, reducer, component, IPC handler)
2. Converted to `unknownToError()` for consistent shape
3. Either: displayed to user (user-friendly msg), logged, or reported to telemetry
4. Extension source tracked in action `meta.extension`
5. Critical errors: dialog shown, then graceful shutdown or recovery attempted

## Cross-Cutting Concerns

**Logging:**
- Framework: Custom logging in `src/main/src/logging.ts` and `src/renderer/src/logging.ts`
- Pattern: `log(level, message, metadata)` where level = "info" | "debug" | "warn" | "error"
- Channel: Renderer logs sent via preload IPC to main, aggregated in main logs

**Validation:**
- Pattern: Redux reducers verify action shapes before state update
- State verifier: `verify()` function in `src/renderer/src/reducers/verify.ts` checks persisted state against current schema
- Extension validation: Reducer specs can define validators in IReducerSpec

**Authentication:**
- Nexus API: Handled by `nexus_integration` extension
- OAuth flow: Renderer requests auth → main opens browser → redirects back
- Token storage: Persisted in state hive via Redux

**Telemetry:**
- Infrastructure: Shared telemetry types in `src/shared/src/telemetry/`
- Impl main: `src/main/src/telemetry/` - providers, crash reporting
- Impl renderer: `src/renderer/src/telemetry/` - event tracking
- Disabled by flag in state (user setting)

---

*Architecture analysis: 2026-03-30*
