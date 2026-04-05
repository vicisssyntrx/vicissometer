import { store } from '../state.js'
import { addHabit, updateHabit, deleteHabit, getHabits } from '../db.js'
import { showToast } from '../utils/toast.js'

export function initHabitsModal() {
  document.getElementById('habits-modal-overlay')?.remove()

  const overlay = document.createElement('div')
  overlay.className = 'modal-overlay'
  overlay.id = 'habits-modal-overlay'
  document.body.appendChild(overlay)

  function open() {
    renderModal()
    overlay.classList.add('open')
    document.body.style.overflow = 'hidden'
  }

  function close() {
    overlay.classList.remove('open')
    document.body.style.overflow = ''
  }

  function computeWeightWarning(habits, newWeight) {
    return null
  }

  async function autoEqualizeWeights() {
    const list = await getHabits()
    if (list.length === 0) return list
    const eqWeight = parseFloat((100 / list.length).toFixed(2))
    await Promise.all(list.map(h => updateHabit(h.id, { weight: eqWeight })))
    return await getHabits()
  }

  function renderModal() {
    const habits = store.get('habits')

    overlay.innerHTML = `
      <div class="habits-modal animate-pop-in">
        <div class="modal-handle"></div>
        <div class="modal-header">
          <h2 class="modal-title">📋 Habits Manager</h2>
          <button class="close-btn" id="habits-modal-close">✕</button>
        </div>

        <div class="modal-body">
          <div id="habits-manage-list">
            ${habits.length === 0
              ? '<p style="color:var(--text-muted);text-align:center;padding:20px 0;font-size:0.85rem">No habits yet. Add one below!</p>'
              : habits.map(h => habitManageItem(h)).join('')
            }
          </div>

          <!-- Add new habit form -->
          <div class="add-habit-form" id="add-habit-form">
            <div class="add-habit-form-title">➕ Add New Habit</div>
            <div class="add-habit-grid">
              <input class="glass-input" id="new-habit-icon" placeholder="Icon (emoji)" maxlength="4" value="⭐" />
              <input class="glass-input add-habit-grid-full" id="new-habit-name" placeholder="Habit name" />
              <input class="glass-input" id="new-habit-outcome" placeholder="Life outcome" />
              <input class="glass-input" id="new-habit-outcome-icon" placeholder="Outcome icon" maxlength="4" value="🎯" />
            </div>
            <div class="weight-warning" id="weight-warning" style="display:none"></div>
            <button class="btn btn-primary" id="add-habit-btn" style="padding:10px">➕ Add Habit</button>
          </div>
        </div>

        <div class="modal-footer">
          <div style="display:flex;gap:8px;align-items:center;justify-content:space-between">
            <div style="font-size:0.75rem;color:var(--text-muted)">
              Weights are distributed equally automatically (100% total)
            </div>
            <button class="btn btn-secondary" id="normalize-btn" style="padding:8px 14px;font-size:0.78rem">
              ⚖ Equalize Now
            </button>
          </div>
        </div>
      </div>
    `

    // Close
    document.getElementById('habits-modal-close').addEventListener('click', close)
    overlay.addEventListener('click', e => { if (e.target === overlay) close() })

    // Delete buttons
    overlay.querySelectorAll('.habit-delete-btn').forEach(btn => {
      btn.addEventListener('click', async e => {
        e.stopPropagation()
        const id = btn.dataset.habitId
        const name = btn.dataset.habitName
        if (!confirm(`Delete "${name}"? This will remove all its progress data.`)) return
        try {
          await deleteHabit(id)
          const updated = await autoEqualizeWeights()
          store.set('habits', updated)
          showToast(`"${name}" deleted`, 'warning')
          renderModal()
        } catch (err) {
          showToast('Delete failed: ' + err.message, 'error')
        }
      })
    })

    // Toggle active
    overlay.querySelectorAll('.habit-manage-toggle').forEach(cb => {
      cb.addEventListener('change', async e => {
        const id = cb.dataset.habitId
        try {
          await updateHabit(id, { active: cb.checked })
          const updated = await getHabits()
          store.set('habits', updated)
        } catch (err) {
          showToast('Update failed', 'error')
        }
      })
    })

    // Normalize
    document.getElementById('normalize-btn').addEventListener('click', async () => {
      try {
        const updated = await autoEqualizeWeights()
        store.set('habits', updated)
        showToast('Weights equalized to 100% ✓', 'success')
        renderModal()
      } catch (err) {
        showToast('Normalize failed', 'error')
      }
    })

    // Add habit
    document.getElementById('add-habit-btn').addEventListener('click', async () => {
      const name = document.getElementById('new-habit-name').value.trim()
      const icon = document.getElementById('new-habit-icon').value.trim() || '⭐'
      const outcome = document.getElementById('new-habit-outcome').value.trim() || 'Growth'
      const outcomeIcon = document.getElementById('new-habit-outcome-icon').value.trim() || '🎯'

      if (!name) { showToast('Please enter a habit name', 'error'); return }

      const habits = store.get('habits')
      const warnEl = document.getElementById('weight-warning')
      warnEl.style.display = 'none'

      try {
        await addHabit({
          name,
          icon,
          life_outcome: outcome,
          life_outcome_icon: outcomeIcon,
          weight: 0, // will be auto-equalized
          active: true,
          sort_order: habits.length,
        })
        const updated = await autoEqualizeWeights()
        store.set('habits', updated)
        showToast(`"${name}" added! ✓`, 'success')
        renderModal()
      } catch (err) {
        showToast('Add failed: ' + err.message, 'error')
      }
    })
  }

  function habitManageItem(h) {
    return `
      <div class="habit-manage-item">
        <div class="habit-manage-icon-picker" title="Tap to edit icon">${h.icon}</div>
        <div class="habit-manage-info">
          <div class="habit-manage-name">${h.name}</div>
          <div class="habit-manage-outcome">${h.life_outcome_icon} ${h.life_outcome}</div>
        </div>
        <div class="habit-manage-weight">${h.weight.toFixed(1)}%</div>
        <label class="toggle" style="transform:scale(0.85)">
          <input type="checkbox" class="habit-manage-toggle" data-habit-id="${h.id}"
            ${h.active ? 'checked' : ''} />
          <div class="toggle-track"><div class="toggle-thumb"></div></div>
        </label>
        <button class="habit-delete-btn" data-habit-id="${h.id}" data-habit-name="${h.name}"
          title="Delete habit">🗑</button>
      </div>
    `
  }

  document.addEventListener('open-habits', () => open())
}
