import { signInWithGoogle } from '../supabase.js'

export function showLoginPage(app) {
  app.innerHTML = `
    <div class="login-bg">
      <div class="login-noise"></div>
    </div>

    <div class="login-layout">
      <!-- Branding -->
      <div class="login-brand" style="margin-bottom: 2rem;">
        <div class="login-orb">
          <img src="/logo.png" alt="Vicissometer Logo" class="login-logo-img" />
          <div class="login-orb-ring r1"></div>
          <div class="login-orb-ring r2"></div>
        </div>
        <h1 class="login-app-name" style="font-size: 2.5rem; text-shadow: 0 4px 12px rgba(0,0,0,0.5);">Vicissometer</h1>
        <p class="login-app-sub" style="font-size: 1.1rem; opacity: 0.9;">Your 1% daily growth tracker</p>
      </div>

      <!-- Auth card -->
      <div class="login-card glass-card animate-slide-up" style="max-width: 400px; padding: 2.5rem; display: flex; flex-direction: column; align-items: center; gap: 1.5rem; background: rgba(18, 18, 20, 0.7); backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.05);">
        
        <div style="text-align: center;">
          <h2 style="color: #fff; font-size: 1.4rem; margin-bottom: 0.5rem; font-weight: 600;">Welcome Back</h2>
          <p style="color: var(--text-secondary); font-size: 0.95rem; line-height: 1.5;">Sign in to sync your habits and continue your growth journey.</p>
        </div>

        <button type="button" class="btn btn-secondary auth-google" id="auth-google" style="width: 100%; padding: 0.8rem 1.5rem; border-radius: 12px; background: rgba(255,255,255,0.05); hover: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center; gap: 0.75rem; font-size: 1rem; color: #fff; transition: all 0.2s ease; cursor: pointer;">
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width="20" height="20" />
          <span>Continue with Google</span>
        </button>

        <div class="auth-error" id="auth-error" style="display:none; color: #ef4444; background: rgba(239, 68, 68, 0.1); padding: 0.75rem; border-radius: 8px; width: 100%; font-size: 0.85rem; text-align: center; border: 1px solid rgba(239, 68, 68, 0.2);"></div>
        
        <p class="auth-footer-text" style="font-size: 0.8rem; color: rgba(255,255,255,0.4); margin-top: 1rem;">
          Secure authentication powered by <strong>Supabase</strong>
        </p>
      </div>

      <footer class="login-footer" style="margin-top: 3rem;">
        <p>Made with <span class="heart">❤️</span> by Viciss_Syntrx</p>
      </footer>
    </div>
  `

  // Google Sign In
  const googleBtn = document.getElementById('auth-google')
  if (googleBtn) {
    googleBtn.addEventListener('click', async () => {
      googleBtn.style.opacity = '0.7';
      googleBtn.style.pointerEvents = 'none';
      try {
        await signInWithGoogle()
      } catch (err) {
        showError(getFriendlyError(err.message))
        googleBtn.style.opacity = '1';
        googleBtn.style.pointerEvents = 'auto';
      }
    })
  }

  function showError(msg) {
    const el = document.getElementById('auth-error')
    if (el) {
      el.textContent = '⚠ ' + msg
      el.style.display = 'block'
    }
  }

  function getFriendlyError(msg) {
    if (msg.includes('rate limit')) return 'Too many attempts. Please wait a moment.'
    return msg
  }
}
