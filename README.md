# Infomatic (SPFx 1.23.2)

A **neumorphic** ("soft UI") dashboard web part that displays data from a SharePoint **list** and a
**document library**, with a **light / dark switcher** that remembers each user's choice.
Cloned from `spfx-starter` (same toolchain, PnPjs 4, Fluent UI 8 icons) and restyled after the
neumorphic infographic sample: one background colour, depth from a light top-left shadow and a dark
bottom-right shadow, circular icon discs, gradient accent text.

| | |
|---|---|
| Solution | `spfx-infomatic` · 1.4.2.0 |
| Web part | **Infomatic** (Advanced group) — hosts: SharePoint page, full page, Teams tab, Teams personal app |
| Repo | https://github.com/solutionfinder2/spfx-infomatic |

## Features

| Area | What it does |
| --- | --- |
| Header | Gradient title + subtitle, **Refresh**, the **theme switcher** (sun / moon pill) and the **full screen** button. On every page but the landing page the title is replaced by a **Home disc + breadcrumb** that returns to the landing page. |
| Full screen (1.1.0) | Same behaviour as the Biography web part: the web part is pinned under the Microsoft 365 / site header (measured from `#SuiteNavWrapper`, `#spSiteHeader`, …), the page is scrolled to the top, **Esc** or the button exits. Can be hidden per web part. |
| Landing page (1.1.0) | The infographic ring **is the navigation**: **8 icon buttons around the full circle** (clockwise from the top), each opening one of the **8 screens** (1.2.0, defined in `src/webparts/infomatic/screens.ts`; content to come). The **centre disc is a Home button** that always returns to the landing page. The KPI discs *List items* and *Files & folders* open the list and the files view. The browser **Back** button walks the views (`history.pushState`). |
| Screens (1.2.0) | Every view but the landing page uses a two-column shell: a **compact ring on the left** (same 8 buttons, current one highlighted, centre = Home, sticky while scrolling) and the **content on the right**. The 8 screens show a placeholder card and Previous / Landing page / Next buttons until their content is defined. Below 860 px the columns stack. |
| Documents screen (1.3.0) | Screen 2 is a **document viewer** for the configured library (newest 100 files, independent of *Items per source*): viewer surface, current-file row (**Open** in a new tab, **Download**) and a horizontal **file strip** to switch files. **Video** (`mp4` / `webm` / `m4v` / `ogv`) plays in the browser's own player; `mov` / `avi` / `wmv` / `mkv` go through SharePoint's Stream player; audio → `<audio>`; images → `<img>`; PDF / Office / everything else → SharePoint's embed page (`/_layouts/15/embed.aspx?UniqueId=`). |
| Sections screen (1.4.0) | Screen 3 is the **content accordion** — the Showme Accordion rebuilt in the Infomatic style: search (matches title, category and the visible text of the rich content), **category chips** filter, Expand all / Collapse all, sections grouped by category, raised section bars with a disc chevron, pressed rich-text panels with a smooth open / close. Same list schema as `spfx-content-accordion` (`Title`, rich text `Content`, optional `Category`, `SortOrder`, `Expanded`, `Display`, `StartDate` / `EndDate`); missing optional columns switch their feature off; editors see schema hints, viewers never do. |
| Reusable screen blocks (1.4.0) | Every screen declares its content in `src/webparts/infomatic/screens.ts`: `placeholder`, `documents` (document viewer) or `accordion` (content accordion). Any block can be put on any screen, optionally pointed at a different list / library than the property pane settings (`{ type: 'accordion', listTitle: 'Policies' }`). |
| Item page (1.1.0) | Reached from a row of the list view. Hero (icon disc, category caption, title, author · updated), **Open** button when the row has a `Url` hyperlink column, **Open item** (SharePoint form), *Summary* (`Description`), *Content* (rich text column `Content`, rendered as HTML), Previous / Landing page / Next. |
| Theme switcher | Light ↔ dark. The choice is stored per browser (`localStorage` key `infomatic.theme`) and shared by every Infomatic web part; without a choice the web part follows **Default theme** (site / section theme, light or dark). A storage event keeps several web parts on one page in sync. Switcher off = the default always applies. |
| KPI discs | List items (ItemCount), files & folders, size of the latest files, last update ("3 hours ago"). |
| Infographic ring | The sample's look: a central disc with the title, icon circles with beads between them, captions / labels / descriptions placed left, right, above or below depending on the angle. `layout="circle"` (landing page, 8 nodes all around) or `layout="arc"` (the original 7-node half circle). Nodes are the list rows (icon from an `Icon` column — any Fluent UI icon name — else a cycling set; caption from `Category` else "01"; description from `Description`). Without a list the ring shows the newest files. Collapses to a vertical list under 700 px (with a Home entry). |
| List card | Pressed rows: icon disc, title, description or author · date, category chip, relative time; each row opens the item page; link to the list. |
| Files card | Raised tiles: file-type disc (Word / Excel / PowerPoint / PDF / image / video / …), extension, name, size · relative time; opens the file; link to the library. |
| Schema-aware | Any list works (`Id`, `Title`, `Modified`, `Author` always; `Description`, `Icon`, `Category`, `SortOrder`, `Url` (hyperlink), `Content` (rich text) when present). Any document library works (folders skipped, newest first). Editors see configuration errors; viewers never do. |
| Theme-safe | No Fluent UI surfaces (DetailsList, MessageBar) are used inside the dark surface — everything is drawn with the design-system classes, so dark mode is consistent. |

