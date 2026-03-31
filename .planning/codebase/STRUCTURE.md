# Codebase Structure

**Analysis Date:** 2026-03-30

## Directory Layout

```
/home/alex/src/Vortex/
├── src/                           # Main source code
│   ├── main/                      # Electron main process
│   │   ├── src/                   # Main process TypeScript source
│   │   ├── out/                   # Development build output (ts→js)
│   │   ├── dist/                  # Production build output
│   │   └── nsis/                  # Windows installer scripts
│   ├── renderer/                  # React renderer process
│   │   └── src/                   # Renderer TypeScript source
│   ├── preload/                   # Electron preload script
│   │   └── src/                   # Preload TypeScript source
│   ├── shared/                    # Shared types and utilities
│   │   └── src/                   # Shared TypeScript source
│   ├── stylesheets/               # SCSS stylesheets
│   └── queries/                   # Query/SQL definitions
├── extensions/                    # Bundled game extensions
│   ├── games/                     # Game-specific extensions
│   ├── collections/               # Mod collection extensions
│   └── [others]/                  # Specialized extensions
├── locales/                       # i18n translation files
├── assets/                        # Runtime assets (icons, fonts, licenses)
├── package.json                   # Monorepo root (pnpm workspaces)
├── tsconfig.*.json                # TypeScript configurations
└── .planning/                     # GSD planning documents
```

## Directory Purposes

**src/main:**
- Purpose: Electron main process and application entry point
- Contains: Application bootstrap, window management, IPC handlers, persistence layer, native extension hooks
- Built to: `src/main/out/` (dev) or `src/main/dist/` (prod)
- Key files: `main.ts` (entry), `Application.ts` (lifecycle), `ipcHandlers.ts` (request handlers)

**src/main/src:**
- Purpose: Main process TypeScript source
- Organization:
  - Root files: Application controller, IPC setup, error handling, logging, CLI, file validation
  - `store/`: LevelDB persistence, Redux sync, DuckDB queries, state hydration
  - `extensions/`: Main-side extension hooks (updater, Nexus integration)
  - `downloading/`: Download manager utilities
  - `telemetry/`: Crash reporting, telemetry provider setup

**src/renderer:**
- Purpose: React UI and Redux store
- Contains: React components, Redux state management, extension manager, UI utilities
- Built to: Bundled into Electron app bundle
- Key files: `renderer.tsx` (entry), `ExtensionManager.ts` (plugin loader), `selectors.ts` (state accessors)

**src/renderer/src:**
- Purpose: Renderer process TypeScript source
- Organization:
  - Root files: App bootstrap, extension provider, state management, menu, logging
  - `extensions/`: 40+ renderer-side plugins (mod management, game modes, UI tools, etc.)
  - `views/`: Main UI layout components (MainLayout, ClassicLayout, ModernLayout, sidebar, dialogs)
  - `controls/`: Reusable React components (table, form inputs, cards, etc.)
  - `actions/`: Redux action creators (exported from core + all extensions)
  - `reducers/`: Redux reducer functions (app, notifications, user, session, window, tables, loadOrder)
  - `store/`: Redux store setup, reducer combination, state verification
  - `util/`: Helper functions (filesystem, validation, game detection, mod management utilities)
  - `hooks/`: React hooks (Redux selectors, lifecycle helpers)
  - `contexts/`: React context providers (extension context)
  - `types/`: TypeScript definitions (IExtensionContext, IState, custom errors)
  - `__tests__/`: Test files for core functionality
  - `__mocks__/`: Mock modules for testing (electron, etc.)

**src/preload:**
- Purpose: Secure bridge between renderer and Electron APIs
- Location: `src/preload/src/index.ts`
- Exposes: `window.api` namespace with typed methods, `window.versions` with version info

**src/shared:**
- Purpose: Type definitions and utilities for all processes
- Location: `src/shared/src/`
- Modules:
  - `types/`: IPC channels, electron, logging, state, preload, CLI types
  - `api/`: Shared API definitions
  - `telemetry/`: Shared telemetry type definitions
  - No runtime code - only TypeScript definitions

**src/stylesheets:**
- Purpose: Application styling (SCSS + Bootstrap)
- Contains: Bootstrap customizations, Vortex-specific styles, form styles, theme styles, datepicker styles, Tailwind v4 configuration

