import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

type Theme = 'blood' | 'quiet';
const THEME_KEY = 'tm-theme';

function applyTheme(theme: Theme) {
  if (theme === 'quiet') {
    document.documentElement.dataset.theme = 'quiet';
  } else {
    delete document.documentElement.dataset.theme;
  }
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const stored = localStorage.getItem(THEME_KEY);
      if (stored === 'quiet' || stored === 'blood') return stored;
      if (window.matchMedia('(prefers-color-scheme: light)').matches) return 'quiet';
    } catch {
      /* default to blood */
    }
    return 'blood';
  });

  useEffect(() => {
    applyTheme(theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      /* storage optional */
    }
  }, [theme]);

  // React to OS-level scheme changes only while the user has not explicitly chosen.
  useEffect(() => {
    if (localStorage.getItem(THEME_KEY)) return undefined;
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const onChange = (e: MediaQueryListEvent) => setTheme(e.matches ? 'quiet' : 'blood');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const isQuiet = theme === 'quiet';

  return (
    <button
      type="button"
      aria-label={isQuiet ? 'Switch to Blood & Steel theme' : 'Switch to Quiet (light) theme'}
      title={isQuiet ? 'Blood & Steel theme' : 'Quiet (light) theme'}
      onClick={() => setTheme(isQuiet ? 'blood' : 'quiet')}
      className="flex items-center justify-center w-10 h-10 rounded-md border border-border bg-surface-alt/60 text-text-muted hover:text-primary transition-colors"
    >
      {isQuiet ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
    </button>
  );
}
