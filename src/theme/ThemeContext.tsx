/**
 * Light / dark switcher for the neumorphic design system.
 *
 * FEATURE (ask: "a theme changer for dark and light mode"):
 *   - the user's choice is remembered per browser in localStorage (STORAGE_KEY),
 *     shared by every Infomatic web part on the tenant;
 *   - without a stored choice the web part follows `defaultMode`, which the
 *     web part derives from the property pane ("Default theme": site / light /
 *     dark) and the SharePoint section theme (isInverted);
 *   - `reset()` forgets the choice and goes back to following the default.
 */
import * as React from 'react';

export type ThemeMode = 'light' | 'dark';

export const STORAGE_KEY = 'infomatic.theme';

export interface IThemeContext {
  mode: ThemeMode;
  isDark: boolean;
  /** True when the current mode came from the user's stored choice. */
  isUserChoice: boolean;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
  reset: () => void;
}

const readStored = (): ThemeMode | undefined => {
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return v === 'light' || v === 'dark' ? v : undefined;
  } catch {
    return undefined;
  }
};

const writeStored = (mode: ThemeMode | undefined): void => {
  try {
    if (mode) { window.localStorage.setItem(STORAGE_KEY, mode); } else { window.localStorage.removeItem(STORAGE_KEY); }
  } catch { /* private mode / quota */ }
};

const noop = (): void => undefined;

export const ThemeContext = React.createContext<IThemeContext>({
  mode: 'light', isDark: false, isUserChoice: false, setMode: noop, toggle: noop, reset: noop
});

export interface IThemeProviderProps {
  /** Mode used until the user picks one (site theme or property pane). */
  defaultMode: ThemeMode;
  /** false = ignore the stored choice (property pane "Show theme switcher" off). */
  allowUserChoice?: boolean;
  children?: React.ReactNode;
}

export const ThemeProvider: React.FC<IThemeProviderProps> = ({ defaultMode, allowUserChoice = true, children }) => {
  const [stored, setStored] = React.useState<ThemeMode | undefined>(() => (allowUserChoice ? readStored() : undefined));

  // another Infomatic web part (or another tab) changed the choice
  React.useEffect(() => {
    if (!allowUserChoice) { return; }
    const onStorage = (e: StorageEvent): void => { if (e.key === STORAGE_KEY) { setStored(readStored()); } };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [allowUserChoice]);

  const mode: ThemeMode = allowUserChoice && stored ? stored : defaultMode;

  const value = React.useMemo<IThemeContext>(() => ({
    mode,
    isDark: mode === 'dark',
    isUserChoice: allowUserChoice && !!stored,
    setMode: (m) => { writeStored(m); setStored(m); },
    toggle: () => { const m: ThemeMode = mode === 'dark' ? 'light' : 'dark'; writeStored(m); setStored(m); },
    reset: () => { writeStored(undefined); setStored(undefined); }
  }), [mode, stored, allowUserChoice]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): IThemeContext => React.useContext(ThemeContext);
