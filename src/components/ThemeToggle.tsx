import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface ThemeToggleProps {
  compact?: boolean;
  variant?: 'default' | 'hero';
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  compact = false,
  variant = 'default',
  className = '',
}) => {
  const { theme, setTheme, language } = useApp();
  const isSw = language === 'sw';
  const isDark = theme === 'dark';

  const label = isDark
    ? isSw
      ? 'Mwanga'
      : 'Light'
    : isSw
      ? 'Giza'
      : 'Dark';

  const base =
    variant === 'hero'
      ? 'bg-white/15 border-white/25 text-white hover:bg-white/25'
      : compact
        ? 'bg-primary-100 dark:bg-primary-800 text-primary-700 dark:text-primary-200 border-primary-200 dark:border-primary-600'
        : 'bg-white dark:bg-primary-800 text-primary-700 dark:text-primary-200 border-primary-200 dark:border-primary-600 text-xs font-bold';

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={`flex items-center justify-center gap-1 rounded-xl border transition-all active:scale-95 cursor-pointer ${
        compact ? 'p-2' : 'px-3 py-2'
      } ${base} ${className}`}
      title={isSw ? 'Badilisha mandhari' : 'Toggle theme'}
      aria-label={isSw ? 'Badilisha mandhari' : 'Toggle light or dark theme'}
    >
      {isDark ? <Sun size={compact ? 16 : 14} /> : <Moon size={compact ? 16 : 14} />}
      {!compact && <span>{label}</span>}
    </button>
  );
};

export default ThemeToggle;
