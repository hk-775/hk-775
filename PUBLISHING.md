# Profile publication notes

This is a personal profile and evidence index. Its canonical static page lives in `site/`; the repository README is the GitHub profile introduction.

## Evidence and provenance

- Original profile copy, site, and example driver: MIT-0, selected by the owner.
- AxonLLM tour video is linked from its existing public site. Captions are copied from `hk-775/axonllm` at commit `dbfbc70a56c0be5e8f2c4217c179f28f375f87d8`, under MIT-0.
- The two S06 evidence packages were generated with the commits pinned in the example. They contain synthetic data only. The export replaces the local `artifact_dir` field in each `result.json` with `"."`; hash-chained events and snapshots are unchanged.
- The player explains those recorded results. It does not call any application API, create a WebSocket, or execute the sample.
- The optional operator video is hosted at the existing AxonLLM GitHub Pages origin. It loads only when the visitor interacts with the video.
- Personal employment, headcount, customer adoption, executive authority, and business-outcome figures are excluded pending verified shareable sources.
- AWS services reference architecture: not applicable to this static personal profile and local fixture example. The site does not deploy an AI service. Each linked product maintains its own architecture and deployment documentation.

## Verify

```bash
npm ci
npx playwright install chromium
npm test

cd examples/customer-summary
uv sync --locked
uv run --locked python run.py
uv run --locked escape-lab verify ../../site/evidence/C1
uv run --locked escape-lab verify ../../site/evidence/C4
```

The browser tests exercise the actual `site/` directory beneath `/hk-775/`, check playback and navigation, resolve evidence/media-caption links, test mobile overflow, and assert that the walkthrough makes no external requests or WebSocket connections.

The example is intentionally a local fixture. It has no production authentication mode.

## Hosting

GitHub Pages publishes only `site/`. CI has read-only source permissions; the Pages deployment job alone receives Pages and identity-token write permissions. No AWS infrastructure, package release, or paid resource is created.

To preview locally:

```bash
npm run preview
# http://127.0.0.1:4177/hk-775/
```
