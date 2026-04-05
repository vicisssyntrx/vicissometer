let toastContainer = null

function getContainer() {
  if (!toastContainer) {
    toastContainer = document.createElement('div')
    toastContainer.className = 'toast-container'
    document.body.appendChild(toastContainer)
  }
  return toastContainer
}

export function showToast(message, type = 'default', duration = 3000) {
  const container = getContainer()
  const toast = document.createElement('div')
  toast.className = `toast ${type}`
  const icons = { success: '✅', error: '❌', warning: '⚠️', default: 'ℹ️' }
  toast.innerHTML = `<span>${icons[type] || ''}</span> ${message}`
  container.appendChild(toast)

  setTimeout(() => {
    toast.classList.add('removing')
    toast.addEventListener('animationend', () => toast.remove(), { once: true })
    setTimeout(() => toast.remove(), 350)
  }, duration)
}
