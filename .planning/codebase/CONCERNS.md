# Codebase Concerns

**Analysis Date:** 2026-03-30

## Tech Debt

**Excessive `any` Type Usage:**
- Issue: 474+ instances of `as any` casting throughout codebase, bypassing TypeScript safety
- Files: `src/renderer/src/controls/*.tsx`, `src/main/src/*.ts`, `src/renderer/src/extensions/**/*.ts`
- Impact: Type checking completely disabled in affected areas, bugs slip through at runtime, refactoring is risky
- Fix approach: Enable strict TypeScript checking (`tsconfig.strict.json` exists for some areas), gradually remove `any` casts by fixing underlying type issues. Prioritize high-risk paths first (IPC, state management).

**Polling-Based Component Re-rendering:**
- Issue: `DynamicProps` component uses 500ms polling to detect prop changes instead of reactive patterns
- Files: `src/renderer/src/controls/DynamicProps.tsx`
- Impact: Performance degradation, unnecessary re-renders, creates background interval that must be manually managed
- Fix approach: Replace with reactive pattern (context API, hooks, or Redux selectors). Current approach noted as "TODO: This is ugly polling, can we find a better way" in code.

**Custom Protocol Security Gap:**
- Issue: IPC trusts `file://` protocol URLs; security best practice is to use custom protocols
- Files: `src/main/src/ipc.ts` (line 127)
- Impact: Potential attack surface for malicious file:// URLs in IPC validation
- Fix approach: Implement custom Electron protocol handler and update `isTrustedProtocol()` to validate against it instead of `file://`

**Incomplete Game Discovery Logic:**
- Issue: Game installation detection only checks for uninstaller presence; GOG/Epic/Steam games use different markers (commented TODO with 30+ lines of research)
- Files: `src/main/src/Application.ts` (lines 535-553)
- Impact: Misidentifies installation type for games installed via platform managers, potentially affects mod deployment and mod manager behavior
- Fix approach: Implement file pattern matching for GOG marker files (`goggame-*.ini`, `goggame-*.info`) and Epic markers as documented in TODO. Add game-specific installers registry.

**Unhandled Promise Rejections:**
- Issue: Multiple `.catch(() => {})` and `.catch(() => ({}))` swallowing errors silently
- Files: `src/renderer/src/extensions/download_management/DownloadManager.ts`, `src/renderer/src/extensions/mod_management/InstallManager.ts`, `src/renderer/src/views/components/Header/ProfileSection.tsx`
- Impact: Silent failures make debugging impossible, issues go unreported, data integrity problems hidden
- Fix approach: Log all errors before swallowing them, or re-throw if not truly ignorable. Use proper error boundaries.

**Legacy React Context API:**
- Issue: Codebase uses deprecated class component `getChildContext()` pattern instead of modern Context API
- Files: `src/renderer/src/contexts/MainContext.tsx`
- Impact: Cannot use hooks in child components, harder to test, performance issues with context consumers
- Fix approach: Migrate to functional component Context API and Provider pattern. This enables hook usage across codebase.

**Hardcoded Timeouts and Intervals:**
- Issue: 500ms polling in DynamicProps; various hardcoded setTimeout delays throughout
- Files: `src/renderer/src/controls/DynamicProps.tsx` (line 69)
- Impact: Fragile behavior, platform-dependent performance issues, difficult to tune
- Fix approach: Make configurable, consider using reactive frameworks (RxJS), or event-based triggering.

---

## Known Bugs

**Double Component Update in TableDetail:**
- Symptoms: `TableDetail` component re-renders twice when row data changes (once for rawData, once for rowData)
- Files: `src/renderer/src/controls/table/TableDetail.tsx` (lines 325-327 TODO comment)
- Trigger: Any mod/download/profile data change affecting table rows
- Workaround: None; acknowledged as known issue but not addressed

**Function Return Type Inconsistency:**
- Symptoms: `ignoreFunction()` in DynamicProps returns `undefined` instead of `boolean`, breaks comparison logic
- Files: `src/renderer/src/controls/DynamicProps.tsx` (line 8)
- Trigger: Dynamic prop comparison with `isEqualWith`
- Workaround: Logic happens to work because undefined is falsy, but technically incorrect

---

## Performance Bottlenecks

**Massive InstallManager File:**
- Problem: 8,009 lines in single file; handles phase-gated collections, dependency resolution, installation orchestration, mod metadata
- Files: `src/renderer/src/extensions/mod_management/InstallManager.ts`
- Cause: All mod installation logic concentrated in one file, no separation of concerns
- Improvement path: Split into: `InstallOrchestrator` (phases), `DependencyResolver` (deps), `MetadataHandler` (metadata), `InstallExecutor` (execution)

