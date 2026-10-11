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

export interface IInfomaticWebPartProps {
  title: string;
  subtitle: string;
  listTitle: string;
  libraryTitle: string;
  maxItems: number;
  /** 'site' = follow the SharePoint section theme; 'light' | 'dark' = force. */
  defaultTheme: string;
  showThemeToggle: boolean;
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
        listTitle: this.properties.listTitle,
        libraryTitle: this.properties.libraryTitle,
        maxItems: this.properties.maxItems || 8,
        defaultTheme,
        showThemeToggle: this.properties.showThemeToggle !== false,
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
                PropertyPaneToggle('showRing', { label: 'Infographic ring', onText: 'Shown', offText: 'Hidden' }),
                PropertyPaneToggle('showList', { label: 'List card', onText: 'Shown', offText: 'Hidden' }),
                PropertyPaneToggle('showFiles', { label: 'Files card', onText: 'Shown', offText: 'Hidden' })
              ]
            }
          ]
        }
      ]
    };
  }
}
