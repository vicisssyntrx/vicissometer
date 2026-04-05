/**
 * Apply user settings to CSS custom properties + document class
 */
export function applySettings(s) {
  const root = document.documentElement

  // Font scale
  root.style.setProperty('--font-scale', s.fontScale ?? 1)

  // Theme class
  document.body.classList.remove('theme-light', 'theme-dark', 'theme-auto')
  document.body.classList.add('theme-' + (s.theme || 'light'))

  // Card opacity
  const cardOp = ((s.cardOpacity ?? 88) / 100).toFixed(2)
  root.style.setProperty('--card-opacity', cardOp)

  // Card background color (convert hex to RGB)
  if (s.cardBg) {
    const rgb = hexToRgb(s.cardBg)
    if (rgb) root.style.setProperty('--card-bg-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`)
  }

  // Text colors
  if (s.primaryText) root.style.setProperty('--text-primary', s.primaryText)
  if (s.secondaryText) root.style.setProperty('--text-secondary', s.secondaryText)

  // Accent color
  if (s.accentColor) {
    root.style.setProperty('--accent', s.accentColor)
    root.style.setProperty('--accent-gradient', `linear-gradient(135deg, ${s.accentColor} 0%, #EC4899 100%)`)
  }

  // Background
  if (s.bgType === 'gradient') {
    root.style.setProperty('--bg', `linear-gradient(${s.bgValue || '135deg, #2A1009 0%, #5C2D0C 100%'})`)
  } else {
    root.style.setProperty('--bg', s.bgValue || '#2A1009')
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