**DOM Polling in Component Render Loop:**
- Problem: DynamicProps uses global 500ms timer that fires for all instances, continuously checks all props via `isEqualWith`
- Files: `src/renderer/src/controls/DynamicProps.tsx`
- Cause: Polling architecture instead of reactive
- Improvement path: Switch to event-based or use React hooks with useEffect dependencies

**Large State Objects in Table Components:**
- Problem: Table passes full row data and attributes to detail components; comparison in `shouldComponentUpdate` uses `_.isEqual` on complex objects
- Files: `src/renderer/src/controls/table/TableDetail.tsx`, `src/renderer/src/controls/Table.tsx` (2,176 lines)
- Cause: No memoization, no structural sharing, full object cloning
- Improvement path: Use React.memo, useMemo, selector functions, or immutable data structures

---

## Type Safety Issues

**Unconstrained Generic `any` in Utilities:**
- Problem: Debouncer, Form Fields, Redux Watcher accept `any` arguments with no type constraints
- Files: `src/shared/src/Debouncer.ts`, `src/renderer/src/controls/FormFields.tsx`, `src/renderer/src/store/ReduxWatcher.ts`
- Impact: Zero type checking in critical system infrastructure
- Fix approach: Use proper generics (e.g., `Debouncer<T extends Function>`), create discriminated unions for form field types

**Unsafe Cast Pattern in InstallManager:**
- Problem: Multiple `as IDependency` casts without runtime validation; type assertion used to force Dependency discriminated union
- Files: `src/renderer/src/extensions/mod_management/InstallManager.ts` (lines 7006, 7010, 7019, 7021)
- Impact: Runtime crashes if discriminated union structure changes; refactoring errors not caught
- Fix approach: Use type guards and narrow types properly instead of casts

---

## Fragile Areas

**Dependency Resolution System:**
- Files: `src/renderer/src/extensions/mod_management/InstallManager.ts` (methods: `ensurePhaseState`, `markPhaseDownloadsFinished`, `maybeAdvancePhase`)
- Why fragile: Multi-phase installation coordination uses mutable state maps (`mInstallPhaseState`) with complex state transitions; no immutability, no transactions
- Safe modification: Add comprehensive logging before phase transitions; write integration tests for all phase state combinations; consider state machine library
- Test coverage: No visible test files for phase coordination logic

**IPC Protocol Validation:**
- Files: `src/main/src/ipc.ts` (function: `isTrustedSender`)
- Why fragile: Relies on URL parsing and string matching; hardcoded allowlist includes `::1/128` which is invalid CIDR for hostname comparison
- Safe modification: Use `new URL()` parsing for all URLs, validate against explicit set of safe hostnames, add unit tests for edge cases
- Test coverage: No tests visible for IPC protocol validation

**Electron Window/Process Lifecycle:**
- Files: `src/main/src/Application.ts` (error handling, initialization), `src/main/src/errorHandling.ts`
- Why fragile: Early crashes before app.isReady() use fallback `dialog.showErrorBox` which may itself fail; no retry logic
- Safe modification: Wrap all error dialogs in try-catch; test app startup crash scenarios; add graceful fallback to stderr logging
- Test coverage: Error handling tests appear minimal

**Redux Persistence/IPC Bridge:**
- Files: `src/main/src/store/ReduxPersistorIPC.ts`, `src/renderer/src/store/ReduxWatcher.ts`
- Why fragile: Bidirectional state sync across process boundary; no conflict resolution or versioning
- Safe modification: Add schema versioning, validation on deserialization, log all persistence errors explicitly
- Test coverage: Some tests exist but coverage of edge cases (schema changes, serialization errors) unclear

---

## Test Coverage Gaps

**IPC Security Validation:**
- What's not tested: Edge cases in `isTrustedSender()`, hostname matching with IPv6 addresses, malformed URLs
- Files: `src/main/src/ipc.ts`
- Risk: Security regression, bypass of IPC validation
- Priority: High

**Game Discovery and Installation Type Detection:**
- What's not tested: GOG/Epic game detection, fallback to "managed" type, installation marker file validation
- Files: `src/main/src/Application.ts` (function: `determinateInstallType`)
- Risk: Wrong game mod deployment, data directory confusion
- Priority: High

**Phase-Gated Collection Installation:**
- What's not tested: Phase state transitions, deployment scheduling, pending queue handling, phase re-queuing prevention
- Files: `src/renderer/src/extensions/mod_management/InstallManager.ts`
- Risk: Collections install in wrong order, deployments trigger at wrong time, stuck phases
- Priority: High

**Component Lifecycle and Re-rendering:**
- What's not tested: Double updates in TableDetail, DynamicProps polling behavior, shouldComponentUpdate logic
- Files: `src/renderer/src/controls/table/TableDetail.tsx`, `src/renderer/src/controls/DynamicProps.tsx`
- Risk: Performance degradation, silent rendering bugs, visual glitches
- Priority: Medium

