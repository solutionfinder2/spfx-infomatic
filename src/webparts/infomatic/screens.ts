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
  | { type: 'documents'; libraryTitle?: string }
  | {
    type: 'accordion';
    listTitle?: string;
    contentField?: string;
    categoryField?: string;
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
  { key: 'documents', icon: 'DocumentSet', label: 'Documents', caption: '02', content: { type: 'documents' } },
  { key: 'sections', icon: 'TextDocument', label: 'Sections', caption: '03', content: { type: 'accordion' } },
  { key: 'screen-4', icon: 'Lightbulb', label: 'Screen 4', caption: '04', content: { type: 'placeholder' } },
  { key: 'screen-5', icon: 'Contact', label: 'Screen 5', caption: '05', content: { type: 'placeholder' } },
  { key: 'screen-6', icon: 'PieDouble', label: 'Screen 6', caption: '06', content: { type: 'placeholder' } },
  { key: 'screen-7', icon: 'Settings', label: 'Screen 7', caption: '07', content: { type: 'placeholder' } },
  { key: 'screen-8', icon: 'Rocket', label: 'Screen 8', caption: '08', content: { type: 'placeholder' } }
];
