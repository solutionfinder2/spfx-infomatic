/**
 * A section of the content accordion — same list schema as the Showme Accordion
 * solution (spfx-content-accordion) so an existing ContentSections list works as is.
 */
export interface IContentSection {
  Id: number;
  Title: string;
  /** Rich text (HTML) body — authored in SharePoint's enhanced rich text column. */
  Content: string;
  Category?: string;
  SortOrder?: number;
  /** Yes/No column: Yes = starts open. */
  Expanded?: boolean;
  /** Yes/No column: No = not rendered (filtered out by the hook). */
  Display?: boolean;
  StartDate?: string;
  EndDate?: string;
}

/** Optional core columns the hook looks for (missing ones switch their feature off). */
export const SECTION_OPTIONAL_COLUMNS = ['SortOrder', 'Expanded', 'Display', 'StartDate', 'EndDate'];

/** Strip HTML so search matches the visible text only. */
export const plainTextOf = (html: string): string => {
  const div = document.createElement('div');
  div.innerHTML = html || '';
  return div.textContent || '';
};
