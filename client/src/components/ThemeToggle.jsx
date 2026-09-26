import { useState } from 'react';
import { getStoredTheme, setTheme } from '../theme';

const ORDER = ['light', 'dark', 'system'];
const ICONS = { light: 'fa-sun', dark: 'fa-moon', system: 'fa-circle-half-stroke' };
const LABELS = { light: 'Light', dark: 'Dark', system: 'System' };

export default function ThemeToggle() {
  const [theme, setThemeState] = useState(getStoredTheme());

  function cycle() {
    const next = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length];
    setThemeState(next);
    setTheme(next);
  }

  return (
    <button
      type="button"
      className="icon-button theme-toggle"
      onClick={cycle}
      aria-label={`Appearance: ${LABELS[theme]} theme. Activate to switch.`}
      title={`Appearance: ${LABELS[theme]}`}
    >
      <i className={`fa-solid ${ICONS[theme]}`} aria-hidden="true" />
    </button>
  );
}
