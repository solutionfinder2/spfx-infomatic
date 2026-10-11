/**
 * Neumorphic building blocks. All of them read their colours from the CSS
 * variables set by <NeuRoot> (see theme/neumorphic.module.scss), so a child
 * never needs to know which theme is active.
 */
import * as React from 'react';
import { Icon } from '@fluentui/react';
import neu from '../../theme/neumorphic.module.scss';
import { useTheme } from '../../theme/ThemeContext';

export { neu };

const cx = (...names: (string | false | undefined)[]): string => names.filter(Boolean).join(' ');

/* ---------- root: applies the theme attribute ---------- */

export const NeuRoot: React.FC<{ className?: string; style?: React.CSSProperties; children?: React.ReactNode }> = ({ className, style, children }) => {
  const { mode } = useTheme();
  return <div className={cx(neu.root, className)} style={style} data-theme={mode}>{children}</div>;
};

/* ---------- surfaces ---------- */

export interface INeuCardProps {
  title?: React.ReactNode;
  meta?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

export const NeuCard: React.FC<INeuCardProps> = ({ title, meta, className, children }) => (
  <section className={cx(neu.card, className)}>
    {(title || meta) && (
      <h3 className={neu.cardTitle}>
        <span>{title}</span>
        {meta && <span className={neu.cardTitleMeta}>{meta}</span>}
      </h3>
    )}
    {children}
  </section>
);

export const NeuPressed: React.FC<{ className?: string; children?: React.ReactNode }> = ({ className, children }) => (
  <div className={cx(neu.pressed, className)}>{children}</div>
);

/* ---------- circles ---------- */

export interface INeuCircleProps {
  /** Fluent UI icon name. */
  icon?: string;
  size?: number;
  small?: boolean;
  title?: string;
  className?: string;
  onClick?: () => void;
  children?: React.ReactNode;
}

export const NeuCircle: React.FC<INeuCircleProps> = ({ icon, size = 72, small, title, className, onClick, children }) => {
  const style: React.CSSProperties = { width: size, height: size };
  const body = children || (icon ? <Icon iconName={icon} className={neu.circleIcon} style={{ fontSize: Math.round(size * 0.32) }} /> : null);
  const cls = cx(small ? neu.circleSm : neu.circle, className);
  return onClick
    ? <button type="button" className={cls} style={{ ...style, border: 0, cursor: 'pointer', padding: 0 }} title={title} aria-label={title} onClick={onClick}>{body}</button>
    : <span className={cls} style={style} title={title} role={title ? 'img' : undefined} aria-label={title}>{body}</span>;
};

/* ---------- buttons ---------- */

export interface INeuButtonProps {
  icon?: string;
  text?: string;
  title?: string;
  pressed?: boolean;
  disabled?: boolean;
  href?: string;
  onClick?: () => void;
}

export const NeuButton: React.FC<INeuButtonProps> = ({ icon, text, title, pressed, disabled, href, onClick }) => {
  const cls = text ? neu.button : neu.iconButton;
  const content = <>{icon && <Icon iconName={icon} />}{text && <span>{text}</span>}</>;
  if (href) {
    return <a className={cls} href={href} title={title} aria-label={title || text} target="_blank" rel="noopener noreferrer">{content}</a>;
  }
  return (
    <button type="button" className={cls} title={title} aria-label={title || text} aria-pressed={pressed} disabled={disabled} onClick={onClick}>
      {content}
    </button>
  );
};

/* ---------- theme toggle ---------- */

export const ThemeToggle: React.FC<{ title?: string }> = ({ title }) => {
  const { isDark, toggle } = useTheme();
  const label = title || (isDark ? 'Switch to light mode' : 'Switch to dark mode');
  return (
    <button type="button" role="switch" aria-checked={isDark} aria-label={label} title={label} className={neu.toggle} onClick={toggle}>
      <Icon iconName="Sunny" className={cx(neu.toggleIcon, neu.toggleSun, !isDark && neu.toggleOn)} />
      <Icon iconName="ClearNight" className={cx(neu.toggleIcon, neu.toggleMoon, isDark && neu.toggleOn)} />
      <span className={neu.toggleKnob} />
    </button>
  );
};

/* ---------- notice ---------- */

export const NeuNotice: React.FC<{ kind?: 'info' | 'warn'; children?: React.ReactNode }> = ({ kind = 'info', children }) => (
  <div className={cx(neu.notice, kind === 'warn' ? neu.noticeWarn : neu.noticeInfo)} role={kind === 'warn' ? 'alert' : 'status'}>
    <Icon iconName={kind === 'warn' ? 'Warning' : 'Info'} />
    <span>{children}</span>
  </div>
);
