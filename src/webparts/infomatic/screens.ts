/**
 * The 8 screens reached from the landing-page ring (1.2.0).
 * Order = position around the circle, clockwise from the top.
 * Content for each screen is still to be defined — edit `label` / `caption` / `icon`
 * here and render the body in `ScreenContent` (Infomatic.tsx).
 */
export interface IScreenDef {
  /** Stable key, also used in the browser history state. */
  key: string;
  /** Fluent UI icon name. */
  icon: string;
  label: string;
  caption: string;
}

export const SCREENS: IScreenDef[] = [
  { key: 'screen-1', icon: 'Ringer',    label: 'Screen 1', caption: '01' },
  { key: 'documents', icon: 'DocumentSet', label: 'Documents', caption: '02' },
  { key: 'screen-3', icon: 'Globe',     label: 'Screen 3', caption: '03' },
  { key: 'screen-4', icon: 'Lightbulb', label: 'Screen 4', caption: '04' },
  { key: 'screen-5', icon: 'Contact',   label: 'Screen 5', caption: '05' },
  { key: 'screen-6', icon: 'PieDouble', label: 'Screen 6', caption: '06' },
  { key: 'screen-7', icon: 'Settings',  label: 'Screen 7', caption: '07' },
  { key: 'screen-8', icon: 'Rocket',    label: 'Screen 8', caption: '08' }
];
