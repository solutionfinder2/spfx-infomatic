/**
 * FEATURE (ask: screen 1 — "a cascaded drop down for continents that cascades to
 * countries for that continent, display the data from the list, and the vector map for
 * the selected country as well as the continent in relation to the dropdown").
 *
 * Continent select → Country select (filtered) → map framing + facts. Clicking a shape
 * on the map selects the matching row (and its continent). Facts are rendered from the
 * list schema: every visible column with a value, formatted by its type.
 */
import * as React from 'react';
import { Icon, Spinner, SpinnerSize } from '@fluentui/react';
import styles from './CountryExplorer.module.scss';
import { neu, NeuButton, NeuCard, NeuCircle, NeuNotice } from './neu';
import { CountryMap } from './CountryMap';
import { useTheme } from '../theme/ThemeContext';
import type { IUseCountryListResult } from '../hooks/useCountryList';
import { COUNTRY_HERO_COLUMNS, COUNTRY_SKIP_COLUMNS, ICountryRow, IFieldMeta, imageUrl } from '../models/ICountryRow';
import { Continent } from '../utils/getContinent';
import { CONTINENTS, continentShade, normalizeNumeric } from '../services/worldShapes';
import { formatDate } from '../models/ILibraryFile';

export interface ICountryExplorerProps {
  data: IUseCountryListResult;
  listTitle: string;
  /** Absolute URL of the data site (for links to the item). */
  siteUrl: string;
  isEditMode: boolean;
}

/* ---------- value formatting by column type ---------- */

type Lookup = { Id?: number; Title?: string; EMail?: string };
const asArray = (v: unknown): unknown[] => Array.isArray(v) ? v : v && typeof v === 'object' && Array.isArray((v as { results?: unknown[] }).results) ? (v as { results: unknown[] }).results : v === undefined || v === null ? [] : [v];

const isEmpty = (v: unknown): boolean =>
  v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0) ||
  (typeof v === 'object' && !Array.isArray(v) && Object.keys(v as object).length === 0);

const looksLikeHtml = (s: string): boolean => /<\/?[a-z][\s\S]*>/i.test(s);

const text = (v: unknown): string => {
  if (typeof v === 'string') { return v.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim(); }
  if (typeof v === 'number') { return v.toLocaleString(); }
  if (typeof v === 'boolean') { return v ? 'Yes' : 'No'; }
  return v === undefined || v === null ? '' : String(v);
};

const Value: React.FC<{ field: IFieldMeta; value: unknown }> = ({ field, value }) => {
  switch (field.type) {
    case 'Boolean': return <>{value ? 'Yes' : 'No'}</>;
    case 'DateTime': return <>{formatDate(String(value))}</>;
    case 'Number': case 'Currency': return <>{typeof value === 'number' ? value.toLocaleString() : text(value)}</>;
    case 'MultiChoice': return <>{asArray(value).map(text).filter(Boolean).join(', ')}</>;
    case 'URL': {
      const u = value as { Url?: string; Description?: string };
      return u && u.Url ? <a className={neu.link} href={u.Url} target="_blank" rel="noopener noreferrer">{u.Description || u.Url} <Icon iconName="OpenInNewWindow" /></a> : <>{text(value)}</>;
    }
    case 'Lookup': case 'LookupMulti':
      return <>{asArray(value).map(l => (l as Lookup).Title || '').filter(Boolean).join(', ')}</>;
    case 'User': case 'UserMulti':
      return (
        <>
          {asArray(value).map((u, i) => {
            const p = u as Lookup;
            return <span key={p.Id || i}>{i > 0 ? ', ' : ''}{p.EMail ? <a className={neu.link} href={`mailto:${p.EMail}`}>{p.Title}</a> : p.Title}</span>;
          })}
        </>
      );
    default: return <>{text(value)}</>;
  }
};

/* ---------- component ---------- */