**Error Boundary Behavior:**
- What's not tested: Renderer crash handling, recovery from unhandled promise rejections, error reporting flow
- Files: `src/main/src/errorHandling.ts`, `src/renderer/src/` (error boundary components)
- Risk: Silent failures, lost user data, unreported bugs
- Priority: High

**Redux State Serialization:**
- What's not tested: Persistence of complex nested objects, null/undefined edge cases, version upgrades
- Files: `src/main/src/store/ReduxPersistorIPC.ts`
- Risk: Data loss on persistence, broken state after app crash
- Priority: Medium

---

## Security Considerations

**File Protocol in IPC Validation:**
- Risk: `file://` URLs can be spoofed or exploited; custom protocol is more secure
- Files: `src/main/src/ipc.ts` (line 130)
- Current mitigation: URL parsing and hostname allowlist
- Recommendations: Implement custom Electron protocol, validate origin before processing any IPC message, add CORS-like headers

**Hardcoded Allowlist Parsing:**
- Risk: IPv6 address `::1/128` parsed as hostname string may fail in comparison
- Files: `src/main/src/ipc.ts` (line 148)
- Current mitigation: Hostname comparison only
- Recommendations: Use `URL.hostname` property properly, test all loopback variants (127.0.0.1, [::1], ::1)

**Unvalidated Game Discovery:**
- Risk: Game installed via third-party manager misidentified, mod deployed to wrong location
- Files: `src/main/src/Application.ts` (lines 555-563)
- Current mitigation: Check for uninstaller presence
- Recommendations: Add cryptographic signing to installation manifest, validate against Nexus Mods API game database

---

## Dependencies at Risk

**Deprecated Class Component Pattern:**
- Risk: React plans to remove class component lifecycle methods in future versions
- Impact: `MainContext.tsx` and all components inheriting from it must be rewritten
- Migration plan: Migrate to functional components + Context API Provider pattern immediately. This is blocking modern React adoption.

**Electron 37.4.0:**
- Risk: Electron versions update frequently, security patches required regularly
- Impact: Any IPC security issue unfixed becomes exploitable to all users
- Migration plan: Set up automated dependency checking, test each electron patch version before release

**Node-7z Archive Extraction:**
- Risk: Using shell command wrapper for 7z extraction; sandboxing unclear
- Impact: Malicious archives could potentially execute code if 7z CVE exists
- Migration plan: Consider pure JavaScript archive libraries (ZIP/7z) for sandboxing, validate archive structure before extraction

---

## Scaling Limits

**Single-Threaded Main Process:**
- Current capacity: Handles IPC, persistence, error reporting in main thread
- Limit: Heavy parsing (JSON, DuckDB queries) blocks window responsiveness
- Scaling path: Move compute-heavy work to worker threads; use DuckDB's async query API

**Polling-Based Reactivity:**
- Current capacity: DynamicProps polling with 500ms interval works for ~10-50 instances
- Limit: With 100+ dynamic components, polling becomes expensive (CPU, memory)
- Scaling path: Replace with event bus or reactive framework (RxJS, signals)

**Large Mod Lists:**
- Current capacity: Table renders efficiently up to ~1000 rows
- Limit: Beyond 5000 rows, virtualization and memoization gaps cause lag
- Scaling path: Implement row virtualization in Table component, memoize row renderers

---

## Missing Critical Features

**No Installation Rollback:**
- Problem: If multi-phase collection install fails halfway, no automatic cleanup of partially-installed mods
- Blocks: Users cannot safely install large collections with confidence
- Impact: Manual user intervention required to fix corrupt game state

**No Real-Time Phase Progress Reporting:**
- Problem: Collection phase progress not streamed to UI during installation
- Blocks: User cannot see which phase of multi-phase install is active
- Impact: Perceived app freeze during long installations

**No Dependency Conflict Resolution:**
- Problem: If mod A requires v1 of dependency and mod B requires v2, no automatic conflict detection
- Blocks: Installing incompatible collections fails silently
- Impact: Collections fail to install or leave game in broken state

---

## Critical Stability Issues

**Broken Logging in Tests:**
- Status: Logging disabled in test environment with TODO comment
- Files: `src/main/src/logging.ts` (line 118)
- Impact: Test failures produce no logs, debugging integration tests is impossible
- Fix: Re-enable logging to test-specific output, add log capturing to test setup

**Missing Error Context in Promise Chains:**
- Status: `.catch()` handlers lose error context through multiple chaining levels
- Files: `src/renderer/src/extensions/mod_management/InstallManager.ts`, throughout extensions
- Impact: Errors bubble up as empty objects `{}` or are swallowed entirely
- Fix: Add error re-throw in catch blocks or use `.catch(err => { log(); throw err; })`

---

*Concerns audit: 2026-03-30*
