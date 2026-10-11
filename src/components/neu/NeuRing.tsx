/**
 * Infographic ring.
 *   layout="arc"    — the sample: central disc, up to 7 nodes on the lower half-circle.
 *   layout="circle" — navigation: up to 8 nodes all the way around the disc (1.1.0).
 *   compact         — small version for the side navigation (1.2.0): 44px discs, labels
 *                     above / below only (no horizontal overflow), never collapses to a list.
 * Positions are percentages of a design box (aspect-ratio keeps them proportional);
 * below 700px the full-size ring is rendered as a plain list instead.
 */
import * as React from 'react';
import { Icon } from '@fluentui/react';
import { neu, NeuCircle } from './index';
import styles from './NeuRing.module.scss';

export interface IRingNode {
  key: string | number;
  icon: string;
  label: string;
  description?: string;
  /** Small caption above the label ("Step 01", a category, a date). */
  caption?: string;
  href?: string;
  onClick?: () => void;
  /** Highlighted node (current view). */
  active?: boolean;
}

export interface INeuRingProps {
  title: string;
  subtitle?: string;
  nodes: IRingNode[];
  layout?: 'arc' | 'circle';
  /** Small side-navigation version (forces the circle layout). */
  compact?: boolean;
  /** Maximum nodes drawn (default 7 for arc, 8 for circle). */
  max?: number;
  /** Makes the centre disc a button (e.g. back to the landing page). */
  onCenterClick?: () => void;
  centerTitle?: string;
  /** Icon shown under the title in the centre when it is clickable. */
  centerIcon?: string;
  className?: string;
}

interface IGeometry { cx: number; cy: number; r: number; rIn: number; aspect: number; disc: number; node: number }

/* all values in % of the container width; `aspect` = height / width; disc / node in px */
const ARC: IGeometry = { cx: 50, cy: 22, r: 36, rIn: 24, aspect: 0.62, disc: 190, node: 74 };
const CIRCLE: IGeometry = { cx: 50, cy: 50, r: 34, rIn: 23, aspect: 0.92, disc: 210, node: 74 };
const COMPACT: IGeometry = { cx: 50, cy: 50, r: 37, rIn: 25, aspect: 1, disc: 88, node: 44 };

type Side = 'left' | 'right' | 'top' | 'bottom';

