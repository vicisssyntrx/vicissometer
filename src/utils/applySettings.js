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

  // Determine dark or light
  const isDark = theme === 'dark' ||
    (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  if (isDark) {
    root.style.setProperty('--bg', 'linear-gradient(145deg, #000000 0%, #0A0A0A 60%, #1C1C1E 100%)')
    root.style.setProperty('--card-bg-rgb', '28, 28, 30')
    root.style.setProperty('--card-opacity', '0.90')
    root.style.setProperty('--card-border', 'rgba(255,255,255,0.18)')
    root.style.setProperty('--text-primary', '#F5F5F7')
    root.style.setProperty('--text-secondary', '#98989D')
    root.style.setProperty('--text-muted', 'rgba(245,245,247,0.38)')
  } else {
    root.style.setProperty('--bg', 'linear-gradient(145deg, #F2F2F7 0%, #FFFFFF 50%, #E8E8ED 100%)')
    root.style.setProperty('--card-bg-rgb', '255, 255, 255')
    root.style.setProperty('--card-opacity', '0.82')
    root.style.setProperty('--card-border', 'rgba(0,0,0,0.09)')
    root.style.setProperty('--text-primary', '#1D1D1F')
    root.style.setProperty('--text-secondary', '#6E6E73')
    root.style.setProperty('--text-muted', 'rgba(29,29,31,0.38)')
  }

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
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  } : null
}
