import { store } from '../state.js'
import { purchaseKavacha } from '../db.js'
import { showToast } from '../utils/toast.js'

export function initShop() {
  const overlay = document.createElement('div')
  overlay.className = 'modal-overlay'
  overlay.id = 'shop-overlay'
  document.body.appendChild(overlay)

  function render() {
    const mudras = store.get('mudras') || 0
    overlay.innerHTML = `
      <div class="modal-content glass-card p-6">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-bold">Kavacha Shop 🛡️</h2>
          <button class="close-btn" id="shop-close">✕</button>
        </div>
        
        <div class="flex items-center justify-between mb-6 p-4 bg-accent/10 rounded-xl">
          <div class="text-sm font-semibold text-secondary">Your Mudras:</div>
          <div class="text-lg font-bold text-accent">🪙 ${mudras}</div>
        </div>

        <div class="shop-list">
          ${shopRow(1, 50)}
          ${shopRow(2, 100)}
          ${shopRow(3, 150)}
        </div>

        <p class="text-xs text-center text-muted mt-6">
          Kavachas protect your Krama (Streak) if you miss a day.<br/>
          Use them wisely to maintain your journey.
        </p>
      </div>
    `

    const closeBtn = document.getElementById('shop-close')
    if (closeBtn) closeBtn.onclick = () => overlay.classList.remove('open')
    overlay.onclick = (e) => { if (e.target === overlay) overlay.classList.remove('open') }

    document.querySelectorAll('.buy-btn').forEach(btn => {
      btn.onclick = async () => {
        const amount = parseInt(btn.dataset.amount)
        const price = parseInt(btn.dataset.price)
        const currentMudras = store.get('mudras') || 0

        if (currentMudras < price) {
          showToast('Not enough Mudras! 🪙', 'error')
          return
        }

        if (confirm(`Buy ${amount} Kavacha(s) for ${price} Mudras?`)) {
          try {
            await purchaseKavacha(amount, price)
            showToast(`Successfully purchased ${amount} Kavacha(s)! ✨`, 'success')
            // Don't render() immediately if you want realtime to catch up, 
            // but we can close it or let realtime update the header natively.
            // Let's close modal since it was a success.
            overlay.classList.remove('open')
          } catch (err) {
            showToast(err.message || 'Purchase failed', 'error')
          }
        }
      }
    })
  }

  function shopRow(amount, price) {
    return `
      <div class="shop-row">
        <div class="shop-item-info">
          <span class="shop-item-icon">🛡️</span>
          <div>
            <div class="font-bold">${amount} Kavacha(s)</div>
            <div class="text-xs text-muted">Protect your Krama</div>
          </div>
        </div>
        <button class="btn btn-primary buy-btn flex items-center gap-2" 
          data-amount="${amount}" data-price="${price}">
          🪙 ${price}
        </button>
      </div>
    `
  }

  document.addEventListener('open-shop', () => {
    overlay.classList.add('open')
    render()
  })
}