**src/queries:**
- Purpose: Query and SQL definitions
- Structure: Organized by domain (setup, select)
- Used by: DuckDB query system for data access

**extensions/:**
- Purpose: Bundled game extensions and plugins
- Contains: 40+ subdirectories, each a separate extension module
- Structure: Each extension is a self-contained TypeScript package
- Key extensions:
  - `gamebryo-*`: Game-specific support (Skyrim, Fallout series)
  - `installer-*`: Installer frameworks (FOMOD, NestedFOD, etc.)
  - `mod_management/`: Core mod installation/deployment
  - `profile_management/`: Profile switching
  - `gamemode_management/`: Game instance selection
  - `download_management/`: Download tracking

**locales/:**
- Purpose: i18n translation files
- Structure: Language subdirectories (e.g., `en/`) with translation JSONs

**assets/:**
- Purpose: Runtime assets bundled with app
- Contains: Application icons, fonts, licenses, VC++ runtime redistributable, pictograms

## Key File Locations

**Entry Points:**
- `src/main/src/main.ts`: Electron app entry point (first code executed)
- `src/renderer/src/renderer.tsx`: React app entry point
- `src/preload/src/index.ts`: Preload context bridge

**Application Lifecycle:**
- `src/main/src/Application.ts`: Main application controller (init, ready, shutdown)
- `src/main/src/MainWindow.ts`: Electron window management
- `src/main/src/SplashScreen.ts`: Splash screen during startup

**Redux State:**
- `src/renderer/src/store/reducers.ts`: Redux combineReducers wrapper
- `src/renderer/src/reducers/index.ts`: Root reducer combining all hives
- `src/renderer/src/reducers/{app,user,session,notifications,tables,window,loadOrder}.ts`: Domain reducers
- `src/renderer/src/actions/index.ts`: Action creator exports (re-exports from extensions)
- `src/renderer/src/selectors.ts`: Redux selectors for accessing state

**Extension Management:**
- `src/renderer/src/ExtensionManager.ts`: Plugin loader and registration hub
- `src/renderer/src/ExtensionProvider.ts`: React hooks for extension access
- `src/renderer/src/extensions/index.ts`: Extension dependency declarations

**IPC Communication:**
- `src/main/src/ipc.ts`: Type-safe IPC main helpers (on, handle, send)
- `src/preload/src/index.ts`: IPC wrapper exposures via contextBridge
- `src/main/src/ipcHandlers.ts`: Main-side handler definitions
- `src/shared/src/types/ipc.ts`: IPC channel type contracts

**Persistence:**
- `src/main/src/store/mainPersistence.ts`: Persistence system setup
- `src/main/src/store/LevelPersist.ts`: LevelDB interface
- `src/main/src/store/ReduxPersistorIPC.ts`: Handles Redux state sync via IPC
- `src/main/src/store/SubPersistor.ts`: Per-hive persistor
- `src/main/src/store/DuckDBSingleton.ts`: Query engine for data access
- `src/main/src/store/Database.ts`: Typed model access

**UI Components:**
- `src/renderer/src/views/layout/MainLayout.tsx`: Main app layout wrapper
- `src/renderer/src/views/layout/ClassicLayout.tsx`: Classic UI layout variant
- `src/renderer/src/views/layout/ModernLayout.tsx`: Modern UI layout variant
- `src/renderer/src/controls/`: Reusable components (table, buttons, modals, etc.)

**Utilities:**
- `src/renderer/src/util/fs.ts`: Filesystem operations
- `src/renderer/src/util/api.ts`: API utilities
- `src/renderer/src/util/storeHelper.ts`: Redux state helpers (setSafe, getSafe, etc.)
- `src/renderer/src/util/errorHandling.ts`: Error handling utilities

**Configuration:**
- `tsconfig.json`: Root TypeScript config
- `tsconfig.base.json`: Base config (extends by workspace packages)
- `tsconfig.strict.json`: Strict type checking config (for enforcing quality)
- `package.json`: Root monorepo manifest with build scripts

**Shared Types:**
- `src/shared/src/types/ipc.ts`: IPC channel definitions
- `src/shared/src/types/state.ts`: Redux state structure types
- `src/shared/src/types/errors.ts`: Custom error types
- `src/shared/src/types/preload.ts`: Preload API types
- `src/shared/src/types/electron.ts`: Electron type re-exports

