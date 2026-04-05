import { store } from '../state.js'
import { signOut } from '../supabase.js'
import { showToast } from '../utils/toast.js'

export function initHeader(container) {
  function render() {
    const coins = store.get('coins')
    const streak = store.get('streak')
    container.innerHTML = `
      <header class="app-header" id="app-header">
        <div class="header-left">
          <button class="hamburger-btn" id="hamburger-btn" aria-label="Open settings">
            <span></span><span></span><span></span>
          </button>
          <img src="${store.get('appLogo')}" alt="Logo" class="app-logo" onerror="this.style.display='none'; document.getElementById('header-brand').classList.remove('hide-on-mobile')" />
          <span class="header-brand hide-on-mobile" id="header-brand">Vicissometer</span>
        </div>
        <div class="header-right">
          <div class="header-badge badge-coins">
            <span class="badge-icon">🪙</span>
            <span id="header-coins">${coins}</span>
          </div>
          <div class="header-badge badge-streak">
            <span class="badge-icon">🔥</span>
            <span id="header-streak">${streak}</span>
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
  store.on('coins', v => { const el = document.getElementById('header-coins'); if (el) el.textContent = v })
  store.on('streak', v => { const el = document.getElementById('header-streak'); if (el) el.textContent = v })
  
  // Refresh on settings change (for logo/theme consistency)
  store.on('settingsChanged', () => { if (container.isConnected) render() })
}
