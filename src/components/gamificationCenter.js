import { store } from '../state.js'

export function initGamificationCenter(container) {
  function render() {
    const kavachas = store.get('kavachas') || 0
    const urjas = store.get('urjas') || 0
    
    container.innerHTML = `
      <div class="gamification-center animate-fade-in" style="margin-bottom: var(--sp-6)">
        <div class="gamification-grid">
          <!-- Kavacha Section -->
          <div class="glass-card gamification-card">
            <div class="glass-card-inner">
              <div class="gamification-content">
                <div class="gamification-info">
                  <div class="gamification-icon-wrap">🛡️</div>
                  <div class="gamification-stats-wrap">
                    <div class="gamification-label">Kavacha(s)</div>
                    <div class="gamification-value" id="dash-kavachas">${kavachas}</div>
                  </div>
                </div>
                <button class="btn btn-secondary btn-sm gamification-btn" id="dash-open-shop">
                  Open Shop
                </button>
              </div>
            </div>
          </div>

          <!-- Urja Section -->
          <div class="glass-card gamification-card">
            <div class="glass-card-inner">
              <div class="gamification-content">
                <div class="gamification-info">
                  <div class="gamification-icon-wrap">⚡</div>
                  <div class="gamification-stats-wrap">
                    <div class="gamification-label">Urja(s) / PowerUps</div>
                    <div class="gamification-value" id="dash-urjas">${urjas}</div>
                  </div>
                </div>
                <button class="btn btn-secondary btn-sm gamification-btn" id="dash-open-streak">
                  Check Krama
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `

    // Event listeners
    container.querySelector('#dash-open-shop')?.addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('open-shop'))
    })
    container.querySelector('#dash-open-streak')?.addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('open-streak'))
    })
  }

  render()

  // Subscribe to updates
  store.on('kavachas', v => {
    const el = document.getElementById('dash-kavachas')
    if (el) el.textContent = v
  })
  store.on('urjas', v => {
    const el = document.getElementById('dash-urjas')
    if (el) el.textContent = v
  })
}
