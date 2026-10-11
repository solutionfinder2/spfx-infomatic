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
- **Ring geometry** (`NeuRing.tsx`, two layouts selected by the `layout` prop). All numbers are % of
  the ring width; `toTop(y) = y / aspect` converts to % of height and `aspect-ratio` is set inline.
  - `arc` (1.0 look): box 100 × 62, centre (50, 22), node radius 36, bead radius 24, up to 7 nodes
    at `180 + i·180/(n−1)`° (left → bottom → right).
  - `circle` (1.1 landing page): box 100 × 92, centre (50, 50), node radius 34, bead radius 23, up
    to 8 nodes at `90 − i·360/n`° (clockwise from the top).
  - `compact` (1.2 side navigation): box 100 × 100, centre (50, 50), node radius 37, bead radius 25,
    88 px centre disc (Home icon + title), 44 px node discs, labels only above / below (no horizontal
    overflow, so the column stays 320 px), never collapses to the list fallback.
  - Label side from the angle: `cos ≥ 0.45` → right, `cos ≤ −0.45` → left, else above (`sin > 0`)
    or below. `active` nodes get the pressed disc + accent label. `onCenterClick` turns the centre
    disc into a `<button>` (the Home link) and adds a Home entry to the `<ol>` fallback (< 700 px).
- **Views** (`Infomatic.tsx`): `type View = home | screen(index) | list | files | item(id)`. `go(view)`
  pushes `{ infomatic: view }` with `history.pushState`, a `popstate` listener restores it, so the
  browser Back button works and a reload lands on the last view. The landing page renders the circle
  ring (nodes → `go(screen i)`) and KPI discs (→ `go(list)` / `go(files)`); list rows → `go(item)`.
  Every other view is wrapped by `shell()` — `.shell` grid `320px minmax(0,1fr)`: compact ring in a
  sticky `<aside>` on the left, content on the right (stacks < 860 px) — and shows the Home disc +
  breadcrumb in the header. `showRing=false` renders the 1.0 single page instead.
- **Screens** (1.2.0 / 1.4.0): `src/webparts/infomatic/screens.ts` exports `SCREENS: IScreenDef[]`
  (key, icon, label, caption, **content**) in ring order (clockwise from the top).
  `content: ScreenContentDef` is a discriminated union — `{ type: 'placeholder' }`,
  `{ type: 'documents', libraryTitle? }`, `{ type: 'accordion', listTitle?, contentField?,
  categoryField?, showSearch?, showFilter?, showExpandCollapse?, single? }`. Optional titles
  override the property pane defaults, so one block can appear on several screens with different
  sources. `components/ScreenContent.tsx` is the dispatcher: `DocumentsBlock` and `AccordionBlock`
  are small components that **own their data hook** (`useLibraryFiles` top 100 /
  `useContentSections`), mount when the screen opens and reload when `reloadToken` changes (bumped
  by the header Refresh). To add a new block type: extend `ScreenContentDef`, write a `XxxBlock`
  that calls its hook and renders a `NeuCard`, add a `case` to the switch.
