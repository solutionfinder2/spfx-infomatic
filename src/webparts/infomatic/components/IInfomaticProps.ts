import type { ThemeMode } from '../../../theme/ThemeContext';

export interface IInfomaticProps {
  title: string;
  subtitle?: string;
  /** Site that holds the list and library; empty = the current site. */
  dataSiteUrl?: string;
  /** SharePoint list read for the ring and the table. Empty = ring shows the files instead. */
  listTitle: string;
  /** Document library read for the file tiles. Empty = no files section. */
  libraryTitle: string;
  /** Rows / files read per source (1–50). */
  maxItems: number;
  /** Theme used until the user picks one with the switcher. */
  defaultTheme: ThemeMode;
  showThemeToggle: boolean;
  showRing: boolean;
  showList: boolean;
  showFiles: boolean;
  userDisplayName: string;
  siteUrl: string;
  isEditMode: boolean;
}
