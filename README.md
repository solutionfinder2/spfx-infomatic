# Infomatic (SPFx 1.23.2)

A **neumorphic** ("soft UI") dashboard web part that displays data from a SharePoint **list** and a
**document library**, with a **light / dark switcher** that remembers each user's choice.
Cloned from `spfx-starter` (same toolchain, PnPjs 4, Fluent UI 8 icons) and restyled after the
neumorphic infographic sample: one background colour, depth from a light top-left shadow and a dark
bottom-right shadow, circular icon discs, gradient accent text.

| | |
|---|---|
| Solution | `spfx-infomatic` · 1.0.0.0 |
| Web part | **Infomatic** (Advanced group) — hosts: SharePoint page, full page, Teams tab, Teams personal app |
| Repo | https://github.com/solutionfinder2/spfx-infomatic |

## Features

| Area | What it does |
| --- | --- |
| Header | Gradient title + subtitle, **Refresh**, and the **theme switcher** (sun / moon pill). |
| Theme switcher | Light ↔ dark. The choice is stored per browser (`localStorage` key `infomatic.theme`) and shared by every Infomatic web part; without a choice the web part follows **Default theme** (site / section theme, light or dark). A storage event keeps several web parts on one page in sync. Switcher off = the default always applies. |
| KPI discs | List items (ItemCount), files & folders, size of the latest files, last update ("3 hours ago"). |
| Infographic ring | The sample's layout: a central disc with the title and up to **7 icon circles on an arc** with beads between them, labels alternating left / right. Nodes are the list rows (icon from an `Icon` column — any Fluent UI icon name — else a cycling set; caption from `Category` else "Step 01"; description from `Description` else the modified date). Without a list the ring shows the newest files. Collapses to a vertical list under 700 px. |
| List card | Pressed rows: icon disc, title, description or author · date, category chip, relative time; each row opens the item form; link to the list. |
| Files card | Raised tiles: file-type disc (Word / Excel / PowerPoint / PDF / image / video / …), extension, name, size · relative time; opens the file; link to the library. |
| Schema-aware | Any list works (`Id`, `Title`, `Modified`, `Author` always; `Description`, `Icon`, `Category`, `SortOrder` when present). Any document library works (folders skipped, newest first). Editors see configuration errors; viewers never do. |
| Theme-safe | No Fluent UI surfaces (DetailsList, MessageBar) are used inside the dark surface — everything is drawn with the design-system classes, so dark mode is consistent. |

## Settings (property pane)

| Group | Setting | Default | Notes |
| --- | --- | --- | --- |
| Data sources | List title | empty | Rows for the ring and the list card |
| | Document library title | `Documents` | Newest files for the tiles |
| | Items per source | 8 | 1 – 50 |
| Appearance | Title / Subtitle | Infomatic / … | Gradient title in the header and the ring |
| | Default theme | Follow the site | Site / section theme (`isInverted`), Light, Dark |
| | Theme switcher | Shown | Hidden = users cannot switch |
| | Infographic ring · List card · Files card | Shown | Show / hide each section |

## Design system

`src/theme/neumorphic.module.scss` defines the tokens as CSS variables on `.root` and overrides
them under `.root[data-theme='dark']`:

```
--neu-bg, --neu-bg-raised, --neu-shadow-dark, --neu-shadow-light,
--neu-text, --neu-muted, --neu-line, --neu-accent-1, --neu-accent-2, --neu-accent-soft,
--neu-raise, --neu-raise-sm, --neu-press, --neu-press-sm
```

Classes: `raised`, `raisedSm`, `pressed`, `pressedSm`, `card`, `circle`, `circleSm`, `bead`,
`gradientText`, `button`, `iconButton`, `toggle`, `notice`. React wrappers live in
`src/components/neu` (`NeuRoot`, `NeuCard`, `NeuCircle`, `NeuButton`, `ThemeToggle`, `NeuNotice`,
`NeuRing`). `src/theme/ThemeContext.tsx` provides `ThemeProvider` / `useTheme()`.

## Sample list (optional)

`scripts/create-infomatic-list.ps1` creates a list **InfomaticSteps** (Title, Description, Icon,
Category, SortOrder) with seven generic sample rows so the ring looks like the sample out of the box.
Point **List title** at it.

## Build

```powershell
npm install
npm run start     # dev server → hosted workbench (config/serve.json)
npm run build     # sharepoint/solution/spfx-infomatic.sppkg
```

Quality gates: `npx tsc --noEmit -p tsconfig.json` and `npx eslint "src/**/*.{ts,tsx}"`.

## Version history

| Version | Highlights |
| --- | --- |
| 1.0.0 | Neumorphic design system with light / dark switcher (persisted), list + document-library hooks, KPI discs, infographic ring, list rows, file tiles, property pane (data sources, appearance), sample-list script |
