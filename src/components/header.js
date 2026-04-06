import { store } from '../state.js'
import { signOut } from '../supabase.js'
import { showToast } from '../utils/toast.js'

export function initHeader(container) {
  function render() {
    const mudras = store.get('mudras')
    const kramas = store.get('kramas')
    container.innerHTML = `
      <header class="app-header" id="app-header">
        <div class="header-left">
          <button class="hamburger-btn" id="hamburger-btn" aria-label="Open settings">
            <span></span><span></span><span></span>
          </button>
          <img src="${store.get('appLogo')}" alt="Logo" class="app-logo" />
          <img src="/full-logo.png" alt="Vicissometer" class="header-full-logo hide-on-mobile" id="header-brand" />
        </div>
        <div class="header-right">
          <div class="header-badge badge-mudras" title="Mudras">
            <span class="badge-icon">🪙</span>
            <span id="header-mudras">${store.get('mudras')}</span>
          </div>
          <div class="header-badge badge-kramas" title="Krama (Streak)">
            <span class="badge-icon">🔥</span>
            <span id="header-kramas">${store.get('kramas')}</span>
          </div>
          <div class="header-badge badge-kavachas hide-on-mobile" title="Kavachas (Shields)">
            <span class="badge-icon">🛡️</span>
            <span id="header-kavachas">${store.get('kavachas')}</span>
          </div>
          <div class="header-badge badge-urjas hide-on-mobile" title="Urjas (PowerUps)">
            <span class="badge-icon">⚡</span>
            <span id="header-urjas">${store.get('urjas')}</span>
          </div>
        </div>
      </header>
    `

    document.getElementById('hamburger-btn').addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('toggle-settings'))
    })
  }

  render()

  // Fast-update without re-render
  store.on('mudras', v => { const el = document.getElementById('header-mudras'); if (el) el.textContent = v })
  store.on('kramas', v => { const el = document.getElementById('header-kramas'); if (el) el.textContent = v })
  store.on('kavachas', v => { const el = document.getElementById('header-kavachas'); if (el) el.textContent = v })
  store.on('urjas', v => { const el = document.getElementById('header-urjas'); if (el) el.textContent = v })
  
  // Refresh on settings change (for logo/theme consistency)
  store.on('settingsChanged', () => { if (container.isConnected) render() })
}
