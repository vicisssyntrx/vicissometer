import { store } from '../state.js'
import { updateSettings, updateProfile, DEFAULT_SETTINGS } from '../db.js'
import { applySettings } from '../utils/applySettings.js'
import { showToast } from '../utils/toast.js'

export function initSettings() {
  document.getElementById('settings-overlay')?.remove()
  document.getElementById('settings-drawer')?.remove()

  // Create overlay + drawer DOM
  const overlay = document.createElement('div')
  overlay.className = 'settings-overlay'
  overlay.id = 'settings-overlay'
  document.body.appendChild(overlay)

  const drawer = document.createElement('div')
  drawer.className = 'settings-drawer'
  drawer.id = 'settings-drawer'
  document.body.appendChild(drawer)

  let isOpen = false

  function open() {
    isOpen = true
    renderDrawer()
    overlay.classList.add('open')
    drawer.classList.add('open')
    document.getElementById('hamburger-btn')?.classList.add('open')
    document.body.style.overflow = 'hidden'
  }

  function close() {
    isOpen = false
    overlay.classList.remove('open')
    drawer.classList.remove('open')
    document.getElementById('hamburger-btn')?.classList.remove('open')
    document.body.style.overflow = ''
  }

  function renderDrawer() {
    const s = { ...store.get('settings') }
    const profile = store.get('profile')
    const startDate = profile?.start_date || s.startDate
    const targetDate = profile?.target_date || s.targetDate

    drawer.innerHTML = `
      <div class="settings-header">
        <div class="settings-title">⚙️ Settings</div>
        <button class="close-btn" id="settings-close">✕</button>
      </div>

      <div class="settings-body">

        <!-- Font Size -->
        <div class="settings-section">
          <div class="settings-section-title">abc Font Size</div>
          <div class="settings-row">
            <div class="font-counter">
              <button class="font-counter-btn" id="font-dec">−</button>
              <div>
                <div class="font-counter-val" id="font-val">${s.fontScale.toFixed(2)}x</div>
                <div class="font-counter-range">Range: 0.5x to 2.0x</div>
              </div>
              <button class="font-counter-btn" id="font-inc">+</button>
            </div>
          </div>
        </div>

        <!-- Theme -->
        <div class="settings-section">
          <div class="settings-section-title">🌞 Theme</div>
          <div class="settings-row">
            <select class="glass-select" id="theme-select">
              <option value="light" ${s.theme === 'light' ? 'selected' : ''}>Light</option>
              <option value="dark" ${s.theme === 'dark' ? 'selected' : ''}>Dark</option>
              <option value="auto" ${s.theme === 'auto' ? 'selected' : ''}>Auto (System)</option>
            </select>
          </div>
        </div>

        <!-- Opacity -->
        <div class="settings-section">
          <div class="settings-section-title">🌙 Opacity</div>
          <div class="settings-row">
            <div class="settings-label">
              Background Opacity
              <span class="settings-label-note" id="bg-opacity-note">${s.bgOpacity}%</span>
            </div>
            <input type="range" class="glass-slider" id="bg-opacity" min="10" max="100" value="${s.bgOpacity}"
              style="--slider-pct:${s.bgOpacity}%" />
          </div>
          <div class="settings-row">
            <div class="settings-label">
              Card Opacity
              <span class="settings-label-note" id="card-opacity-note">${s.cardOpacity}%</span>
            </div>
            <input type="range" class="glass-slider" id="card-opacity" min="10" max="100" value="${s.cardOpacity}"
              style="--slider-pct:${s.cardOpacity}%" />
          </div>
        </div>

        <!-- Colors -->
        <div class="settings-section">
          <div class="settings-section-title">🎨 Colors</div>
          ${colorRow('card-bg-color', 'Card Background', s.cardBg)}
          ${colorRow('primary-text-color', 'Primary Text', s.primaryText)}
          ${colorRow('secondary-text-color', 'Secondary Text', s.secondaryText)}
          ${colorRow('accent-color', 'Accent Color', s.accentColor)}
        </div>

        <!-- Background -->
        <div class="settings-section">
          <div class="settings-section-title">🖼 Background</div>
          <div class="settings-row">
            <select class="glass-select" id="bg-type-select">
              <option value="solid" ${s.bgType === 'solid' ? 'selected' : ''}>Solid Color</option>
              <option value="gradient" ${s.bgType === 'gradient' ? 'selected' : ''}>Gradient</option>
            </select>
          </div>
          <div class="settings-row">
            <input class="glass-input" id="bg-value" value="${s.bgValue}"
              placeholder="${s.bgType === 'gradient' ? '135deg, #2A1009 0%, #5C2D0C 100%' : '#2A1009'}" />
          </div>
        </div>

        <!-- Dates -->
        <div class="settings-section">
          <div class="settings-section-title">📅 Dates</div>
          <div class="settings-row">
            <div class="settings-label">Start Date</div>
            <input type="date" class="glass-date" id="start-date" value="${startDate}" />
          </div>
          <div class="settings-row">
            <div class="settings-label">Target Date</div>
            <input type="date" class="glass-date" id="target-date" value="${targetDate}" />
          </div>
          <div class="settings-tip">
            💡 The best time to start was yesterday. The next best time is today!
          </div>
        </div>

      </div>

      <div class="settings-actions">
        <button class="btn btn-primary" id="settings-save" style="flex:2">💾 Save</button>
        <button class="btn btn-warning" id="settings-reset" style="flex:1">↺</button>
      </div>
    `

    // Close
    document.getElementById('settings-close').addEventListener('click', close)

    // Font size controls
    const fontStep = 0.05
    document.getElementById('font-dec').addEventListener('click', () => adjustFont(-fontStep))
    document.getElementById('font-inc').addEventListener('click', () => adjustFont(fontStep))

    function adjustFont(delta) {
      const cur = parseFloat(store.get('settings').fontScale)
      const next = Math.max(0.5, Math.min(2.0, Math.round((cur + delta) * 100) / 100))
      document.getElementById('font-val').textContent = next.toFixed(2) + 'x'
      // Live preview
      document.documentElement.style.setProperty('--font-scale', next)
    }

    // Sliders — update CSS variable live
    document.getElementById('bg-opacity').addEventListener('input', e => {
      const v = e.target.value
      e.target.style.setProperty('--slider-pct', v + '%')
      document.getElementById('bg-opacity-note').textContent = v + '%'
    })
    document.getElementById('card-opacity').addEventListener('input', e => {
      const v = e.target.value
      e.target.style.setProperty('--slider-pct', v + '%')
      document.getElementById('card-opacity-note').textContent = v + '%'
      document.documentElement.style.setProperty('--card-opacity', (v / 100).toFixed(2))
    })

    // Save
    document.getElementById('settings-save').addEventListener('click', async () => {
      const newSettings = gatherSettings()
      store.set('settings', newSettings)
      applySettings(newSettings)

      // Also update profile dates
      await updateProfile({
        start_date: newSettings.startDate,
        target_date: newSettings.targetDate,
        settings: newSettings
      })
      await updateSettings(newSettings)

      showToast('Settings saved! ✨', 'success')
      close()
    })

    // Reset to defaults
    document.getElementById('settings-reset').addEventListener('click', async () => {
      if (!confirm('Reset all settings to defaults?')) return
      store.set('settings', DEFAULT_SETTINGS)
      applySettings(DEFAULT_SETTINGS)
      await updateSettings(DEFAULT_SETTINGS)
      renderDrawer()
      showToast('Settings reset', 'warning')
    })
  }

  function colorRow(id, label, value) {
    return `
      <div class="color-picker-row">
        <div class="color-swatch">
          <input type="color" id="${id}" value="${value}" />
        </div>
        <div class="color-label">${label}</div>
        <div class="color-value" id="${id}-val">${value}</div>
      </div>
    `
  }

  function gatherSettings() {
    const cur = store.get('settings')
    return {
      fontScale: parseFloat(document.getElementById('font-val')?.textContent || cur.fontScale),
      theme: document.getElementById('theme-select')?.value || cur.theme,
      bgOpacity: parseInt(document.getElementById('bg-opacity')?.value || cur.bgOpacity),
      cardOpacity: parseInt(document.getElementById('card-opacity')?.value || cur.cardOpacity),
      cardBg: document.getElementById('card-bg-color')?.value || cur.cardBg,
      primaryText: document.getElementById('primary-text-color')?.value || cur.primaryText,
      secondaryText: document.getElementById('secondary-text-color')?.value || cur.secondaryText,
      accentColor: document.getElementById('accent-color')?.value || cur.accentColor,
      bgType: document.getElementById('bg-type-select')?.value || cur.bgType,
      bgValue: document.getElementById('bg-value')?.value || cur.bgValue,
      startDate: document.getElementById('start-date')?.value || cur.startDate,
      targetDate: document.getElementById('target-date')?.value || cur.targetDate,
      customQuotes: cur.customQuotes,
    }
  }

  // Update color value labels and live preview
  drawer.addEventListener('input', e => {
    if (e.target.type === 'color') {
      const valEl = document.getElementById(e.target.id + '-val')
      if (valEl) valEl.textContent = e.target.value

      // Live CSS preview
      if (e.target.id === 'card-bg-color') {
        document.documentElement.style.setProperty('--card-bg-rgb', hexToRgb(e.target.value))
      } else if (e.target.id === 'primary-text-color') {
        document.documentElement.style.setProperty('--text-primary', e.target.value)
      } else if (e.target.id === 'secondary-text-color') {
        document.documentElement.style.setProperty('--text-secondary', e.target.value)
      } else if (e.target.id === 'accent-color') {
        document.documentElement.style.setProperty('--accent', e.target.value)
        document.documentElement.style.setProperty('--accent-glow', e.target.value + '40')
      }
    }
  })

  // Helper for live preview
  function hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `${r}, ${g}, ${b}`
  }

  // Toggle via hamburger event
  document.addEventListener('toggle-settings', () => {
    if (isOpen) close(); else open()
  })

  // Close on overlay click
  overlay.addEventListener('click', close)

  // Swipe left to close
  let touchStartX = 0
  drawer.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX }, { passive: true })
  drawer.addEventListener('touchend', e => {
    if (touchStartX - e.changedTouches[0].clientX > 60) close()
  }, { passive: true })
}
