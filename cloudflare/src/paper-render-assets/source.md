# Paper Diagram Sans

`NotoSansSC-Paper.ttf` is a static weight-400 subset of Noto Sans SC, renamed to Paper Diagram Sans. Distributed under the SIL Open Font License in `OFL-NotoSansSC.txt`.

Upstream: https://github.com/google/fonts/tree/main/ofl/notosanssc

Source font: `NotoSansSC[wght].ttf`, retrieved 2026-11-25. The subset includes ASCII, Greek/mathematical labels, characters in this project's knowledge/unit catalog and common diagram labels. It contains 881 Unicode codepoints; `font-coverage.json` records the exact supported codepoints.

The renderer rejects unsupported characters instead of producing a preview with missing labels. Extend the subset and regenerate its coverage together when adding unsupported subjects/labels. No operating-system fonts or external font requests are required at runtime.

Cloudflare entry setup:

```ts
import wasm from '@resvg/resvg-wasm/index_bg.wasm';
import font from './paper-render-assets/NotoSansSC-Paper.ttf';
await configurePaperDrawingRenderer(wasm,[new Uint8Array(font)]);
```

Wrangler uses its WebAssembly module handling for `*.wasm`. Add a `Data` rule for `**/*.ttf` with `fallthrough: true`. Initialization belongs inside the queue/scheduled handler rather than module top-level I/O.
