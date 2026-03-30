# Technology Stack

**Analysis Date:** 2026-03-30

## Languages

**Primary:**
- TypeScript 5.9.3 - Core application code (main, renderer, shared, preload processes)
- JavaScript - Build configuration, tooling, and scripts

**Secondary:**
- SCSS 1.97.3 - Styling and Bootstrap theming
- CSS (Tailwind v4) - Modern utility-first styling via `src/stylesheets/tailwind-v4.css`
- HTML - Embedded in React components
- C++/C# - Native modules (separate Git repositories, managed via `scripts/manage-node-modules.js`)

## Runtime

**Environment:**
- Node.js 22.22.0 (via Volta for toolchain management)
- Electron 39.8.0 - Desktop application framework
- pnpm 10.33.0 - Package manager with monorepo workspace support

**Package Manager:**
- pnpm 10.33.0 - Strict lockfile enforced via `preinstall` script (`npx only-allow pnpm`)
- Lockfile: `pnpm-lock.yaml` (committed)

## Frameworks

**Core Application:**
- Electron 39.8.0 - Desktop application container (main + renderer + preload processes)
- React 16.12.0 - UI rendering in renderer process
- Redux 4.0.4 - State management (actions in `src/actions/`, reducers in `src/reducers/`)
- electron-redux - Shared Redux state between main and renderer processes

**Styling:**
- Bootstrap SCSS 3.4.1 - Component design system (`react-bootstrap 0.33.0`)
- Tailwind CSS 4.1.17 - Utility-first CSS framework
- SASS 1.97.3 - Preprocessor for Bootstrap and custom styles

**Testing:**
- Vitest 4.1.0 - Primary test runner (TypeScript projects)
- Jest 29.7.0 - Secondary test runner (React renderer: `src/renderer/jest.config.mjs`)
- Testing Library
  - @testing-library/react 12.1.5 - React component testing
  - @testing-library/dom 10.4.1 - DOM testing utilities
  - @testing-library/jest-dom 6.9.1 - Jest matchers
  - @testing-library/user-event 14.6.1 - User interaction simulation
- Enzyme 3.10.0 - Component inspection (legacy support)
- Happy DOM 20.8.3 - Lightweight DOM implementation for tests

**Build/Development:**
- Webpack 5.94.0 - Bundle renderer process (`src/renderer/webpack.config.cjs`)
- Vite 8.0.0 - Test configuration runner
- ESBuild - Native bundling (via node_modules)
- TypeScript 5.9.3 - Type compilation to JavaScript
- Rolldown 1.0.0-rc.9 - Bundling tool for optimized builds
- Electron Builder 24.13.3 - Package and sign Electron applications
- Fork TS Checker - Parallel TypeScript type checking in webpack
- Source Map Support 0.5.16 - Source map resolution in stack traces

**Code Quality:**
- ESLint 9.39.1 - Linting (with `@typescript-eslint/utils 8.47.0`)
- TypeScript ESLint 8.47.0 - TS linting rules
- Prettier (via oxfmt 0.41.0) - Code formatting
- ESLint Plugins:
  - @eslint-react/eslint-plugin 2.3.7 - React-specific rules
  - @stylistic/eslint-plugin 5.7.1 - Stylistic consistency
  - eslint-plugin-import 2.32.0 - Import/export syntax
  - eslint-plugin-perfectionist 5.4.0 - Import ordering
  - eslint-plugin-better-tailwindcss 4.0.2 - Tailwind class optimization

## Key Dependencies

**Critical:**
- electron 39.8.0 - Desktop application runtime; enables native module access and multi-process architecture
- react 16.12.0 - UI rendering; foundation for all interface components
- redux 4.0.4 - Predictable state management; enables time-travel debugging and state persistence
- @nexusmods/nexus-api - API client for Nexus Mods integration (custom fork, managed as git dependency)
- @duckdb/node-api 1.5.1-r.1 - SQL query engine for complex data analysis (replaces LevelDB for new queries)
- levelup 4.4.0 + leveldown 5.6.0 - Legacy persistent key-value store (being phased out in favor of DuckDB)