export const CountryExplorer: React.FC<ICountryExplorerProps> = ({ data, listTitle, siteUrl, isEditMode }) => {
  const { rows, fields, loading, error, checked } = data;
  const { isDark } = useTheme();
  const [continent, setContinent] = React.useState<string>('');
  const [countryId, setCountryId] = React.useState<number | undefined>(undefined);
  const [hover, setHover] = React.useState<{ name?: string; continent?: Continent }>({});

  // continents present in the list, in the canonical order, then anything unexpected
  const continents = React.useMemo(() => {
    const present = new Set(rows.map(r => r.Continent).filter(Boolean) as string[]);
    const ordered = CONTINENTS.filter(c => present.has(c)) as string[];
    Array.from(present).filter(c => ordered.indexOf(c) < 0).sort().forEach(c => ordered.push(c));
    return ordered;
  }, [rows]);

  const countries = React.useMemo(() => (continent ? rows.filter(r => r.Continent === continent) : rows), [rows, continent]);
  const selected: ICountryRow | undefined = countryId === undefined ? undefined : rows.filter(r => r.Id === countryId)[0];

  // the continent select drives the country select; a country outside the continent is dropped
  const pickContinent = (c: string): void => {
    setContinent(c);
    if (selected && c && selected.Continent !== c) { setCountryId(undefined); }
  };
  const pickCountry = (id: number | undefined): void => {
    setCountryId(id);
    const row = id === undefined ? undefined : rows.filter(r => r.Id === id)[0];
    if (row && row.Continent) { setContinent(row.Continent); }
  };

  const byNumeric = React.useMemo(() => {
    const out: Record<string, ICountryRow> = {};
    rows.forEach(r => { const k = normalizeNumeric(r.Numeric); if (k) { out[k] = r; } });
    return out;
  }, [rows]);
  const continentByNumeric = React.useMemo(() => {
    const out: Record<string, Continent> = {};
    Object.keys(byNumeric).forEach(k => { const c = byNumeric[k].Continent; if (c && CONTINENTS.indexOf(c as Continent) >= 0) { out[k] = c as Continent; } });
    return out;
  }, [byNumeric]);
  const knownNumerics = React.useMemo(() => {
    const out: Record<string, boolean> = {};
    Object.keys(byNumeric).forEach(k => { out[k] = true; });
    return out;
  }, [byNumeric]);

  const onSelectShape = (numeric: string): void => {
    const row = byNumeric[numeric];
    if (row) { pickCountry(row.Id); }
  };

  const continentOk = continent && CONTINENTS.indexOf(continent as Continent) >= 0 ? (continent as Continent) : undefined;
  const shade = continentOk ? continentShade(continentOk, isDark) : undefined;

  /* ---------- facts from the schema ---------- */
  const fieldByName = React.useMemo(() => {
    const m: Record<string, IFieldMeta> = {};
    fields.forEach(f => { m[f.internalName] = f; });
    return m;
  }, [fields]);

  const facts = React.useMemo(() => {
    if (!selected) { return { scalars: [] as IFieldMeta[], notes: [] as IFieldMeta[], images: [] as IFieldMeta[] }; }
    const scalars: IFieldMeta[] = [];
    const notes: IFieldMeta[] = [];
    const images: IFieldMeta[] = [];
    fields.forEach(f => {
      if (COUNTRY_HERO_COLUMNS.indexOf(f.internalName) >= 0 || COUNTRY_SKIP_COLUMNS.indexOf(f.internalName) >= 0) { return; }
      const v = selected.values[f.internalName];
      if (isEmpty(v)) { return; }
      if (f.type === 'Thumbnail') { images.push(f); return; }
      if (f.type === 'Note') {
        const s = String(v);
        if (/^\s*<svg/i.test(s)) { return; }
        if (f.richText || looksLikeHtml(s) || s.length > 120) { notes.push(f); return; }
      }
      scalars.push(f);
    });
    return { scalars, notes, images };
  }, [selected, fields]);

  const listRoot = selected && selected.FlagUrl ? selected.FlagUrl.split('/Attachments/')[0] : undefined;
  const itemHref = (r: ICountryRow): string => `${siteUrl}/Lists/${encodeURIComponent(listTitle)}/DispForm.aspx?ID=${r.Id}`;
  const hero = (name: string): unknown => (selected ? selected.values[name] : undefined);

  if (!listTitle) {
    return <NeuNotice kind={isEditMode ? 'warn' : 'info'}>{isEditMode ? 'Set the Countries list title in the property pane.' : 'No countries list configured.'}</NeuNotice>;
  }

  return (
    <div className={styles.root}>
      {isEditMode && error && <NeuNotice kind="warn">List &quot;{listTitle}&quot;: {error}</NeuNotice>}
      {isEditMode && checked && !error && rows.length > 0 && !fieldByName.Continent && <NeuNotice kind="warn">The list has no <strong>Continent</strong> column — the continent dropdown is empty. Add a Choice column named Continent.</NeuNotice>}

      {/* ---- cascading selects ---- */}
      <div className={styles.controls}>
        <label className={`${neu.pressedSm} ${styles.select}`}>
          <Icon iconName="World" className={styles.selectIcon} />
          <select value={continent} onChange={e => pickContinent(e.target.value)} aria-label="Continent" disabled={loading && rows.length === 0}>
            <option value="">All continents</option>
            {continents.map(c => <option key={c} value={c}>{c} ({rows.filter(r => r.Continent === c).length})</option>)}
          </select>
          <Icon iconName="ChevronDown" className={styles.selectChevron} />
        </label>
        <label className={`${neu.pressedSm} ${styles.select}`}>
          <Icon iconName="Flag" className={styles.selectIcon} />
          <select value={countryId === undefined ? '' : String(countryId)} onChange={e => pickCountry(e.target.value ? Number(e.target.value) : undefined)} aria-label="Country" disabled={countries.length === 0}>
            <option value="">{continent ? `All of ${continent} (${countries.length})` : `Select a country (${countries.length})`}</option>
            {countries.map(r => <option key={r.Id} value={r.Id}>{r.Title}</option>)}
          </select>
          <Icon iconName="ChevronDown" className={styles.selectChevron} />
        </label>
        {(continent || selected) && <NeuButton icon="ClearFilter" title="Reset" onClick={() => { setContinent(''); setCountryId(undefined); }} />}
      </div>

      {/* ---- continent legend (clickable) ---- */}
      <div className={styles.legend} role="tablist" aria-label="Continents">
        {continents.map(c => {
          const ok = CONTINENTS.indexOf(c as Continent) >= 0;
          const s = ok ? continentShade(c as Continent, isDark) : undefined;
          const active = continent === c;
          return (
            <button key={c} type="button" role="tab" aria-selected={active} className={`${active ? neu.pressedSm : neu.raisedSm} ${styles.legendChip}`} onClick={() => pickContinent(active ? '' : c)} style={active && s ? { color: s.text } : undefined}>
              <span className={styles.legendDot} style={{ background: s ? s.base : 'var(--neu-muted)' }} />{c}
            </button>
          );
        })}
      </div>

      {/* ---- map ---- */}
      <div className={`${neu.pressed} ${styles.mapWrap}`}>
        {loading && rows.length === 0 && <div className={styles.mapOverlay}><Spinner size={SpinnerSize.large} label="Loading countries…" /></div>}
        <CountryMap continent={continentOk} selectedNumeric={selected ? selected.Numeric : undefined} continentByNumeric={continentByNumeric} knownNumerics={knownNumerics} onSelectShape={onSelectShape} onHover={(n, c) => setHover({ name: n, continent: c })} />
        <div className={styles.mapCaption}>
          {hover.name
            ? <span>{hover.name}{hover.continent ? ` · ${hover.continent}` : ''}</span>
            : selected ? <span>{selected.Title}{selected.Continent ? ` · ${selected.Continent}` : ''}</span>
              : continent ? <span>{continent} · {countries.length} countries</span>
                : <span>{rows.length} countries · click a country or use the dropdowns</span>}
        </div>
      </div>

      {/* ---- selected country ---- */}
      {selected && (
        <>
          <div className={`${neu.raised} ${styles.hero}`} style={shade ? { boxShadow: undefined } : undefined}>
            {selected.FlagUrl
              ? <img className={`${neu.pressedSm} ${styles.flag}`} src={selected.FlagUrl} alt={`Flag of ${selected.Title}`} />
              : <NeuCircle icon="Flag" size={72} />}
            <div className={styles.heroText}>
              {selected.Continent && <span className={styles.caption} style={shade ? { color: shade.text } : undefined}>{selected.Continent}{hero('Region') ? ` · ${text(hero('Region'))}` : ''}{hero('SubRegion') ? ` · ${text(hero('SubRegion'))}` : ''}</span>}
              <h3 className={styles.heroTitle}>{selected.Title}</h3>
              <span className={styles.heroMeta}>
                {[text(hero('OfficialName')), text(hero('NativeName')) && text(hero('NativeName')) !== selected.Title ? text(hero('NativeName')) : '', hero('Capital') ? `Capital: ${text(hero('Capital'))}` : '', [selected.Alpha2, text(hero('Alpha3'))].filter(Boolean).join(' / ')].filter(Boolean).join(' · ')}
              </span>
              <div className={styles.heroActions}>
                {fields.filter(f => f.type === 'URL' && !isEmpty(selected.values[f.internalName])).map(f => {
                  const u = selected.values[f.internalName] as { Url: string; Description?: string };
                  return <NeuButton key={f.internalName} icon="Link" text={f.title} title={u.Url} href={u.Url} />;
                })}
                <NeuButton icon="EntryView" text="Open item" title="Open the list item" href={itemHref(selected)} />
              </div>
            </div>
          </div>

          {facts.scalars.length > 0 && (
            <NeuCard title="Facts" meta={`${facts.scalars.length} fields`}>
              <dl className={styles.facts}>
                {facts.scalars.filter(f => f.type !== 'URL').map(f => (
                  <div key={f.internalName} className={`${neu.pressedSm} ${styles.fact}`}>
                    <dt>{f.title}</dt>
                    <dd><Value field={f} value={selected.values[f.internalName]} /></dd>
                  </div>
                ))}
              </dl>
            </NeuCard>
          )}

          {facts.images.length > 0 && (
            <div className={styles.images}>
              {facts.images.map(f => {
                const src = imageUrl(selected.values[f.internalName], listRoot, selected.Id);
                return src ? <figure key={f.internalName} className={`${neu.raisedSm} ${styles.figure}`}><img src={src} alt={f.title} /><figcaption>{f.title}</figcaption></figure> : null;
              })}
            </div>
          )}

          {facts.notes.map(f => {
            const v = String(selected.values[f.internalName]);
            return (
              <NeuCard key={f.internalName} title={f.title}>
                {looksLikeHtml(v)
                  ? <div className={`${neu.pressedSm} ${styles.richText}`} dangerouslySetInnerHTML={{ __html: v }} />
                  : <div className={`${neu.pressedSm} ${styles.richText}`}>{v.split(/\r?\n/).map((line, i) => <p key={i}>{line}</p>)}</div>}
              </NeuCard>
            );
          })}
        </>
      )}

      {/* ---- continent overview when no country is selected ---- */}
      {!selected && continent && countries.length > 0 && (
        <NeuCard title={continent} meta={`${countries.length} countries`}>
          <div className={styles.countryGrid}>
            {countries.map(r => (
              <button key={r.Id} type="button" className={`${neu.raisedSm} ${styles.countryTile}`} onClick={() => pickCountry(r.Id)} title={r.Title}>
                {r.FlagUrl ? <img className={styles.tileFlag} src={r.FlagUrl} alt="" /> : <Icon iconName="Flag" className={styles.tileIcon} />}
                <span className={styles.tileName}>{r.Title}</span>
              </button>
            ))}
          </div>
        </NeuCard>
      )}
      {!loading && checked && !error && rows.length === 0 && <div className={styles.empty}>No countries in &quot;{listTitle}&quot;.</div>}
    </div>
  );
};

export default CountryExplorer;