## Settings (property pane)

| Group | Setting | Default | Notes |
| --- | --- | --- | --- |
| Data sources | Site URL (1.0.1) | empty | Site that holds the list and library; empty = the current site. On a subsite, lists of the parent site need the parent URL. Pasted page / list URLs are trimmed to the site |
| | List title | empty | Rows for the ring and the list card |
| | Document library title | `Documents` | Newest files for the tiles and the Documents screen |
| | Accordion list title (1.4.0) | `ContentSections` | Rich text sections for the Sections screen |
| | Accordion content column (1.4.0) | `Content` | Internal name of the rich text column |
| | Accordion category column (1.4.0) | `Category` | Internal name of the Choice column; `none` = no grouping / chips |
| | Items per source | 8 | 1 – 50 |
| Appearance | Title / Subtitle | Infomatic / … | Gradient title in the header and the ring |
| | Default theme | Follow the site | Site / section theme (`isInverted`), Light, Dark |
| | Theme switcher | Shown | Hidden = users cannot switch |
| | Full screen button (1.1.0) | Shown | Hidden = no full-screen mode |
| | Landing page (1.1.0) | Ring navigation | *Ring navigation* = 8 buttons around the circle + KPI discs; *Cards only* = the 1.0 single page (list and files side by side, no navigation) |
| | List view · Files view | Available | Hidden = the KPI disc is not clickable / the card is not shown |
| Styling — accordion | Layout (1.4.1) | Accordion | **Accordion** (groups stacked, sections expand in place) · **Sidebar menu (left / right)** (section titles as a menu, one section in a panel) · **Tabs by category** (the chips become tabs with counts; needs a category column, else falls back to Accordion). A screen can override it in `screens.ts` (`layout`) |
| Styling — document viewer | Layout (1.4.2) | Viewer + file strip | **Viewer + file strip** (horizontal chips below) · **File list (left) + viewer** / **Viewer + file list (right)** (vertical rows beside the viewer, scrollable) · **Viewer + gallery grid** (file tiles below). Per-screen override: `{ type: 'documents', layout: 'grid' }` |

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
| 1.4.2 | Document viewer **Layout** setting (Styling — document viewer): file strip / file list left / file list right / gallery grid, plus a per-screen `layout` override |
| 1.4.1 | Accordion **Layout** setting (Styling — accordion): Accordion / Sidebar menu left / Sidebar menu right / Tabs by category, plus a per-screen `layout` override |
| 1.4.0 | **Sections screen** (screen 3): neumorphic `ContentAccordion` + `useContentSections` (Showme Accordion schema, search, category chips, expand / collapse all, rich text panels); **reusable screen blocks** — `screens.ts` declares `content: placeholder | documents | accordion` per screen and `ScreenContent.tsx` renders them (each block owns its data hook, header Refresh reloads them); properties *Accordion list title / content column / category column* |
| 1.3.0 | **Documents screen** (screen 2): `DocumentViewer` — native `<video>` / `<audio>` / `<img>` for media, SharePoint `embed.aspx?UniqueId=` for PDF / Office / other, Stream player for non-browser video formats; file strip, Open / Download; library hook now returns `UniqueId`; viewer reads up to 100 files |
| 1.2.0 | Ring buttons open **8 dedicated screens** (`screens.ts`, placeholders for now) instead of list items; **compact ring on the left of every screen** (`NeuRing compact`) with the content on the right; screen Previous / Next; item page stays, reached from the list rows |
| 1.1.0 | **Full screen** (Biography behaviour: pinned under the suite / site header, Esc exits, property *Full screen button*); **landing page = ring navigation** with up to **8 buttons around the full circle** (`NeuRing layout="circle"`), **centre disc = Home**; item page (hero, `Url` Open button, `Description`, rich-text `Content`, Previous / Next), list and files views opened from the KPI discs, Home disc + breadcrumb in the header, browser Back support; new optional list columns `Url` and `Content`; `showRing` off = 1.0 cards layout |
| 1.0.1 | Fix: file size is read from `File/Length` (`File_x0020_Size` cannot be `$select`ed and broke every library); **Site URL** setting to read the list / library from another site (`getWeb()` / `normalizeSiteUrl()`); readable "not found on <site>" errors for editors; links follow the data site |
| 1.0.0 | Neumorphic design system with light / dark switcher (persisted), list + document-library hooks, KPI discs, infographic ring, list rows, file tiles, property pane (data sources, appearance), sample-list script |
