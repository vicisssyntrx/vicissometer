import { signIn, signUp, signInWithGoogle } from '../supabase.js'

export function showLoginPage(app) {
  app.innerHTML = `
    <div class="login-bg">
      <div class="login-noise"></div>
    </div>

    <div class="login-layout">
      <!-- Branding -->
      <div class="login-brand">
        <div class="login-orb">
          <img src="/logo.png" alt="Vicissometer Logo" class="login-logo-img" />
          <div class="login-orb-ring r1"></div>
          <div class="login-orb-ring r2"></div>
        </div>
        <h1 class="login-app-name">Vicissometer</h1>
        <p class="login-app-sub">Your 1% daily growth tracker</p>
      </div>

      <!-- Auth card -->
      <div class="login-card glass-card animate-slide-up">
        <!-- Tabs -->
        <div class="auth-tabs">
          <button class="auth-tab active" id="tab-signin" data-tab="signin">Sign In</button>
          <button class="auth-tab" id="tab-signup" data-tab="signup">Create Account</button>
        </div>

        <!-- Form -->
        <form class="auth-form" id="auth-form" novalidate>
          <div class="auth-field">
            <label class="auth-label" for="auth-email">Email</label>
            <div class="auth-input-wrap">
              <span class="auth-input-icon">✉️</span>
              <input
                type="email"
                id="auth-email"
                class="auth-input"
                placeholder="you@example.com"
                autocomplete="email"
                inputmode="email"
                required
              />
            </div>
          </div>

          <div class="auth-field">
            <label class="auth-label" for="auth-password">Password</label>
            <div class="auth-input-wrap">
              <span class="auth-input-icon">🔒</span>
              <input
                type="password"
                id="auth-password"
                class="auth-input"
                placeholder="Min. 6 characters"
                autocomplete="current-password"
                required
              />
              <button type="button" class="auth-eye-btn" id="toggle-password" aria-label="Show password">
                👁
              </button>
            </div>
          </div>

          <div class="auth-field" id="confirm-field" style="display:none">
            <label class="auth-label" for="auth-confirm">Confirm Password</label>
            <div class="auth-input-wrap">
              <span class="auth-input-icon">🔒</span>
              <input
                type="password"
                id="auth-confirm"
                class="auth-input"
                placeholder="Repeat your password"
                autocomplete="new-password"
              />
            </div>
          </div>

          <div class="auth-error" id="auth-error" style="display:none"></div>
          <div class="auth-success" id="auth-success" style="display:none"></div>

          <button type="submit" class="btn btn-primary auth-submit" id="auth-submit">
            <span id="auth-btn-text">Sign In</span>
          </button>

          <div class="auth-divider">
            <span>OR</span>
          </div>

          <button type="button" class="btn btn-secondary auth-google" id="auth-google">
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width="18" height="18" />
            <span>Sign in with Google</span>
          </button>
        </form>

        <p class="auth-footer-text">
          Secure login powered by <strong>Supabase</strong>
        </p>
      </div>

      <footer class="login-footer">
        <p>Made with <span class="heart">❤️</span> by Viciss_Syntrx</p>
      </footer>
    </div>
  `

  let currentTab = 'signin'

  // Tab switching
  document.getElementById('tab-signin').addEventListener('click', () => setTab('signin'))
  document.getElementById('tab-signup').addEventListener('click', () => setTab('signup'))

  function setTab(tab) {
    currentTab = tab
    document.getElementById('tab-signin').classList.toggle('active', tab === 'signin')
    document.getElementById('tab-signup').classList.toggle('active', tab === 'signup')
    document.getElementById('confirm-field').style.display = tab === 'signup' ? '' : 'none'
    document.getElementById('auth-btn-text').textContent = tab === 'signin' ? 'Sign In' : 'Create Account'
    document.getElementById('auth-password').autocomplete = tab === 'signup' ? 'new-password' : 'current-password'
    clearMessages()
  }

  // Show/hide password
  document.getElementById('toggle-password').addEventListener('click', () => {
    const input = document.getElementById('auth-password')
    input.type = input.type === 'password' ? 'text' : 'password'
  })

  // Form submit
  document.getElementById('auth-form').addEventListener('submit', async e => {
    e.preventDefault()
    clearMessages()

    const email = document.getElementById('auth-email').value.trim()
    const password = document.getElementById('auth-password').value
    const confirm = document.getElementById('auth-confirm').value

    // Validation
    if (!email || !password) { showError('Please fill in all fields.'); return }
    if (password.length < 6) { showError('Password must be at least 6 characters.'); return }
    if (currentTab === 'signup' && password !== confirm) {
      showError('Passwords do not match.'); return
    }

    const btn = document.getElementById('auth-submit')
    btn.disabled = true
    btn.innerHTML = '<span class="auth-spinner"></span> Please wait…'

    try {
      if (currentTab === 'signin') {
        await signIn(email, password)
        // onAuthStateChange in main.js handles the rest
      } else {
        const result = await signUp(email, password)
        if (result.session) {
          // Email confirmation is OFF — user is logged in immediately
          // onAuthStateChange will fire
        } else {
          // Email confirmation is ON — tell user to check email
          showSuccess('Account created! Check your email to confirm, then sign in.')
          setTab('signin')
          btn.disabled = false
          btn.innerHTML = '<span id="auth-btn-text">Sign In</span>'
          return
        }
      }
    } catch (err) {
      showError(getFriendlyError(err.message))
      btn.disabled = false
      btn.innerHTML = `<span id="auth-btn-text">${currentTab === 'signin' ? 'Sign In' : 'Create Account'}</span>`
    }
  })

  // Google Sign In
  document.getElementById('auth-google').addEventListener('click', async () => {
    try {
      await signInWithGoogle()
    } catch (err) {
      showError(getFriendlyError(err.message))
    }
  })

  function showError(msg) {
    const el = document.getElementById('auth-error')
    el.textContent = '⚠ ' + msg
    el.style.display = ''
  }

  function showSuccess(msg) {
    const el = document.getElementById('auth-success')
    el.textContent = '✓ ' + msg
    el.style.display = ''
  }

  function clearMessages() {
    document.getElementById('auth-error').style.display = 'none'
    document.getElementById('auth-success').style.display = 'none'
  }

  function getFriendlyError(msg) {
    if (msg.includes('Invalid login credentials')) return 'Incorrect email or password.'
    if (msg.includes('Email not confirmed')) return 'Please check your email to confirm your account first.'
    if (msg.includes('User already registered')) return 'An account with this email already exists. Try signing in.'
    if (msg.includes('Password should')) return 'Password must be at least 6 characters.'
    if (msg.includes('rate limit')) return 'Too many attempts. Please wait a moment.'
    return msg
  }
}