- **Country explorer** (1.6.0, block type `countries`):
  - `hooks/useCountryList(listTitle, siteUrl)` is **schema-driven**: it reads the visible, writable
    columns (`fields.select('InternalName','Title','TypeAsString','Hidden','ReadOnlyField','RichText')`),
    skips `UNSUPPORTED_FIELD_TYPES`, builds `$select` / `$expand` per type (Lookup/User → `X/Id`,
    `X/Title` (+ `X/EMail`), capped at 11 lookups to stay under SharePoint's threshold), and returns
    `rows: ICountryRow[]` (Id, Title, Alpha2, Numeric, Continent, FlagUrl, Latitude, Longitude +
    `values` = the raw row) and `fields: IFieldMeta[]`. Results are cached per `site|title` in a
    module-level promise; Refresh bypasses it.
  - `services/worldShapes.ts` (ported from spfx-vector-map): `WORLD_FEATURES` decoded once from
    `world-atlas/countries-110m.json`, `featureByNumeric()` (ids normalised — "004" ≡ "4"),
    `continentOfGeo()` (centroid → `utils/getContinent`), `fitCountry()` (centre + scale framing one
    shape in the 800×400 geoEqualEarth map), `CONTINENT_VIEWS`, `CONTINENT_COLORS`, `shadeFor()`
    mixing fill / hover / selected / tint for the neumorphic light and dark surfaces.
  - `components/CountryMap.tsx`: `ComposableMap` + `ZoomableGroup` + `Geographies`; framing = country
    (`fitCountry`) → continent (`CONTINENT_VIEWS`) → world. Shape continent = the list row's
    `Continent` when the shape has a row, else the geometric classification. Out-of-focus continents
    are muted + 55 % opacity; the wrapper background is the continent tint. `onSelectShape(numeric)`.
  - `components/CountryExplorer.tsx`: state `continent` + `countryId`; `pickContinent` clears a
    country outside it, `pickCountry` sets the continent from the row; two native `<select>`s styled
    as pressed pills (Fluent Dropdown would break the dark surface); legend chips; facts split into
    `scalars` (grid), `notes` (Note columns that are rich text / HTML / > 120 chars → one card each,
    SVG text skipped) and `images` (Thumbnail columns via `imageUrl()`); `COUNTRY_HERO_COLUMNS` go to
    the hero, `COUNTRY_SKIP_COLUMNS` are hidden. `Value` formats by `TypeAsString`.
  - `src/declarations.d.ts` declares `*.json` so the TopoJSON import type-checks.
- **Content accordion** (1.4.0): `hooks/useContentSections(listTitle, { contentField, categoryField,
  siteUrl, max, useSchedule })` is the Showme Accordion loader on the Infomatic plumbing
  (`getWeb(site)`, fields probe, select only existing columns, Display / schedule filter, SortOrder
  sort, limit) returning `{ sections, loading, error, checked, contentMissing, hasCategory,
  missingOptional, hiddenByLimit, refresh }`. `components/ContentAccordion.tsx` is presentation only:
  search (plain text of the HTML via `plainTextOf`), category chips (`role=tablist`), expand /
  collapse all, groups, `aria-expanded` section bars, panels animated with the
  `grid-template-rows: 0fr → 1fr` trick (no height measuring), rich text in a pressed surface with
  `:global()` element styles. `single` = one open section at a time. `layout: AccordionLayout`
  (1.4.1) — `sidebarLeft` / `sidebarRight` render `.sidebarWrap` (grid `260px | 1fr`, `order` flips
  for right) with a `selectedId` kept valid by an effect (first Expanded, else first visible) and
  no expand / collapse buttons; `tabs` turns the chips into tabs (no "All", count badge, active tab
  kept valid) and renders only the active group — it silently falls back to `accordion` when the list
  has no category column. The web part property `accordionLayout` is the default; a screen's
  `content.layout` overrides it.
- **Document viewer** (1.3.0, `components/DocumentViewer.tsx`, screen `documents`): `fileKind(ext)` in
  `models/ILibraryFile.ts` decides the renderer — `video` → `<video src=origin+FileRef>` when
  `isNativeVideo(ext)` (mp4 / webm / m4v / ogv) else the SharePoint embed page (Stream player);
  `audio` → `<audio>`; `image` → `<img>`; `pdf` / `office` / `text` / `other` → `<iframe
  src="<site>/_layouts/15/embed.aspx?UniqueId=<guid>">`. `UniqueId` is now selected by
  `useLibraryFiles`. The viewer gets its own hook instance (`viewerLibrary`, top 100) so it is not
  limited by *Items per source*; `refresh` reloads all three hooks. A spinner overlays the iframe
  until `onLoad`. Every file has Open (`?web=1`) and Download (`?download=1`) buttons as fallback
  when an embed is blocked (e.g. `.ai` / `.eps` have no preview). `layout: DocumentViewerLayout`
  (1.4.2) picks the file picker: `strip` (horizontal chips), `sidebarLeft` / `sidebarRight`
  (`.sidebarWrap` grid `280px | 1fr`, vertical rows in a scrollable `<nav>`, `order` flips for
  right, stacks < 760 px), `grid` (`auto-fill minmax(150px, 1fr)` tiles). The viewer, current-file
  row and renderers are shared by all layouts. Web part property `documentLayout` is the default; a
  screen's `content.layout` overrides it. `single` (1.5.0) drops the picker and shows one file:
  `fileName` matched case-insensitively against the leaf name, the server-relative URL or its tail;
  no match → newest file plus an editor-only notice. The screen def's `fileName` wins over the web
  part property `singleDocumentName`. Note the match runs over the newest 100 files the block loads.
- **Full screen** (1.1.0): copied from the Biography web part — `isFullScreen` toggles
  `neu.fullScreenMode` (fixed, inset 0, z-index 100000) on `NeuRoot`, `fullScreenTop` is the max
  `bottom` of `#SuiteNavWrapper, #SuiteNavPlaceholder, #SuiteNavPlaceHolder, #O365_NavHeader,
  #spSiteHeader` (re-measured on resize), `scrollTo(0,0)` on enter, Esc exits.
- **Site URL** (1.0.1): `services/pnpjsConfig.ts` `normalizeSiteUrl()` + `getWeb(siteUrl?)` →
  `Web([sp.web, url])` or `sp.web`; both hooks take a trailing `siteUrl` and have it in their deps.
  Library size comes from `File/Length` with `$expand=File` — `File_x0020_Size` is a computed view
  field and the REST items endpoint rejects it in `$select`.
- **Hooks** probe the list once (`fields.select('InternalName')`) and select the optional columns only
  when present (`Description`, `Icon`, `Category`, `SortOrder`, `Url` → `{Url, Description}` is
  flattened to `Url` / `UrlText`, `Content`); both expose `total` (ItemCount) in addition to the rows, so the KPI discs are right
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
