# Modal Map

A UI concept that **fuses the customer map with the value-network unit view**.

The screen is a full-bleed **customer map** — sterile fill-finish / pharmaceutical
manufacturers (NAICS 325412) plotted across southern Germany, existing customers
in yellow, prospects in white, with a floating account list on the left.

Selecting an account opens a **near-fullscreen modal that spotlights that
company's value network over a blurred, dimmed map** (`backdrop-filter: blur()`
on the dialog scrim, so the live map stays visible but recedes). Inside the modal
two views toggle:

- **Value Network** — the Sterile Fill-Finish value network (6,616 functional
  units, L7 → L3), opened pre-focused on the unit that account's engagement
  centres on. Matched Waldner products, the core functional job, the path schema,
  and the buying centre (ESCO-coded stakeholders + jobs) all render per unit.
- **Needs** — the Outcome-Driven Innovation (ODI) needs matrix for the selected
  unit: every desired outcome scored on importance × satisfaction → opportunity,
  with per-row importance/satisfaction rationale on expand.

## How it's built

| Piece | Source |
| --- | --- |
| `src/components/MapCanvas.tsx` | Leaflet grayscale basemap + branded pins (the sales-hub "company map" pattern) |
| `src/components/CompanyModal.tsx` | The blurred-backdrop, near-fullscreen overlay shell + view toggle |
| `src/components/ValueNetworkPanel.tsx` | Embeddable value-network tree + detail (ported from the Waldner report) |
| `src/components/NeedsPanel.tsx` | Embeddable ODI needs table + opportunity scoring |
| `src/data/`, `src/data.ts` | The Sterile Fill-Finish export from the Node42 graph (copied verbatim) |
| `ui-kit/` | `@node42/ui-kit` source (copied in), aliased so the panels use the real design system |

Everything is self-contained inside this folder — the ui-kit and graph data are
copied in, nothing is referenced from a sibling project.

## Run

```bash
npm install
npm run dev
```

Then open the printed localhost URL and click any account.
