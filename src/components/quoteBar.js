import { store } from '../state.js'
import { updateSettings } from '../db.js'
import { showToast } from '../utils/toast.js'
import { today } from '../utils/calculations.js'

export function initQuoteBar(container) {
  // If a modal already exists, remove it
  document.getElementById('quote-modal-overlay')?.remove()

  // Create modal for editing quotes
  const modalOverlay = document.createElement('div')
  modalOverlay.className = 'modal-overlay'
  modalOverlay.id = 'quote-modal-overlay'
  document.body.appendChild(modalOverlay)

  function openQuotesModal() {
    const s = store.get('settings')
    modalOverlay.innerHTML = `
      <div class="habits-modal animate-pop-in" style="max-width:500px">
        <div class="modal-header">
          <h2 class="modal-title">💡 Custom Quotes</h2>
          <button class="close-btn" id="quote-modal-close">✕</button>
        </div>
        <div class="modal-body" style="padding:20px;">
          <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:12px">
            Enter quotes one per line in the format:<br/>
            <code>["Quote text" - Author]</code>
          </p>
          <textarea id="quotes-textarea" class="glass-input" style="width:100%; height:200px; resize:vertical; font-family:monospace; font-size:0.85rem">${s.customQuotes || ''}</textarea>
          <button class="btn btn-primary" id="save-quotes-btn" style="width:100%; margin-top:16px">💾 Save Quotes</button>
        </div>
      </div>
    `
    modalOverlay.classList.add('open')

    document.getElementById('quote-modal-close').addEventListener('click', () => {
      modalOverlay.classList.remove('open')
    })

    document.getElementById('save-quotes-btn').addEventListener('click', async () => {
      const text = document.getElementById('quotes-textarea').value
      const newSettings = { ...store.get('settings'), customQuotes: text }
      store.set('settings', newSettings)
      try {
        await updateSettings(newSettings)
        showToast('Quotes updated ✓', 'success')
        modalOverlay.classList.remove('open')
        render()
      } catch (err) {
        showToast('Failed to save quotes', 'error')
      }
    })
  }

  // Parse custom quotes string into array of {text, author}
  function parseQuotes(str) {
    if (!str) return [{ text: "No quotes added", author: "You" }]
    const lines = str.split('\\n').filter(l => l.trim())
    const parsed = []
    
    // Regex matches ["Quote text" - Author]
    const regex = /^\\["(.*?)"\\s*-\\s*(.*?)\\]$/

    for (const line of lines) {
      const m = line.trim().match(regex)
      if (m) {
        parsed.push({ text: m[1], author: m[2] })
      }
    }
    
    if (parsed.length === 0) {
      return [{ text: 'Format quotes properly: ["Quote text" - Author]', author: 'System' }]
    }
    return parsed
  }

  // Pick a stable quote for the day based on the date string
  function getQuoteForToday(quotesList) {
    if (!quotesList || quotesList.length === 0) return null
    const dateStr = today() // e.g. '2024-03-12'
    let hash = 0
    for (let i = 0; i < dateStr.length; i++) {
        hash = ((hash << 5) - hash) + dateStr.charCodeAt(i)
        hash |= 0
    }
    const idx = Math.abs(hash) % quotesList.length
    return quotesList[idx]
  }

  function render() {
    if (!container.isConnected) return
    const s = store.get('settings')
    const quotes = parseQuotes(s.customQuotes)
    const dailyQuote = getQuoteForToday(quotes)

    container.innerHTML = `
      <div class="glass-card quote-card animate-fade-in">
        <div class="quote-bar">
          <div class="quote-icon">💡</div>
          <div class="quote-text-wrap">
            <p class="quote-text" id="quote-text">
              "${dailyQuote.text}" <strong>— ${dailyQuote.author}</strong>
            </p>
          </div>
          <div class="quote-actions">
            <button class="quote-btn" id="quote-settings" aria-label="Quote settings">⚙️</button>
          </div>
        </div>
      </div>
    `

    const btn = document.getElementById('quote-settings')
    if (btn) {
      btn.addEventListener('click', openQuotesModal)
    }
  }

  // Render immediately
  render()

  // Update when settings change
  store.on('settings', () => {
    if (container.isConnected) render()
  })
}
