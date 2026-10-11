/** A row from the configured SharePoint list. Optional columns are read only when the list has them. */
export interface IListItem {
  Id: number;
  Title: string;
  Modified?: string;
  /** Author display name (expanded). */
  AuthorName?: string;
  /** Optional columns picked up automatically when present. */
  Description?: string;
  /** Fluent UI icon name (column "Icon"), e.g. "Globe", "Lightbulb". */
  Icon?: string;
  Category?: string;
  SortOrder?: number;
}

/** Columns the list hook looks for beyond Id / Title / Modified / Author. */
export const LIST_OPTIONAL_COLUMNS = ['Description', 'Icon', 'Category', 'SortOrder'];
