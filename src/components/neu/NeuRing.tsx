/**
 * The sample's layout: a large central disc with up to seven icon circles on
 * an arc below it, labels alternating left / right, beads along an inner arc.
 * Positions are percentages of a 100 x 62 design box (aspect-ratio keeps them
 * proportional); below 700px the component renders the nodes as a plain list.
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
}

export interface INeuRingProps {
  title: string;
  subtitle?: string;
  nodes: IRingNode[];
  /** Maximum nodes drawn on the arc (default 7, like the sample). */
  max?: number;
}

const CX = 50;      // centre x (% of width)
const CY = 22;      // centre y (% of width — converted to % of height below)
const R = 36;       // node arc radius (% of width)
const R_IN = 24;    // bead arc radius
const ASPECT = 0.62; // height / width of the design box

const toTop = (yPctOfWidth: number): string => `${(yPctOfWidth / ASPECT).toFixed(2)}%`;

const polar = (deg: number, r: number): { x: number; y: number } => {
  const rad = (deg * Math.PI) / 180;
  return { x: CX + r * Math.cos(rad), y: CY - r * Math.sin(rad) };
};

export const NeuRing: React.FC<INeuRingProps> = ({ title, subtitle, nodes, max = 7 }) => {
  const shown = nodes.slice(0, Math.max(1, Math.min(max, 9)));
  const n = shown.length;
  const angle = (i: number): number => (n === 1 ? 270 : 180 + (i * 180) / (n - 1));

  const beads: { x: number; y: number }[] = [];
  for (let i = 0; i < n - 1; i++) {
    const a = (angle(i) + angle(i + 1)) / 2;
    beads.push(polar(a, R_IN));
    beads.push(polar(angle(i), R_IN));
  }
  if (n > 1) { beads.push(polar(angle(n - 1), R_IN)); }

  const side = (deg: number): 'left' | 'right' | 'bottom' => (deg < 255 ? 'left' : deg > 285 ? 'right' : 'bottom');

  return (
    <div className={styles.wrap}>
      <div className={styles.ring} aria-hidden={n === 0}>
        {/* central disc */}
        <div className={styles.center} style={{ left: `${CX}%`, top: toTop(CY) }}>
          <div className={`${neu.circle} ${styles.centerDisc}`}>
            <div className={styles.centerText}>
              <span className={`${neu.gradientText} ${styles.centerTitle}`}>{title}</span>
              {subtitle && <span className={styles.centerSubtitle}>{subtitle}</span>}
            </div>
          </div>
        </div>

        {beads.map((b, i) => (
          <span key={`bead-${i}`} className={`${neu.bead} ${i % 2 === 0 ? styles.beadBig : styles.beadSmall}`} style={{ left: `${b.x}%`, top: toTop(b.y) }} />
        ))}

        {shown.map((node, i) => {
          const a = angle(i);
          const p = polar(a, R);
          const s = side(a);
          const body = (
            <>
              {node.caption && <span className={styles.caption}>{node.caption}</span>}
              <span className={styles.label}>{node.label}</span>
              {node.description && <span className={styles.description}>{node.description}</span>}
            </>
          );
          return (
            <div key={node.key} className={styles.node} style={{ left: `${p.x}%`, top: toTop(p.y) }}>
              <NeuCircle icon={node.icon} size={74} title={node.label} onClick={node.onClick} />
              {node.href
                ? <a className={`${styles.text} ${styles[s]}`} href={node.href} target="_blank" rel="noopener noreferrer">{body}</a>
                : <div className={`${styles.text} ${styles[s]}`} onClick={node.onClick} role={node.onClick ? 'button' : undefined} tabIndex={node.onClick ? 0 : undefined}>{body}</div>}
            </div>
          );
        })}
      </div>

      {/* narrow screens: same content as a list */}
      <ol className={styles.list}>
        {shown.map((node, i) => (
          <li key={node.key} className={styles.listItem}>
            <NeuCircle icon={node.icon} size={52} small title={node.label} onClick={node.onClick} />
            <div className={styles.listText}>
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
    </div>
  );
};

export default NeuRing;
