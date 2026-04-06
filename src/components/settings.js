import { store } from '../state.js'
import { signOut } from '../supabase.js'
import { updateSettings, updateProfile, DEFAULT_SETTINGS } from '../db.js'
import { applySettings } from '../utils/applySettings.js'
import { updateHead } from '../utils/updateHead.js'
import { showToast } from '../utils/toast.js'

export function initSettings() {
  const root = document.documentElement
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
        <div class="settings-brand-wrap">
          <img src="/full-logo.png" class="settings-full-logo" alt="Vicissometer Branding" />
          <div class="settings-title">⚙️ Settings</div>
        </div>
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
          ${colorRow('card-bg-color', 'Card Background', s.cardBg || rgbToHex(getComputedStyle(root).getPropertyValue('--card-bg-rgb')))}
          ${colorRow('primary-text-color', 'Primary Text', s.primaryText || getComputedStyle(root).getPropertyValue('--text-primary'))}
          ${colorRow('secondary-text-color', 'Secondary Text', s.secondaryText || getComputedStyle(root).getPropertyValue('--text-secondary'))}
          ${colorRow('accent-color', 'Accent Color', s.accentColor || getComputedStyle(root).getPropertyValue('--accent'))}
        </div>

        <!-- Background -->
        <div class="settings-section">
          <div class="settings-section-title">🖼 Background</div>
          <div class="settings-row">
            <select class="glass-select" id="bg-type-select">
              <option value="black" ${s.bgType === 'black' ? 'selected' : ''}>1. Black</option>
              <option value="white" ${s.bgType === 'white' ? 'selected' : ''}>2. White</option>
              <option value="image" ${s.bgType === 'image' ? 'selected' : ''}>3. Image custom upload less than 5 mb</option>
            </select>
          </div>
          <div class="settings-row" id="bg-upload-row" style="display:${s.bgType === 'image' ? 'block' : 'none'}">
            <input type="file" id="bg-file-input" accept="image/*" style="display:none" />
            <button class="btn btn-secondary" id="bg-upload-btn" style="width:100%">Choose Image...</button>
            <input type="hidden" id="bg-value" value="${s.bgValue}" />
          </div>
          <div class="settings-row">
            <div class="settings-label">
              Background Blur
              <span class="settings-label-note" id="bg-blur-note">${s.bgBlur || 0}px</span>
            </div>
            <input type="range" class="glass-slider" id="bg-blur" min="0" max="50" value="${s.bgBlur || 0}"
              style="--slider-pct:${(s.bgBlur || 0) * 2}%" />
          </div>
        </div>

        <!-- Branding -->
        <div class="settings-section">
          <div class="settings-section-title">🏷 Branding</div>
          <div class="settings-row">
            <div class="settings-label">App Logo</div>
            <div style="display:flex; gap:12px; align-items:center; margin-top:8px">
              <img id="logo-preview" src="${s.appLogo || store.get('appLogo')}" 
                style="width:48px; height:48px; border-radius:12px; object-fit:contain; background:rgba(0,0,0,0.05); border:1px solid var(--card-border)" />
              <button class="btn btn-secondary" id="logo-upload-btn" style="flex:1; padding:8px">Change Logo...</button>
              <input type="file" id="logo-file-input" accept="image/*" style="display:none" />
              <input type="hidden" id="app-logo-val" value="${s.appLogo || store.get('appLogo')}" />
            </div>
          </div>
        </div>


        <!-- Quotes Section -->
        <div class="settings-section">
          <div class="settings-section-title">💡 Custom Quotes</div>
          <div class="settings-row">
            <div class="settings-label">Edit Quotes (JSON format)</div>
            <textarea id="quotes-textarea" class="glass-input" 
              style="width:100%; height:120px; font-family:monospace; font-size:0.75rem; padding:10px; margin-top:8px"
              placeholder='["Quote text" - Author]'
            >${s.customQuotes || ''}</textarea>
            <div class="settings-tip" style="margin-top:8px">
              Format: <code>["The best project you'll ever work on is you." - Anonymous]</code> (One per line)
            </div>
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
        </div>

      </div>

      <div class="settings-actions">
        <button class="btn btn-primary" id="settings-save" style="flex:2">💾 Save</button>
        <button class="btn btn-warning" id="settings-reset" style="flex:1">↺</button>
        <button class="btn btn-danger" id="settings-signout" style="flex:1">Sign Out</button>
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
    document.getElementById('bg-blur')?.addEventListener('input', e => {
      const v = e.target.value
      e.target.style.setProperty('--slider-pct', (v * 2) + '%')
      document.getElementById('bg-blur-note').textContent = v + 'px'
      // Live preview
      document.documentElement.style.setProperty('--bg-blur', v + 'px')
    })
    
    // Background upload logic
    const bgTypeSelect = document.getElementById('bg-type-select')
    const bgUploadRow = document.getElementById('bg-upload-row')
    const bgUploadBtn = document.getElementById('bg-upload-btn')
    const bgFileInput = document.getElementById('bg-file-input')
    const bgValue = document.getElementById('bg-value')

    bgTypeSelect?.addEventListener('change', e => {
      bgUploadRow.style.display = e.target.value === 'image' ? 'block' : 'none'
    })

    bgUploadBtn?.addEventListener('click', () => bgFileInput.click())

    bgFileInput?.addEventListener('change', e => {
      const file = e.target.files[0]
      if (!file) return
      if (file.size > 5 * 1024 * 1024) {
        showToast('File must be less than 5MB', 'error')
        return
      }
      bgUploadBtn.textContent = '⏳ Processing...'
      const reader = new FileReader()
      reader.onload = (evt) => {
        bgValue.value = evt.target.result
        bgUploadBtn.textContent = '✓ Image Loaded'
        document.documentElement.style.setProperty('--bg', `url('${evt.target.result}') center/cover fixed no-repeat`)
      }
      reader.onerror = () => {
        showToast('Error reading image', 'error')
        bgUploadBtn.textContent = 'Choose Image...'
      }
      reader.readAsDataURL(file)
    })

    // Log upload logic
    const logoUploadBtn = document.getElementById('logo-upload-btn')
    const logoFileInput = document.getElementById('logo-file-input')
    const logoPreview = document.getElementById('logo-preview')

    logoUploadBtn?.addEventListener('click', () => logoFileInput.click())

    logoFileInput?.addEventListener('change', e => {
      const file = e.target.files[0]
      if (!file) return
      if (file.size > 2 * 1024 * 1024) {
        showToast('Logo must be less than 2MB', 'error')
        return
      }
      const reader = new FileReader()
      reader.onload = (evt) => {
        const data = evt.target.result
        store.set('appLogo', data)
        if (logoPreview) logoPreview.src = data
        const logoInput = document.getElementById('app-logo-val')
        if (logoInput) logoInput.value = data
        // Update header logo live
        const headerLogo = document.querySelector('.app-logo')
        if (headerLogo) headerLogo.src = data
        // Update head icons (favicon, apple-touch-icon)
        updateHead(data)
      }
      reader.readAsDataURL(file)
    })

    // Shop and Streak event emitters
    document.getElementById('open-shop-btn')?.addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('open-shop'))
    })
    document.getElementById('open-streak-btn')?.addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('open-streak'))
    })

    // Sign Out
    document.getElementById('settings-signout')?.addEventListener('click', async () => {
      if (!confirm('Are you sure you want to sign out?')) return
      try {
        await signOut()
        close()
      } catch (err) {
        showToast('Sign out failed', 'error')
      }
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
      bgBlur: parseInt(document.getElementById('bg-blur')?.value || cur.bgBlur || 0),
      startDate: document.getElementById('start-date')?.value || cur.startDate,
      targetDate: document.getElementById('target-date')?.value || cur.targetDate,
      customQuotes: document.getElementById('quotes-textarea')?.value || cur.customQuotes,
      appLogo: document.getElementById('app-logo-val')?.value || cur.appLogo || store.get('appLogo')
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
    if (!hex || hex.length < 7) return '255, 255, 255'
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `${r}, ${g}, ${b}`
  }

  function rgbToHex(rgbStr) {
    if (!rgbStr) return '#FFFFFF'
    const parts = rgbStr.split(',').map(p => parseInt(p.trim()))
    if (parts.length < 3) return '#FFFFFF'
    return '#' + parts.map(p => p.toString(16).padStart(2, '0')).join('').toUpperCase()
  }

  // Close on Escape key
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && isOpen) close()
  })

  // Toggle via hamburger event
  document.addEventListener('toggle-settings', () => {
    if (isOpen) {
      close()
    } else {
      open()
    }
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
