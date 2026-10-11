import type { ThemeMode } from '../../../theme/ThemeContext';
import type { AccordionLayout } from '../../../components/ContentAccordion';
import type { DocumentViewerLayout } from '../../../components/DocumentViewer';

export interface IInfomaticProps {
  title: string;
  subtitle?: string;
  /** Site that holds the list and library; empty = the current site. */
  dataSiteUrl?: string;
  /** SharePoint list read for the ring and the table. Empty = ring shows the files instead. */
  listTitle: string;
  /** Document library read for the file tiles. Empty = no files section. */
  libraryTitle: string;
  /** Content accordion (Sections screen and any screen declared as `accordion`). */
  accordionListTitle: string;
  accordionContentField: string;
  accordionCategoryField: string;
  accordionLayout: AccordionLayout;
  documentLayout: DocumentViewerLayout;
  /** File shown by single-document screens (empty = newest file). */
  singleDocumentName: string;
  /** Countries reference list (spfx-vector-map schema) for the Countries screen. */
  countriesListTitle: string;
  /** Rows / files read per source (1–50). */
  maxItems: number;
  /** Theme used until the user picks one with the switcher. */
  defaultTheme: ThemeMode;
  showThemeToggle: boolean;
  showFullScreenButton: boolean;
  showRing: boolean;
  showList: boolean;
  showFiles: boolean;
  userDisplayName: string;
  siteUrl: string;
  isEditMode: boolean;
}