## Naming Conventions

**Files:**
- TypeScript: `.ts` for utilities/logic, `.tsx` for React components
- Tests: `.test.ts`, `.test.tsx`, or `__tests__/` directory
- Styles: `.scss` for stylesheets, `.css` for compiled output
- Build output: No extensions in import paths; transpiled `.ts` → `.js`

**Directories:**
- Lowercase with hyphens: `src/renderer`, `src/main`, `mod-management`
- Plugin extensions: Lowercase with underscores: `mod_management`, `profile_management`, `gamemode_management`
- Organized by domain: `actions/`, `reducers/`, `components/`, `util/`, `__tests__/`

**React Components:**
- PascalCase filenames: `MainLayout.tsx`, `ModList.tsx`, `DialogLayer.tsx`
- Export as named or default (both patterns used in codebase)

**Redux:**
- Actions: Named exports, verb-based: `setModsEnabled`, `addNotification`, `clearSession`
- Reducers: Named exports, domain-scoped: `userReducer`, `sessionReducer`, `appReducer`
- Action types: Generated by redux-act from action creators
- Selectors: Named exports, prefixed with `get*` or domain: `getModsState`, `getUserName`

**Utilities:**
- camelCase: `deepMerge()`, `calculateFolderSize()`, `validateFile()`
- Helper exports: Organized in util modules by concern (`storeHelper.ts`, `fs.ts`, `errorHandling.ts`)

## Where to Add New Code

**New Feature (e.g., new mod format support):**
- Primary code: `src/renderer/src/extensions/installer_[format]/` (new extension directory)
- Tests: `src/renderer/src/extensions/installer_[format]/__tests__/`
- Redux integration: Reducer and actions in extension's `reducers/` and `actions/` subdirs
- Entry point: `src/renderer/src/extensions/installer_[format]/index.ts` for initialization

**New React Component (reusable):**
- Shared controls: `src/renderer/src/controls/[ComponentName].tsx`
- View page: `src/renderer/src/views/[ViewName].tsx`
- Layout component: `src/renderer/src/views/layout/[LayoutName].tsx`

**New Utility Function:**
- Shared logic: `src/renderer/src/util/[domain].ts` (e.g., `gameDetection.ts`)
- Type-specific: `src/main/src/[domain].ts` if main-process only

**New Redux State Slice:**
- Domain-specific (extension): Add to extension's `reducers/` directory
- Core state: Add file to `src/renderer/src/reducers/[domain].ts`
- Register: Export from `src/renderer/src/reducers/index.ts`

**Main Process Service:**
- Utility service: `src/main/src/[service].ts`
- Extension hook: `src/main/src/extensions/[name].ts`
- IPC handler: Add to `src/main/src/ipcHandlers.ts`

**Tests:**
- Collocated: `src/renderer/src/reducers/verify.test.ts` (next to source)
- Directory-based: `src/renderer/src/__tests__/[feature].test.ts` (for complex tests)
- Mock data: `src/renderer/src/__mocks__/` for module mocks

## Special Directories

**src/main/out/:**
- Purpose: Development build staging area
- Generated: Yes (by `pnpm run build`)
- Committed: No (gitignored)
- Contains: Transpiled TypeScript + bundled extensions for dev

**src/main/dist/:**
- Purpose: Production build staging area
- Generated: Yes (by `pnpm run dist`)
- Committed: No (gitignored)
- Contains: Minified production bundles

**src/renderer/src/__mocks__/:**
- Purpose: Jest mock modules for testing
- Contains: Mock implementations of external modules (Electron, etc.)
- Pattern: Mirrors external module structure for hoisting in tests

**src/renderer/src/extensions/:**
- Purpose: Plugin system - each subdirectory is a self-contained module
- Bootstrap: Module files are imported in `index.ts`, triggering initialization
- Pattern: Each extension's `index.ts` calls `context.registerReducer()`, `context.registerUIAPI()`, etc.
- Compilation: Built separately via `pnpm run build:extensions` before main build

**src/shared/src/:**
- Purpose: Compile-time type definitions only
- Pattern: No runtime dependencies from src/main or src/renderer into shared runtime code
- Exceptions: Constants and enums that are needed at runtime (e.g., error codes)

---

*Structure analysis: 2026-03-30*
