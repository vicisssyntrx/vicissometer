import { store } from '../state.js'
import { cumulativeGrowthFactor, daysBetween, today } from '../utils/calculations.js'

export function initInsights(container) {
  function computeGrowth() {
    const all = store.get('allProgress')
    const habits = store.get('habits')
    const profile = store.get('profile')
    const startDate = profile?.start_date || store.get('settings').startDate

    if (!all.length || !habits.length) return 1.0

    // Group by date + compute per-day completion rates
    const byDate = {}
    all.forEach(r => {
      if (!byDate[r.date]) byDate[r.date] = { hits: 0, weight: 0 }
      const h = habits.find(x => x.id === r.habit_id)
      const w = h ? h.weight : 0
      if (r.completed) byDate[r.date].hits += w
      byDate[r.date].weight += w
    })

    const days = Object.entries(byDate)
      .filter(([date]) => date <= today())
      .map(([, v]) => ({
        completionRate: v.weight > 0 ? v.hits / v.weight : 0
      }))

    return cumulativeGrowthFactor(days)
  }

  function render() {
    const profile = store.get('profile')
    const settings = store.get('settings')
    const startDate = profile?.start_date || settings.startDate
    const completedDays = store.get('completedDaysCount') || 0
    const all = store.get('allProgress') || []
    const trackedDates = new Set(all.map(r => r.date))
    const totalDays = trackedDates.size
    const growthFactor = computeGrowth()

    container.innerHTML = `
      <div class="glass-card insights-card">
        <div class="glass-card-inner">
          <div class="card-header" style="margin-bottom:8px">
            <h2 class="card-title">Journey Insights</h2>
          </div>
          <div class="insights-grid">
            <div class="insight-item">
              <div class="insight-label">Days Completed</div>
              <div class="insight-value purple">${completedDays}/366</div>
            </div>
            <div class="insight-item">
              <div class="insight-label">Growth Factor 🚀</div>
              <div class="insight-value orange">${growthFactor.toFixed(2)}x</div>
            </div>
          </div>
        </div>
      </div>
    `

    // Update global state
    store.update({
      growthFactor,
      totalDaysTracked: totalDays
    })
  }

  render()
  store.on('allProgress', () => { if (container.isConnected) render() })
  store.on('habits', () => { if (container.isConnected) render() })
  store.on('completedDaysCount', () => { if (container.isConnected) render() })
}
