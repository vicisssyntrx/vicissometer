import { store } from '../state.js'
import {
  getDailyProgressForDate,
  saveDailyProgress,
  clearDailyProgress,
  getAllProgress,
  updateCoinsAndStreak,
} from '../db.js'
import { computeTodayPct, computeStreak, computeCoins, today } from '../utils/calculations.js'
import { showToast } from '../utils/toast.js'

export function initDailyProgress(container) {
  let saving = false

  async function loadDateProgress(date) {
    const records = await getDailyProgressForDate(date)
    const habits = store.get('habits').filter(h => h.active)
    const state = {}
    habits.forEach(h => { state[h.id] = false })
    records.forEach(r => { state[r.habit_id] = r.completed })
    store.set('todayState', state)
    recomputePct()
  }

  function recomputePct() {
    const habits = store.get('habits').filter(h => h.active)
    const pct = computeTodayPct(store.get('todayState'), habits)
    store.set('todayPct', pct)
    updateProgressDisplay(pct)
  }

  function updateProgressDisplay(pct) {
    const valEl = document.getElementById('dp-pct-value')
    const fillEl = document.getElementById('dp-progress-fill')
    if (valEl) valEl.textContent = pct.toFixed(2) + '%'
    if (fillEl) fillEl.style.width = pct + '%'
  }

  function renderHabitItem(habit) {
    const done = store.get('todayState')[habit.id] || false
    return `
      <div class="habit-item ${done ? 'completed' : ''}" data-habit-id="${habit.id}">
        <span class="habit-icon">${habit.icon}</span>
        <div class="habit-info">
          <div class="habit-name">${habit.name}</div>
          <div class="habit-weight">${habit.weight.toFixed(1)}%</div>
        </div>
        <label class="toggle" aria-label="${habit.name} toggle">
          <input type="checkbox" ${done ? 'checked' : ''} data-habit-id="${habit.id}" />
          <div class="toggle-track">
            <div class="toggle-thumb"></div>
          </div>
        </label>
      </div>
    `
  }

  function render() {
    const habits = store.get('habits').filter(h => h.active)
    const pct = store.get('todayPct')
    const date = store.get('selectedDate')

    container.innerHTML = `
      <div class="glass-card daily-progress-card">
        <div class="glass-card-inner">
          <div class="card-header">
            <h2 class="card-title">Daily Progress</h2>
            <input type="date" class="date-picker" id="date-picker" value="${date}" />
          </div>

          <div class="habits-list" id="habits-list">
            ${habits.length === 0
              ? '<p style="color:var(--text-muted);font-size:0.82rem;text-align:center;padding:12px 0">No active habits. Add some!</p>'
              : habits.map(renderHabitItem).join('')
            }
          </div>

          <div class="progress-section">
            <div class="progress-label">
              <span class="progress-label-text">Today\'s Progress:</span>
              <span class="progress-value" id="dp-pct-value">${pct.toFixed(2)}%</span>
            </div>
            <div class="progress-track">
              <div class="progress-fill progress-fill-accent" id="dp-progress-fill" style="width:${pct}%"></div>
            </div>
          </div>

          <button class="btn btn-primary" id="save-progress-btn" style="margin-top:16px">
            <span>💾</span> Save Progress
          </button>

          <div class="btn-row">
            <button class="btn btn-secondary" id="open-habits-btn">
              <span>📋</span> Habits
            </button>
            <button class="btn btn-warning" id="reset-btn">
              <span>↺</span> Reset
            </button>
            <button class="btn btn-danger" id="clear-btn">
              <span>🗑</span> Clear
            </button>
          </div>
        </div>
      </div>
    `

    // Date picker
    document.getElementById('date-picker').addEventListener('change', async e => {
      store.set('selectedDate', e.target.value)
      await loadDateProgress(e.target.value)
    })

    // Toggle checkboxes via habit-item click or checkbox click
    document.getElementById('habits-list').addEventListener('change', e => {
      const cb = e.target.closest('input[type="checkbox"]')
      if (!cb) return
      const hid = cb.dataset.habitId
      const state = { ...store.get('todayState'), [hid]: cb.checked }
      store.set('todayState', state)
      // Update item styling
      const item = container.querySelector(`.habit-item[data-habit-id="${hid}"]`)
      if (item) item.classList.toggle('completed', cb.checked)
      recomputePct()
    })

    document.getElementById('habits-list').addEventListener('click', e => {
      const item = e.target.closest('.habit-item')
      if (!item || e.target.closest('label')) return
      const hid = item.dataset.habitId
      const cb = item.querySelector('input[type="checkbox"]')
      if (cb) {
        cb.checked = !cb.checked
        cb.dispatchEvent(new Event('change', { bubbles: true }))
      }
    })

    // Save
    document.getElementById('save-progress-btn').addEventListener('click', async () => {
      if (saving) return
      saving = true
      const btn = document.getElementById('save-progress-btn')
      btn.disabled = true
      btn.textContent = '⏳ Saving…'

      try {
        const date = store.get('selectedDate')
        const state = store.get('todayState')
        await saveDailyProgress(date, state)

        // Refresh all progress + recalculate
        const all = await getAllProgress()
        store.set('allProgress', all)
        await recalcGlobalStats(all)

        btn.innerHTML = '<span>✓</span> Saved!'
        showToast('Progress saved! 🎉', 'success')
        setTimeout(() => {
          if (btn) { btn.disabled = false; btn.innerHTML = '<span>💾</span> Save Progress' }
        }, 1800)
      } catch (err) {
        showToast('Save failed: ' + err.message, 'error')
        if (btn) { btn.disabled = false; btn.innerHTML = '<span>💾</span> Save Progress' }
        console.error(err)
      } finally {
        saving = false
      }
    })

    // Habits modal
    document.getElementById('open-habits-btn').addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('open-habits'))
    })

    // Reset
    document.getElementById('reset-btn').addEventListener('click', () => {
      const habits = store.get('habits').filter(h => h.active)
      const state = {}
      habits.forEach(h => { state[h.id] = false })
      store.set('todayState', state)
      recomputePct()
      render()
      showToast('Toggles reset', 'warning')
    })

    // Clear
    document.getElementById('clear-btn').addEventListener('click', async () => {
      if (!confirm('Clear all saved progress for this date?')) return
      try {
        await clearDailyProgress(store.get('selectedDate'))
        const habits = store.get('habits').filter(h => h.active)
        const state = {}
        habits.forEach(h => { state[h.id] = false })
        store.set('todayState', state)
        const all = await getAllProgress()
        store.set('allProgress', all)
        await recalcGlobalStats(all)
        recomputePct()
        render()
        showToast('Progress cleared', 'warning')
      } catch (err) {
        showToast('Clear failed: ' + err.message, 'error')
      }
    })
  }

  async function recalcGlobalStats(all) {
    const habits = store.get('habits')
    const streak = computeStreak(all, habits)
    const coins = computeCoins(all, habits)
    const completedDates = new Set(all.filter(r => r.completed).map(r => r.date))
    store.update({ streak, coins, completedDaysCount: completedDates.size })
    try {
      await updateCoinsAndStreak(coins, streak)
    } catch (_) { /* non-critical */ }
  }

  // Initial render + data load
  render()
  loadDateProgress(store.get('selectedDate'))

  // Re-render when habits change (e.g., after modal save)
  store.on('habits', () => {
    render()
    loadDateProgress(store.get('selectedDate'))
  })
}
