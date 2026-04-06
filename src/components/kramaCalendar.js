import { store } from '../state.js'
import { saveDailyProgress, getAllProgress, updateGameStats, syncBackfillData, addToLedger } from '../db.js'
import { computeKramas, computeMudras, today, datesBetween } from '../utils/calculations.js'
import { showToast } from '../utils/toast.js'

export function initKramaCalendar() {
  const overlay = document.createElement('div')
  overlay.className = 'modal-overlay'
  overlay.id = 'krama-overlay'
  document.body.appendChild(overlay)

  let monthOffset = 0

  function render() {
    const s = store.getAll()
    const habits = s.habits.filter(h => h.active)
    const progress = s.allProgress
    
    // Calculate current month display
    const d = new Date()
    d.setMonth(d.getMonth() + monthOffset)
    const monthName = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    const year = d.getFullYear()
    const month = d.getMonth()
    
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    
    const byDate = {}
    progress.forEach(p => {
      if (!byDate[p.date]) byDate[p.date] = 0
      if (p.completed) byDate[p.date]++
    })

    overlay.innerHTML = `
      <div class="modal-content glass-card p-6" style="max-width: 500px;">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-bold">Krama & Urja Center ⚡</h2>
          <button class="close-btn" id="krama-close">✕</button>
        </div>

        <div class="flex gap-3 mb-6">
          <div class="flex-1 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-center">
            <div class="text-[0.6rem] uppercase tracking-wider font-bold">Krama (Streak)</div>
            <div class="text-xl font-bold">${s.kramas}</div>
          </div>
          <div class="flex-1 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-center">
            <div class="text-[0.6rem] uppercase tracking-wider font-bold">Urja (PowerUps)</div>
            <div class="text-xl font-bold">${s.urjas}</div>
          </div>
        </div>

        <div class="calendar-nav flex items-center justify-between mb-2">
          <button class="btn-icon p-2" id="prev-month">◀</button>
          <div class="font-bold">${monthName}</div>
          <button class="btn-icon p-2" id="next-month">▶</button>
        </div>

        <div class="calendar-grid">
           ${['M','T','W','T','F','S','S'].map(dayName => `<div class="text-center text-[0.65rem] font-bold text-muted p-1">${dayName}</div>`).join('')}
           ${renderDays(year, month, firstDay, daysInMonth, byDate, habits.length)}
        </div>

        <div class="mt-6 space-y-3">
          <button class="btn btn-primary w-full py-4 flex items-center justify-center gap-2" 
            id="fill-oldest-btn" ${s.urjas <= 0 ? 'disabled' : ''}>
            ⚡ Use Urja (Fill Oldest Gap)
          </button>
          
          <p class="text-[0.6rem] text-center text-muted">
            Krama is your consistency. Urjas help you bridge the gaps.
          </p>
        </div>
      </div>
    `

    document.getElementById('krama-close').onclick = () => { overlay.classList.remove('open'); monthOffset = 0; }
    document.getElementById('prev-month').onclick = () => { monthOffset--; render(); }
    document.getElementById('next-month').onclick = () => { monthOffset++; render(); }

    const fillBtn = document.getElementById('fill-oldest-btn')
    if (fillBtn) {
      fillBtn.onclick = async () => {
        if (store.get('urjas') <= 0) return
        await useUrjaOnOldest()
      }
    }
  }

  function renderDays(year, month, firstDay, daysInMonth, byDate, totalHabits) {
    let html = ''
    const offset = firstDay === 0 ? 6 : firstDay - 1
    for (let i = 0; i < offset; i++) html += '<div class="calendar-day empty"></div>'
    
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      const count = byDate[dateStr] || 0
      const isComplete = count >= totalHabits
      
      let typeClass = 'missed'
      if (isComplete) typeClass = 'completed'
      if (dateStr === today()) typeClass += ' today'
      
      html += `<div class="calendar-day ${typeClass}" title="${dateStr}">${d}</div>`
    }
    return html
  }

  async function useUrjaOnOldest() {
    const s = store.getAll()
    const habits = s.habits.filter(h => h.active)
    const startDate = s.settings.startDate
    const range = datesBetween(startDate, today())
    
    const byDate = {}
    s.allProgress.forEach(p => {
      if (!byDate[p.date]) byDate[p.date] = 0
      if (p.completed) byDate[p.date]++
    })

    const oldestGap = range.find(d => (byDate[d] || 0) < habits.length)
    if (!oldestGap) {
      showToast('No gaps found! 🚀', 'info')
      return
    }

    if (confirm(`Use 1 Urja to fill the gap on ${oldestGap}?`)) {
      const newState = {}
      habits.forEach(h => newState[h.id] = true)
      
      await saveDailyProgress(oldestGap, newState)
      const all = await getAllProgress()
      const newUrjas = s.urjas - 1
      
      const kramas = computeKramas(all, habits, s.settings.kavachasUsedDates || [])
      const mudras = computeMudras(all, habits)
      
      store.update({ allProgress: all, urjas: newUrjas, kramas, mudras })
      await updateGameStats(mudras, kramas, s.kavachas, newUrjas)
      
      // Ledger entry
      await addToLedger('URJA', -1, 'RECOVERY', `Filled gap on ${oldestGap}`)
      
      showToast(`Urja used on ${oldestGap}! ⚡`, 'success')
      render()
    }
  }

  document.addEventListener('open-streak', () => {
    overlay.classList.add('open')
    render()
  })
}