**Infrastructure & Observability:**
- @opentelemetry/api 1.9.0 - OpenTelemetry tracing specification
- @opentelemetry/exporter-trace-otlp-http 0.57.0 - OTLP HTTP exporter for trace data
- @opentelemetry/sdk-trace-base 1.30.0 - Trace processor and span management
- @opentelemetry/context-async-hooks 2.5.1 - Async context propagation
- winston 2.4.3 - Structured logging framework
- mixpanel-browser 2.71.0 - Analytics and telemetry collection

**Data & Parsing:**
- xml2js 0.5.0 - XML parsing (game configuration, mod metadata)
- js-yaml 4.1.0 - YAML parsing for config files
- relaxed-json 1.0.3 - Lenient JSON parsing for modded game configs
- json-socket - Custom JSON socket implementation
- @msgpack/msgpack 2.7.0 - Efficient binary serialization
- jsonwebtoken 9.0.0 - JWT token creation and verification

**File System & Archives:**
- 7z-bin - 7-Zip binary wrapper for archive extraction
- node-7z - 7-Zip Node.js wrapper
- node-ba2tk - Bethesda BA2 archive support (custom fork)
- node-bsatk - Bethesda BSA archive support (custom fork)
- node-diskusage - Disk usage calculation
- turbowalk - High-performance file system traversal (custom fork)
- rimraf - Safe file deletion with retry logic (custom fork)
- fs-extra 9.1.0 - File system utilities (copy, move, etc.)
- write-file-atomic 3.0.1 - Atomic file writes

**Game Integration:**
- electron-updater 4.2.0 - Auto-update framework for releases
- drivelist - List attached drives (mod deployment targets)
- diskusage - Monitor disk space
- permissions - File permission management (custom fork)
- winapi-bindings - Windows API access for native integration
- is-admin - Check admin privileges (required for deployment)
- vortexmt - Multi-threading utilities (custom fork)

**UI & Data Visualization:**
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

**Utilities & Helpers:**
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

**Internationalization:**
- i18next 19.0.1 - Translation framework
- i18next-fs-backend 2.1.1 - Load translations from files
- react-i18next 11.11.0 - React component integration

## Configuration

**Environment:**
- Volta lockfile: Package manager and Node version locked in `package.json` (node: 22.22.0, yarn: 1.22.19)
- pnpm workspaces: Monorepo structure in `pnpm-workspace.yaml` (strict catalog mode with `catalogMode: strict`)
- Environment variables: `.env` file mechanism (not committed; see `.gitignore`)
- Build modes: `NODE_ENV=development` and `NODE_ENV=production` via `cross-env`

**Build Configuration:**
- TypeScript: Root `tsconfig.json` with project references to each workspace
- Webpack (Renderer): `src/renderer/webpack.config.cjs`
- Jest (Renderer): `src/renderer/jest.config.mjs`
- Vitest (Main/Shared): `vitest.config.ts` with project array
- Tailwind: `tailwindcss` CLI invoked in build scripts
- SASS: `sass` CLI for custom styles and Bootstrap compilation

**Type Checking:**
- Strict mode: Some packages have `tsconfig.strict.json` (indicated by build instructions)
- API Extractor: Generates `.d.ts` files for public API (`packages/vortex-api/`)

## Platform Requirements

**Development:**
- Node.js 22+ (managed by Volta)
- pnpm 10.33.0+
- Windows (primary target) OR Linux (secondary)
- C++ build tools (for native module compilation)
- Python 3 (for certain native build dependencies)

**Production:**
- Windows 10+ (x64) - Primary distribution via NSIS installer
- Linux (x64) - Zip distribution
- Electron application (self-contained; redistributables bundled)
- VC Runtime 2019+ (Windows; bundled as `VC_redist.x64.exe`)
- .NET Desktop Runtime 9.0 (Windows; bundled as `windowsdesktop-runtime-win-x64.exe`)

**Testing:**
- Node.js test environment (no Electron binary required for Jest/Vitest)
- GitHub Actions CI/CD (uses `junit` reporter and GitHub Actions reporter)

---

*Stack analysis: 2026-03-30*
