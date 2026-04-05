import { store } from '../state.js'
import { habitLifetimePct } from '../utils/calculations.js'

export function initLifeOutcomes(container) {
  function render() {
    const habits = store.get('habits').filter(h => h.active)
    const allProgress = store.get('allProgress')
    const profile = store.get('profile')
    const startDate = profile?.start_date || store.get('settings').startDate

    const cards = habits.map(h => {
      const pct = habitLifetimePct(h.id, allProgress, startDate)
      return `
        <div class="outcome-card animate-fade-in">
          <div class="outcome-icon">${h.life_outcome_icon}</div>
          <div class="outcome-name">${h.life_outcome}</div>
          <div class="outcome-habit">${h.name}</div>
          <div class="outcome-progress-track">
            <div class="outcome-progress-fill" style="width:${Math.min(pct, 100)}%"></div>
          </div>
          <div class="outcome-pct">${pct.toFixed(1)}%</div>
        </div>
      `
    })

    // Pad to at least 4 cards with empty slots
    while (cards.length < 4 && habits.length === 0) {
      cards.push('<div class="outcome-card" style="opacity:0.3;pointer-events:none"><div class="outcome-icon">⭐</div><div class="outcome-name">—</div></div>')
    }

    container.innerHTML = `
      <div class="glass-card life-outcomes-card">
        <div class="glass-card-inner">
          <div class="card-header">
            <h2 class="card-title">Life Outcomes 🎯</h2>
          </div>
          <div class="outcomes-grid">
            ${cards.join('')}
          </div>
        </div>
      </div>
    `
  }

  render()

  store.on('allProgress', () => { if (container.isConnected) render() })
  store.on('habits', () => { if (container.isConnected) render() })
}
