/**
 * The 8 screens reached from the landing-page ring (1.2.0).
 * Order = position around the circle, clockwise from the top.
 *
 * Each screen declares WHAT it shows through `content` (1.4.0). The content types
 * are reusable building blocks rendered by `ScreenContent.tsx`:
 *   placeholder — "content coming" card
 *   documents   — DocumentViewer over a library (defaults to the web part's library setting)
 *   accordion   — ContentAccordion over a list (defaults to the web part's accordion list setting)
 * Any screen can use any type; set `listTitle` / `libraryTitle` here to point a screen at
 * a different list or library than the one configured in the property pane.
 */
export type ScreenContentDef =
  | { type: 'placeholder' }
  | {
    type: 'documents';
    libraryTitle?: string;
    /** Overrides the property pane "Document viewer layout" for this screen. */
    layout?: 'strip' | 'sidebarLeft' | 'sidebarRight' | 'grid';
    /** One document only — no file picker. */
    single?: boolean;
    /** File name (e.g. "Handbook.pdf") for `single`; defaults to the property pane "Single document", else the newest file. */
    fileName?: string;
  }
  | {
    type: 'accordion';
    listTitle?: string;
    contentField?: string;
    categoryField?: string;
    /** Overrides the property pane "Accordion layout" for this screen. */
    layout?: 'accordion' | 'sidebarLeft' | 'sidebarRight' | 'tabs';
    showSearch?: boolean;
    showFilter?: boolean;
    showExpandCollapse?: boolean;
    /** Open only one section at a time. */
    single?: boolean;
  };

export interface IScreenDef {
  /** Stable key, also used in the browser history state. */
  key: string;
  /** Fluent UI icon name. */
  icon: string;
  label: string;
  caption: string;
  content: ScreenContentDef;
}

export const SCREENS: IScreenDef[] = [
  { key: 'screen-1', icon: 'Ringer', label: 'Screen 1', caption: '01', content: { type: 'placeholder' } },
  { key: 'documents-1', icon: 'DocumentSet', label: 'Documents 1', caption: '02', content: { type: 'documents' } },
  { key: 'documents-2', icon: 'FabricFolder', label: 'Documents 2', caption: '03', content: { type: 'documents' } },
  { key: 'sections-1', icon: 'TextDocument', label: 'Sections 1', caption: '04', content: { type: 'accordion' } },
  { key: 'sections-2', icon: 'BulletedList2', label: 'Sections 2', caption: '05', content: { type: 'accordion' } },
  { key: 'document', icon: 'Page', label: 'Document', caption: '06', content: { type: 'documents', single: true } },
  { key: 'documents-3', icon: 'OpenFolderHorizontal', label: 'Documents 3', caption: '07', content: { type: 'documents' } },
  { key: 'screen-8', icon: 'Rocket', label: 'Screen 8', caption: '08', content: { type: 'placeholder' } }
];