export const NeuRing: React.FC<INeuRingProps> = ({ title, subtitle, nodes, layout = 'arc', compact, max, onCenterClick, centerTitle, centerIcon, className }) => {
  const circle = compact || layout === 'circle';
  const g = compact ? COMPACT : circle ? CIRCLE : ARC;
  const limit = Math.max(1, Math.min(max || (circle ? 8 : 7), 12));
  const shown = nodes.slice(0, limit);
  const n = shown.length;

  const toTop = (yPctOfWidth: number): string => `${(yPctOfWidth / g.aspect).toFixed(2)}%`;
  const polar = (deg: number, r: number): { x: number; y: number } => {
    const rad = (deg * Math.PI) / 180;
    return { x: g.cx + r * Math.cos(rad), y: g.cy - r * Math.sin(rad) };
  };
  // arc: left → bottom → right; circle: clockwise from the top
  const angle = (i: number): number => (circle
    ? 90 - (i * 360) / Math.max(n, 1)
    : n === 1 ? 270 : 180 + (i * 180) / (n - 1));
  const side = (deg: number): Side => {
    const rad = (deg * Math.PI) / 180;
    const c = Math.cos(rad);
    const s = Math.sin(rad);
    if (compact) { return s > 0.01 ? 'top' : 'bottom'; }
    if (c >= 0.45) { return 'right'; }
    if (c <= -0.45) { return 'left'; }
    return s > 0 ? 'top' : 'bottom';
  };

  const beads: { x: number; y: number; big: boolean }[] = [];
  const segments = circle ? n : n - 1;
  for (let i = 0; i < segments; i++) {
    const a0 = angle(i);
    const a1 = circle && i === n - 1 ? angle(0) - 360 : angle(i + 1);
    beads.push({ ...polar((a0 + a1) / 2, g.rIn), big: false });
    beads.push({ ...polar(a0, g.rIn), big: true });
  }
  if (!circle && n > 1) { beads.push({ ...polar(angle(n - 1), g.rIn), big: true }); }

  const centerBody = compact
    ? (
      <div className={styles.centerText}>
        {onCenterClick && <Icon iconName={centerIcon || 'Home'} className={styles.centerIconCompact} />}
        <span className={`${neu.gradientText} ${styles.centerTitleCompact}`}>{title}</span>
      </div>
    )
    : (
      <div className={styles.centerText}>
        <span className={`${neu.gradientText} ${styles.centerTitle}`}>{title}</span>
        {subtitle && <span className={styles.centerSubtitle}>{subtitle}</span>}
        {onCenterClick && centerIcon && <Icon iconName={centerIcon} className={styles.centerIcon} />}
      </div>
    );

  const ringCls = [styles.ring, circle ? styles.ringCircle : '', compact ? styles.ringCompact : ''].join(' ');

  return (
    <div className={`${styles.wrap} ${compact ? styles.compact : ''} ${className || ''}`}>
      <div className={ringCls} style={{ aspectRatio: `100 / ${Math.round(g.aspect * 100)}` }} aria-hidden={n === 0}>
        {/* central disc */}
        <div className={styles.center} style={{ left: `${g.cx}%`, top: toTop(g.cy) }}>
          {onCenterClick
            ? (
              <button type="button" className={`${neu.circle} ${styles.centerDisc} ${styles.centerButton}`} style={{ width: g.disc, height: g.disc }} title={centerTitle} aria-label={centerTitle || title} onClick={onCenterClick}>
                {centerBody}
              </button>
            )
            : <div className={`${neu.circle} ${styles.centerDisc}`} style={{ width: g.disc, height: g.disc }}>{centerBody}</div>}
        </div>

        {beads.map((b, i) => (
          <span key={`bead-${i}`} className={`${neu.bead} ${b.big ? styles.beadBig : styles.beadSmall}`} style={{ left: `${b.x}%`, top: toTop(b.y) }} />
        ))}

        {shown.map((node, i) => {
          const a = angle(i);
          const p = polar(a, g.r);
          const s = side(a);
          const body = (
            <>
              {!compact && node.caption && <span className={styles.caption}>{node.caption}</span>}
              <span className={styles.label}>{node.label}</span>
              {!compact && node.description && <span className={styles.description}>{node.description}</span>}
            </>
          );
          const textCls = `${styles.text} ${styles[s]} ${node.active ? styles.active : ''}`;
          const tip = node.caption ? `${node.caption} — ${node.label}` : node.label;
          return (
            <div key={node.key} className={`${styles.node} ${node.active ? styles.nodeActive : ''}`} style={{ left: `${p.x}%`, top: toTop(p.y) }}>
              <NeuCircle icon={node.icon} size={g.node} small={compact} title={tip} onClick={node.onClick} className={node.active ? styles.discActive : undefined} />
              {node.href
                ? <a className={textCls} href={node.href} target="_blank" rel="noopener noreferrer" title={tip}>{body}</a>
                : <div className={textCls} title={tip} onClick={node.onClick} role={node.onClick ? 'button' : undefined} tabIndex={node.onClick ? 0 : undefined}
                  aria-current={node.active ? 'page' : undefined}
                  onKeyDown={node.onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (node.onClick) { node.onClick(); } } } : undefined}>{body}</div>}
            </div>
          );
        })}
      </div>

      {/* narrow screens: same content as a list (full-size ring only) */}
      {!compact && (
        <ol className={styles.list}>
          {onCenterClick && (
            <li className={styles.listItem}>
              <NeuCircle icon={centerIcon || 'Home'} size={52} small title={centerTitle} onClick={onCenterClick} />
              <div className={styles.listText}><span className={`${styles.label} ${neu.gradientText}`}>{title}</span>{subtitle && <span className={styles.description}>{subtitle}</span>}</div>
            </li>
          )}
          {shown.map((node, i) => (
            <li key={node.key} className={styles.listItem}>
              <NeuCircle icon={node.icon} size={52} small title={node.label} onClick={node.onClick} className={node.active ? styles.discActive : undefined} />
              <div className={styles.listText} onClick={node.onClick} role={node.onClick ? 'button' : undefined} tabIndex={node.onClick ? 0 : undefined}>
                <span className={styles.caption}>{node.caption || `Step ${String(i + 1).padStart(2, '0')}`}</span>
                {node.href
                  ? <a className={`${styles.label} ${neu.link}`} href={node.href} target="_blank" rel="noopener noreferrer">{node.label}</a>
                  : <span className={styles.label}>{node.label}</span>}
                {node.description && <span className={styles.description}>{node.description}</span>}
              </div>
              {node.href && <Icon iconName="OpenInNewWindow" className={neu.muted} />}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
};

export default NeuRing;
