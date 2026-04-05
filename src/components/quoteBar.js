import { store } from '../state.js'
import { QUOTES } from '../utils/quotes.js'

export function initQuoteBar(container) {
  function render() {
    const idx = store.get('quoteIndex')
    const q = QUOTES[idx]
    container.innerHTML = `
      <div class="glass-card quote-card animate-fade-in">
        <div class="quote-bar">
          <div class="quote-icon">💡</div>
          <div class="quote-text-wrap">
            <p class="quote-text" id="quote-text">
              ${q.text} <strong>— ${q.author}</strong>
            </p>
          </div>
          <div class="quote-actions">
            <button class="quote-btn" id="quote-prev" aria-label="Previous quote">◀</button>
            <button class="quote-btn" id="quote-next" aria-label="Next quote">▶</button>
            <button class="quote-btn" id="quote-rand" aria-label="Random quote">⚙️</button>
          </div>
        </div>
      </div>
    `

    document.getElementById('quote-prev').addEventListener('click', () => changeQuote(-1))
    document.getElementById('quote-next').addEventListener('click', () => changeQuote(1))
    document.getElementById('quote-rand').addEventListener('click', () => {
      const rand = Math.floor(Math.random() * QUOTES.length)
      animateQuote(() => store.set('quoteIndex', rand))
    })
  }

  function changeQuote(dir) {
    animateQuote(() => {
      const cur = store.get('quoteIndex')
      const next = (cur + dir + QUOTES.length) % QUOTES.length
      store.set('quoteIndex', next)
    })
  }

  function animateQuote(update) {
    const el = document.getElementById('quote-text')
    if (el) {
      el.classList.add('changing')
      setTimeout(() => {
        update()
        const newIdx = store.get('quoteIndex')
        const q = QUOTES[newIdx]
        el.innerHTML = `${q.text} <strong>— ${q.author}</strong>`
        el.classList.remove('changing')
      }, 350)
    } else {
      update()
    }
  }

  render()

  // Auto-rotate every 30s
  let interval = setInterval(() => changeQuote(1), 30000)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) clearInterval(interval)
    else interval = setInterval(() => changeQuote(1), 30000)
  })
}
