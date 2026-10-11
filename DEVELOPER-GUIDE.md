# Developer Guide — spfx-infomatic (Infomatic)

Neumorphic dashboard that displays a SharePoint list and a document library, with a persisted
light / dark switcher. Cloned from `spfx-starter`; everything the starter guide says about the
toolchain, PnPjs initialisation and the hook → component rule still applies.

**Original asks implemented here:** replicate the starter shell, display data from a list *and* a
library, the look and feel of the neumorphic infographic sample, a theme changer for dark and light
mode. Look for `FEATURE:` comments in the source.

---

## 1. How it was built

```powershell
# copy of spfx-starter without build output / node_modules / .git, then renamed:
#   package.json name, .yo-rc.json, config/package-solution.json (new solution + feature ids),
#   config/config.json bundle, webparts/helloWorld → webparts/infomatic (new web part id),
#   teams/<id>_color|outline.png renamed to the new web part id
npm install
```

Identifiers: solution `42d1a5d1-c689-4dea-a6a9-109cfd535470`, feature
`c8c981da-049d-4383-8656-1e75cac88576`, web part `adea4998-ea77-43b9-b9ee-aa8fece196b1`.

## 2. Folder structure

```
spfx-infomatic/
├── config/package-solution.json      # name / ids / version → .sppkg
├── scripts/create-infomatic-list.ps1 # optional sample list for the ring
├── src/
│   ├── theme/
│   │   ├── neumorphic.module.scss    # DESIGN SYSTEM: tokens (CSS variables) + surfaces, circles, buttons, toggle
│   │   └── ThemeContext.tsx          # ThemeProvider / useTheme — light|dark, localStorage, storage-event sync
│   ├── components/neu/
│   │   ├── index.tsx                 # NeuRoot, NeuCard, NeuPressed, NeuCircle, NeuButton, ThemeToggle, NeuNotice
│   │   ├── NeuRing.tsx (+ .module.scss)   # the sample's arc infographic (centre disc, nodes, beads, list fallback)
│   ├── models/IListItem.ts           # list row (+ optional Description / Icon / Category / SortOrder)
│   ├── models/ILibraryFile.ts        # file row + fileIcon(), formatBytes(), formatDate(), timeAgo()
│   ├── hooks/useListItems.ts         # schema-aware list fetch: ItemCount + fields probe + rows
│   ├── hooks/useLibraryFiles.ts      # newest files of a library (FSObjType eq 0), size / editor
│   ├── services/pnpjsConfig.ts       # PnPjs singleton (re-initialised with every context)
│   └── webparts/infomatic/
│       ├── InfomaticWebPart.ts       # property pane; defaultTheme = site (isInverted) | light | dark
│       ├── InfomaticWebPart.manifest.json
│       └── components/
│           ├── Infomatic.tsx         # header → KPI discs → ring → list card + files card
│           ├── Infomatic.module.scss # layout only (colours come from the design system)
│           └── IInfomaticProps.ts
└── README.md
```

## 3. Architecture

```
SharePoint list ──┐                     ┌─ useListItems ──┐
                  │  REST via PnPjs     │                 ├─► Infomatic.tsx (presentation)
Document library ─┘  getSP(context)     └─ useLibraryFiles┘        │
                                                                   ▼
                                     ThemeProvider → NeuRoot[data-theme] → CSS variables → every Neu* child
```

- **Theme.** `InfomaticWebPart.render()` turns the property *Default theme* and the section theme
  (`onThemeChanged` → `isInverted`) into `defaultMode`. `ThemeProvider` returns the stored user
  choice (`localStorage['infomatic.theme']`) when the switcher is allowed, else `defaultMode`.
  `NeuRoot` writes `data-theme` on the root `div`; `neumorphic.module.scss` sets the variables for
  `.root` (light) and `.root[data-theme='dark']`. Children only ever use `var(--neu-*)`, so no
  component needs to know the mode. Sass `@extend` (not CSS-modules `composes`) is used for class
  inheritance because it is resolved at compile time by the SPFx sass plugin.
- **Ring geometry** (`NeuRing.tsx`): design box 100 × 62, centre (50, 22), node radius 36, bead
  radius 24 — all in % of width; `aspect-ratio: 100 / 62` keeps them proportional. Node *i* of *n*
  sits at angle `180 + i·180/(n−1)` degrees (left → bottom → right). Labels go left of the node for
  angles < 255°, right for > 285°, below otherwise. Under 700 px the arc is hidden and the `<ol>`
  fallback is shown.
- **Hooks** probe the list once (`fields.select('InternalName')`) and select the optional columns only
  when present; both expose `total` (ItemCount) in addition to the rows, so the KPI discs are right
  even when `maxItems` is small. The library hook rejects non-library templates with a readable
  message for editors.

## 4. How to modify

| Task | Where |
|---|---|
| Change colours / shadows | `theme/neumorphic.module.scss` — edit the variables under `.root` (light) and `.root[data-theme='dark']` |
| Add a neumorphic component | `components/neu/index.tsx`, using `neu.raised` / `neu.pressed` / `neu.circle` classes |
| Change the ring size or angles | constants `CX`, `CY`, `R`, `R_IN`, `ASPECT` in `NeuRing.tsx`; disc size in `NeuRing.module.scss` `.centerDisc` |
| Read more list columns | `IListItem.ts` + `LIST_OPTIONAL_COLUMNS`, map in `useListItems.ts`, render in `Infomatic.tsx` |
| Change the file icons | `fileIcon()` in `models/ILibraryFile.ts` |
| Add a property pane setting | `IInfomaticWebPartProps` + `render()` in `InfomaticWebPart.ts`, manifest default, `IInfomaticProps.ts`, consume in `Infomatic.tsx` |
| Reuse the design system in another solution | copy `src/theme/` and `src/components/neu/`; wrap the root in `<ThemeProvider><NeuRoot>…` |

## 5. Run / build

```powershell
npm run start                 # hosted workbench (config/serve.json)
npx tsc --noEmit -p tsconfig.json; npx eslint "src/**/*.{ts,tsx}"
npm run build                 # sharepoint/solution/spfx-infomatic.sppkg
```
