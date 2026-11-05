# Soybean Admin upstream

- Source: https://github.com/soybeanjs/soybean-admin
- Pinned commit: `d2dfefd757e37d8d6077ea1cea6181fb628d6097`
- Upstream package version: `2.3.0`
- License: MIT; the original `LICENSE` is retained.
- Archive: `.nmai/tmp/soybean-admin-d2dfefd.zip` (relative to the project root), downloaded from the official GitHub codeload endpoint for the pinned commit. All archive paths were checked before extraction; the complete workspace is retained without a nested Git repository.

## Toolchain

- Windows PowerShell `5.1.26100.9711`.
- Node `22.18.0` at `D:/AI/numa/node-v22.18.0-win-x64/node.exe`.
- The existing pnpm launcher reports `12.4.2` outside this workspace and automatically selects the pinned `pnpm@12.10.1` inside it. No global toolchain was upgraded.
- Upstream Vite Plus `1.1.0`, Vue `3.5.43`, Vue Router `5.4.0` and the complete pnpm workspace/lockfile are retained.
- Added exact versions: Vitest `5.0.3` (matching Vite Plus's bundled version), Vue Test Utils `2.5.1`, jsdom `26.1.0`, Playwright Test `1.64.1`. The existing workspace Vite override remains active. jsdom `30.1.3` requires Node `22.22.2` or newer on the Node 22 line, so it was not selected.

## Lifecycle audit

Installation used `pnpm --dir growing/console-web install --frozen-lockfile --ignore-scripts`. Root `prepare` runs `vp config --no-agent`; it was deliberately not executed, because it generates tool configuration and hooks unnecessary for the baseline build. Internal workspace package manifests contain no install/prepare lifecycle scripts. Upstream workspace `allowBuilds` explicitly disables `@parcel/watcher`, `esbuild`, `simple-git-hooks` and `vue-demi`. All dependency install scripts were skipped, and the build succeeds without enabling any of them. No hook or agent configuration was installed in the parent repository.

The imported upstream `AGENTS.md` mentions two upstream style skills not supplied in this session. Its original documentation remains in the workspace; no external style skill was installed or activated.

## Verification (2026-11-05)

Executed from the project root:

| Check | Result | Project-relative log |
| --- | --- | --- |
| Frozen upstream install, scripts disabled | Passed | `.nmai/tmp/console-install.log` |
| Unmodified baseline `run typecheck` | Passed (exit 0) | `.nmai/tmp/console-baseline-typecheck.log` |
| Unmodified baseline `run build` | Passed (exit 0, dist generated) | `.nmai/tmp/console-baseline-build.log` |
| Pinned test dependencies installed | Passed | `.nmai/tmp/console-test-deps.log` |
| Vue mount + jsdom click interaction smoke | 1 test passed | `.nmai/tmp/console-toolchain-test.log` |
| Typecheck with test configuration | Passed (exit 0) | `.nmai/tmp/console-toolchain-typecheck.log` |
| Playwright runner smoke | 1 test passed; no browser launched | `.nmai/tmp/console-playwright-smoke.log` |

The temporary smoke test files were removed after checking the toolchain; later tasks add business and browser acceptance tests. The scripts are exactly `vitest run` and `playwright test`. Vitest collects `tests/**/*.test.ts`; Playwright is restricted to `tests/e2e` so it does not load Vitest suites. An initial Playwright discovery attempt without this isolation incorrectly collected the Vitest smoke file; diagnosis is retained in `.nmai/tmp/console-playwright-list.log`.

PowerShell may format pnpm's stderr command banners as `NativeCommandError` records in redirected logs even on successful commands. Results above use actual process exit codes and runner summaries.

This is template/toolchain verification only. No business behavior, login, permissions, live browser pages or production deployment is claimed here. No real AI calls, commits or deployment were performed.
