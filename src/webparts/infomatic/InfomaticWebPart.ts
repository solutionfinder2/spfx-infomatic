import * as React from 'react';
import * as ReactDom from 'react-dom';
import { DisplayMode, Version } from '@microsoft/sp-core-library';
import {
  type IPropertyPaneConfiguration,
  PropertyPaneDropdown,
  PropertyPaneSlider,
  PropertyPaneTextField,
  PropertyPaneToggle
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { IReadonlyTheme } from '@microsoft/sp-component-base';

import Infomatic from './components/Infomatic';
import { IInfomaticProps } from './components/IInfomaticProps';
import { getSP } from '../../services/pnpjsConfig';
import type { ThemeMode } from '../../theme/ThemeContext';
import type { AccordionLayout } from '../../components/ContentAccordion';
import type { DocumentViewerLayout } from '../../components/DocumentViewer';

export interface IInfomaticWebPartProps {
  title: string;
  subtitle: string;
  /** Site that holds the list and library (absolute URL); empty = current site. */
  dataSiteUrl: string;
  listTitle: string;
  libraryTitle: string;
  /** Content accordion list (same schema as the Showme Accordion solution). */
  accordionListTitle: string;
  accordionContentField: string;
  accordionCategoryField: string;
  /** 'accordion' | 'sidebarLeft' | 'sidebarRight' | 'tabs' */
  accordionLayout: string;
  /** 'strip' | 'sidebarLeft' | 'sidebarRight' | 'grid' */
  documentLayout: string;
  maxItems: number;
  /** 'site' = follow the SharePoint section theme; 'light' | 'dark' = force. */
  defaultTheme: string;
  showThemeToggle: boolean;
  showFullScreenButton: boolean;
  showRing: boolean;
  showList: boolean;
  showFiles: boolean;
}

export default class InfomaticWebPart extends BaseClientSideWebPart<IInfomaticWebPartProps> {

  private _isDarkTheme: boolean = false;

  public render(): void {
    const defaultTheme: ThemeMode = this.properties.defaultTheme === 'dark' ? 'dark'
      : this.properties.defaultTheme === 'light' ? 'light'
        : (this._isDarkTheme ? 'dark' : 'light');

    const element: React.ReactElement<IInfomaticProps> = React.createElement(
      Infomatic,
      {
        title: this.properties.title,
        subtitle: this.properties.subtitle,
        dataSiteUrl: this.properties.dataSiteUrl,
        listTitle: this.properties.listTitle,
        libraryTitle: this.properties.libraryTitle,
        accordionListTitle: this.properties.accordionListTitle,
        accordionContentField: this.properties.accordionContentField || 'Content',
        accordionCategoryField: this.properties.accordionCategoryField || 'Category',
        accordionLayout: (['accordion', 'sidebarLeft', 'sidebarRight', 'tabs'].indexOf(this.properties.accordionLayout) >= 0
          ? this.properties.accordionLayout : 'accordion') as AccordionLayout,
        documentLayout: (['strip', 'sidebarLeft', 'sidebarRight', 'grid'].indexOf(this.properties.documentLayout) >= 0
          ? this.properties.documentLayout : 'strip') as DocumentViewerLayout,
        maxItems: this.properties.maxItems || 8,
        defaultTheme,
        showThemeToggle: this.properties.showThemeToggle !== false,
        showFullScreenButton: this.properties.showFullScreenButton !== false,
        showRing: this.properties.showRing !== false,
        showList: this.properties.showList !== false,
        showFiles: this.properties.showFiles !== false,
        userDisplayName: this.context.pageContext.user.displayName,
        siteUrl: this.context.pageContext.web.absoluteUrl,
        isEditMode: this.displayMode === DisplayMode.Edit
      }
    );

    ReactDom.render(element, this.domElement);
  }

  // PnPjs must be initialized AFTER super.onInit() completes; otherwise
  // requests on real pages fail with "e.pageContext is undefined".
  protected async onInit(): Promise<void> {
    await super.onInit();
    getSP(this.context);
  }

  protected onThemeChanged(currentTheme: IReadonlyTheme | undefined): void {
    if (!currentTheme) {
      return;
    }
    this._isDarkTheme = !!currentTheme.isInverted;
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: { description: 'Configure Infomatic' },
          groups: [
            {
              groupName: 'Data sources',
              groupFields: [
                PropertyPaneTextField('dataSiteUrl', {
                  label: 'Site URL',
                  description: 'Site that holds the list and the library. Leave empty for the site this page belongs to (on a subsite, lists of the parent site need the parent URL).',
                  placeholder: 'https://contoso.sharepoint.com/sites/Intranet',
                  onGetErrorMessage: (value: string) => {
                    const v = (value || '').trim();
                    return !v || /^https:\/\/[^/\s]+(\/.*)?$/i.test(v) ? '' : 'Enter the full https:// site URL, or leave empty for the current site.';
                  },
                  deferredValidationTime: 500
                }),
                PropertyPaneTextField('listTitle', {
                  label: 'List title',
                  description: 'Rows feed the infographic ring and the list card. Optional columns Description, Icon (Fluent icon name), Category and SortOrder are used when present. Empty = the ring shows the files.',
                  placeholder: 'e.g. Announcements'
                }),
                PropertyPaneTextField('libraryTitle', {
                  label: 'Document library title',
                  description: 'Newest files are shown as tiles. Empty = no files section.',
                  placeholder: 'Documents'
                }),
                PropertyPaneTextField('accordionListTitle', {
                  label: 'Accordion list title',
                  description: 'Rich text sections for the "Sections" screen (same schema as the Showme Accordion: Title, a rich text column, optional Category, SortOrder, Expanded, Display, StartDate, EndDate).',
                  placeholder: 'ContentSections'
                }),
                PropertyPaneTextField('accordionContentField', {
                  label: 'Accordion content column',
                  description: 'Internal name of the rich text column.',
                  placeholder: 'Content'
                }),
                PropertyPaneTextField('accordionCategoryField', {
                  label: 'Accordion category column',
                  description: 'Internal name of the Choice column used for grouping and the filter chips. Enter "none" for no grouping.',
                  placeholder: 'Category'
                }),
                PropertyPaneSlider('maxItems', {
                  label: 'Items per source',
                  min: 1,
                  max: 50,
                  step: 1,
                  showValue: true
                })
              ]
            },
            {
              groupName: 'Appearance',
              groupFields: [
                PropertyPaneTextField('title', { label: 'Title', placeholder: 'Infomatic' }),
                PropertyPaneTextField('subtitle', { label: 'Subtitle' }),
                PropertyPaneDropdown('defaultTheme', {
                  label: 'Default theme',
                  options: [
                    { key: 'site', text: 'Follow the site / section theme' },
                    { key: 'light', text: 'Light' },
                    { key: 'dark', text: 'Dark' }
                  ]
                }),
                PropertyPaneToggle('showThemeToggle', {
                  label: 'Theme switcher',
                  onText: 'Shown — users can switch and their choice is remembered',
                  offText: 'Hidden — the default theme always applies'
                }),
                PropertyPaneToggle('showFullScreenButton', { label: 'Full screen button', onText: 'Shown', offText: 'Hidden' }),
                PropertyPaneToggle('showRing', {
                  label: 'Landing page',
                  onText: 'Ring navigation (up to 8 buttons around the circle)',
                  offText: 'Cards only (list and files side by side)'
                }),
                PropertyPaneToggle('showList', { label: 'List view (via the "List items" disc)', onText: 'Available', offText: 'Hidden' }),
                PropertyPaneToggle('showFiles', { label: 'Files view (via the "Files & folders" disc)', onText: 'Available', offText: 'Hidden' })
              ]
            },
            {
              groupName: 'Styling — accordion',
              groupFields: [
                PropertyPaneDropdown('accordionLayout', {
                  label: 'Layout',
                  options: [
                    { key: 'accordion', text: 'Accordion' },
                    { key: 'sidebarLeft', text: 'Sidebar menu (left)' },
                    { key: 'sidebarRight', text: 'Sidebar menu (right)' },
                    { key: 'tabs', text: 'Tabs by category' }
                  ]
                })
              ]
            },
            {
              groupName: 'Styling — document viewer',
              groupFields: [
                PropertyPaneDropdown('documentLayout', {
                  label: 'Layout',
                  options: [
                    { key: 'strip', text: 'Viewer + file strip' },
                    { key: 'sidebarLeft', text: 'File list (left) + viewer' },
                    { key: 'sidebarRight', text: 'Viewer + file list (right)' },
                    { key: 'grid', text: 'Viewer + gallery grid' }
                  ]
                })
              ]
            }
          ]
        }
      ]
    };
  }
}
