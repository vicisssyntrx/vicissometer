import { store } from '../state.js'
import { updateGameStats, addToLedger } from '../db.js'
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
          const newMudras = currentMudras - price
          const newKavachas = (store.get('kavachas') || 0) + amount
          
          store.update({ mudras: newMudras, kavachas: newKavachas })
          await updateGameStats(newMudras, store.get('kramas'), newKavachas, store.get('urjas'))
          
          // Ledger entries
          await addToLedger('MUDRA', -price, 'SHOP_PURCHASE', `Bought ${amount} Kavacha(s)`)
          await addToLedger('KAVACHA', amount, 'SHOP_PURCHASE', `Added from shop`)
          
          showToast(`Successfully purchased ${amount} Kavacha(s)! ✨`, 'success')
          render() // Update modal
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
