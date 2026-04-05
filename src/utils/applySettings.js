import { store } from '../state.js'
import { updateHead } from './updateHead.js'

/**
 * Apply user settings to CSS custom properties + document class
 */
export function applySettings(s) {
  const root = document.documentElement

  // Font scale
  root.style.setProperty('--font-scale', s.fontScale ?? 1)

  // Theme class
  document.body.classList.remove('theme-light', 'theme-dark', 'theme-auto')
  const theme = s.theme || 'auto'
  document.body.classList.add('theme-' + theme)

  // System theme listener (only if auto)
  if (theme === 'auto') {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const syncTheme = (e) => {
      document.body.classList.toggle('theme-dark', e.matches)
      document.body.classList.toggle('theme-light', !e.matches)
    }
    // Initial sync
    syncTheme(mq)
    // Remove old listeners to avoid leaks if this is called multiple times
    if (window._themeMqCleanup) window._themeMqCleanup()
    mq.addEventListener('change', syncTheme)
    window._themeMqCleanup = () => mq.removeEventListener('change', syncTheme)
  } else {
    // Fixed theme: clear the listener and the manual classes
    if (window._themeMqCleanup) { window._themeMqCleanup(); window._themeMqCleanup = null; }
    document.body.classList.toggle('theme-dark', theme === 'dark')
    document.body.classList.toggle('theme-light', theme === 'light')
  }

  // Clear root overrides that were used for base theme (now handled by classes)
  const toClear = ['--bg', '--card-bg-rgb', '--card-opacity', '--card-border', '--text-primary', '--text-secondary', '--text-muted']
  toClear.forEach(prop => root.style.removeProperty(prop))

  // User-overridden card opacity
  if (s.cardOpacity !== undefined) {
    root.style.setProperty('--card-opacity', (s.cardOpacity / 100).toFixed(2))
  }

  // User-overridden card background color
  if (s.cardBg && s.cardBg !== '#FFFFFF') {
    const rgb = hexToRgb(s.cardBg)
    if (rgb) root.style.setProperty('--card-bg-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`)
  }

  // User-overridden text colors
  if (s.primaryText) root.style.setProperty('--text-primary', s.primaryText)
  if (s.secondaryText) root.style.setProperty('--text-secondary', s.secondaryText)

  // Accent color
  if (s.accentColor) {
    root.style.setProperty('--accent', s.accentColor)
    root.style.setProperty('--accent-gradient', s.accentColor)
  }

  // Background override — applied AFTER theme defaults so it always wins
  if (s.bgType) {
    if (s.bgType === 'black') {
      root.style.setProperty('--bg', '#000000')
    } else if (s.bgType === 'white') {
      root.style.setProperty('--bg', '#FFFFFF')
    } else if (s.bgType === 'image' && s.bgValue) {
      // Use CSS background shorthand; the dark overlay is handled via .theme-dark .app-bg::after in CSS
      root.style.setProperty('--bg', `url('${s.bgValue}') center / cover fixed no-repeat`)
    }
  }

  // Background Blur
  if (s.bgBlur !== undefined) {
    root.style.setProperty('--bg-blur', s.bgBlur + 'px')
  }

  // Notify components (like Chart.js) that may need to re-render using computed styles
  store.emit('settingsChanged')

  // Sync document head icons
  updateHead(s.appLogo || '/logo.png', s.accentColor)
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  } : null
}
