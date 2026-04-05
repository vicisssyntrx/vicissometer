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
  if (!container) return // safety guard
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
    // Use container.querySelector — works even if container is temporarily detached
    const valEl = container.querySelector('#dp-pct-value')
    const fillEl = container.querySelector('#dp-progress-fill')
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

          <div class="progress-section" style="margin-bottom: var(--sp-4);">
            <div class="progress-label">
              <span class="progress-label-text">Today's Progress:</span>
              <span class="progress-value" id="dp-pct-value">${pct.toFixed(2)}%</span>
            </div>
            <div class="progress-track">
              <div class="progress-fill progress-fill-accent" id="dp-progress-fill" style="width:${pct}%"></div>
            </div>
          </div>

          <button class="btn btn-primary" id="save-progress-btn">
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

    // --- All queries use container.querySelector instead of document.getElementById ---
    const datePicker = container.querySelector('#date-picker')
    const habitsList = container.querySelector('#habits-list')
    const saveBtn = container.querySelector('#save-progress-btn')
    const openHabitsBtn = container.querySelector('#open-habits-btn')
    const resetBtn = container.querySelector('#reset-btn')
    const clearBtn = container.querySelector('#clear-btn')

    if (!datePicker || !habitsList || !saveBtn) return // detached or not rendered

    // Date picker
    datePicker.addEventListener('change', async e => {
      store.set('selectedDate', e.target.value)
      await loadDateProgress(e.target.value)
      render() // re-render to update UI for the new date
    })

    // Toggle via checkbox
    habitsList.addEventListener('change', async e => {
      const cb = e.target.closest('input[type="checkbox"]')
      if (!cb) return
      const hid = cb.dataset.habitId
      const currentState = store.get('todayState') || {}
      const newState = { ...currentState, [hid]: cb.checked }
      store.set('todayState', newState)
      
      const item = container.querySelector(`.habit-item[data-habit-id="${hid}"]`)
      if (item) item.classList.toggle('completed', cb.checked)
      
      recomputePct()

      // Auto-save toggle state immediately
      try {
        const date = store.get('selectedDate')
        await saveDailyProgress(date, newState)
      } catch (err) {
        showToast('Saving failed: ' + err.message, 'error')
        console.error(err)
      }
    })

    // Toggle via row click
    habitsList.addEventListener('click', e => {
      const item = e.target.closest('.habit-item')
      if (!item || e.target.closest('label')) return
      const cb = item.querySelector('input[type="checkbox"]')
      if (cb) {
        cb.checked = !cb.checked
        cb.dispatchEvent(new Event('change', { bubbles: true }))
      }
    })

    saveBtn?.addEventListener('click', async () => {
      if (saveBtn.disabled) return
      saveBtn.disabled = true
      saveBtn.innerHTML = '<span>⏳</span> Saving…'
      try {
        const date = store.get('selectedDate')
        const state = store.get('todayState')
        await saveDailyProgress(date, state)
        const all = await getAllProgress()
        store.set('allProgress', all)
        await recalcGlobalStats(all)
        // Signal chart to refresh (only on explicit save)
        store.emit('allProgressSaved')
        saveBtn.innerHTML = '<span>✓</span> Saved!'
        showToast('Progress saved! 🎉', 'success')
        setTimeout(() => {
          saveBtn.disabled = false
          saveBtn.innerHTML = '<span>💾</span> Save Progress'
        }, 1800)
      } catch (err) {
        showToast('Save failed: ' + err.message, 'error')
        saveBtn.disabled = false
        saveBtn.innerHTML = '<span>💾</span> Save Progress'
      }
    })

    // Open habits modal
    openHabitsBtn?.addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('open-habits'))
    })

    // Reset toggles
    resetBtn?.addEventListener('click', async () => {
      const habits = store.get('habits').filter(h => h.active)
      const state = {}
      habits.forEach(h => { state[h.id] = false })
      store.set('todayState', state)
      
      try {
        await saveDailyProgress(store.get('selectedDate'), state)
        recomputePct()
        render()
        showToast('Toggles reset and saved ✓', 'warning')
      } catch (err) {
        showToast('Reset failed: ' + err.message, 'error')
      }
    })

    // Clear saved data
    clearBtn?.addEventListener('click', async () => {
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

  // Re-render when habits change (e.g., after habits modal save)
  store.on('habits', () => {
    if (!container.isConnected) return // skip if container is detached
    render()
    loadDateProgress(store.get('selectedDate'))
  })
}
