import './style.css'

import { supabase, onAuthStateChange, getSession } from './supabase.js'
import { store } from './state.js'
import {
  setCurrentUser,
  getOrCreateProfile,
  getHabits,
  getAllProgress,
  subscribeToProgress,
  subscribeToHabits,
  DEFAULT_SETTINGS,
} from './db.js'
import { computeStreak, computeCoins, daysBetween, today } from './utils/calculations.js'
import { applySettings } from './utils/applySettings.js'
import { showLoginPage } from './pages/login.js'

import { initHeader } from './components/header.js'
import { initQuoteBar } from './components/quoteBar.js'
import { initDailyProgress } from './components/dailyProgress.js'
import { initLifeOutcomes } from './components/lifeOutcomes.js'
import { initInsights } from './components/insights.js'
import { initChart } from './components/chartViz.js'
import { initSettings } from './components/settings.js'
import { initHabitsModal } from './components/habitsModal.js'

const app = document.getElementById('app')

// ---- State flags to prevent double-render ----
let appState = 'loading' // 'loading' | 'login' | 'dashboard'
let realtimeChannels = []

// ---- Loading progress bar ----
function setLoadingProgress(pct) {
  const el = document.getElementById('loading-bar-fill')
  if (el) el.style.width = pct + '%'
}

function hideLoadingScreen() {
  const screen = document.getElementById('loading-screen')
  if (screen) {
    screen.classList.add('fade-out')
    setTimeout(() => { if (screen.parentNode) screen.remove() }, 700)
  }
}

// ---- Teardown realtime ----
function teardownRealtime() {
  realtimeChannels.forEach(ch => {
    try { ch.unsubscribe() } catch (_) {}
  })
  realtimeChannels = []
}

// ---- Render login page ----
function renderLogin() {
  if (appState === 'login') return // already showing login
  appState = 'login'
  teardownRealtime()
  applySettings(DEFAULT_SETTINGS)
  showLoginPage(app)
  hideLoadingScreen()
}

// ---- Render dashboard ----
async function renderDashboard(userId) {
  if (appState === 'dashboard') return // already showing dashboard
  appState = 'dashboard'

  // Wipe all stale component store listeners + realtime
  store.reset()
  teardownRealtime()

  try {
    setLoadingProgress(20)
    setCurrentUser(userId)

    // Load profile (creates on first run)
    const profile = await getOrCreateProfile()
    store.set('profile', profile)
    setLoadingProgress(40)

    // Merge settings
    const settings = { ...DEFAULT_SETTINGS, ...profile.settings }
    store.set('settings', settings)
    applySettings(settings)
    setLoadingProgress(55)

    // Load habits
    const habits = await getHabits()
    store.set('habits', habits)
    setLoadingProgress(70)

    // Load all progress
    const allProgress = await getAllProgress()
    store.set('allProgress', allProgress)
    setLoadingProgress(85)

    // Compute stats
    const streak = computeStreak(allProgress, habits)
    const coins = computeCoins(allProgress, habits)
    const completedDates = new Set(allProgress.filter(r => r.completed).map(r => r.date))
    store.update({
      streak,
      coins,
      completedDaysCount: completedDates.size,
      totalDaysTracked: daysBetween(profile.start_date || settings.startDate, today()) + 1,
    })
    setLoadingProgress(95)

    // Mount app shell
    app.innerHTML = `
      <div class="app-bg"></div>
      <div class="app-bg-noise"></div>
      <div class="app-layout">
        <div id="header-mount"></div>
        <main class="main-content" id="main-content">
          <div class="dashboard-grid" id="dashboard-grid">
            <div id="daily-progress-mount"></div>
            <div id="chart-mount"></div>
            <div id="life-outcomes-mount"></div>
            <div id="insights-mount"></div>
          </div>
          <div id="quote-mount"></div>
        </main>
        <footer class="app-footer">
          <p>1 Percentometer &nbsp;|&nbsp; Made with <span class="heart">❤️</span> by Viciss_Syntrx</p>
        </footer>
      </div>
    `

    // Mount components
    initHeader(document.getElementById('header-mount'))
    initQuoteBar(document.getElementById('quote-mount'))
    initDailyProgress(document.getElementById('daily-progress-mount'))
    initLifeOutcomes(document.getElementById('life-outcomes-mount'))
    initInsights(document.getElementById('insights-mount'))
    initChart(document.getElementById('chart-mount'))
    initSettings()
    initHabitsModal()

    setLoadingProgress(100)
    setTimeout(hideLoadingScreen, 300)

    // Setup realtime AFTER DOM is ready
    setupRealtime()

  } catch (err) {
    console.error('Dashboard load failed:', err)
    appState = 'error'
    app.innerHTML = `
      <div class="login-bg"></div>
      <div style="min-height:100dvh;display:flex;align-items:center;justify-content:center;padding:24px;">
        <div class="glass-card" style="max-width:340px;width:100%;text-align:center">
          <div class="glass-card-inner">
            <div style="font-size:2rem;margin-bottom:12px">⚠️</div>
            <h2 style="color:#EC4899;margin-bottom:8px;font-size:1rem">Error Loading App</h2>
            <p style="color:var(--text-secondary);font-size:0.82rem;margin-bottom:16px;line-height:1.5">
              ${err.message}<br><br>
              Make sure you've run the SQL migration in your Supabase SQL Editor.
            </p>
            <button onclick="location.reload()" class="btn btn-primary">Retry</button>
          </div>
        </div>
      </div>
    `
    setTimeout(hideLoadingScreen, 300)
  }
}

function setupRealtime() {
  const ch1 = subscribeToProgress(async () => {
    try {
      const all = await getAllProgress()
      store.set('allProgress', all)
      const habits = store.get('habits')
      const streak = computeStreak(all, habits)
      const coins = computeCoins(all, habits)
      const completedDates = new Set(all.filter(r => r.completed).map(r => r.date))
      store.update({ streak, coins, completedDaysCount: completedDates.size })
    } catch (_) {}
  })

  const ch2 = subscribeToHabits(async () => {
    try {
      const habits = await getHabits()
      store.set('habits', habits)
    } catch (_) {}
  })

  realtimeChannels = [ch1, ch2]
}

// ---- App Bootstrap ----
async function init() {
  // Apply default theme immediately (so loading screen / login look correct)
  applySettings(DEFAULT_SETTINGS)

  // Check for existing session first (don't rely on onAuthStateChange for initial load)
  const session = await getSession()

  if (session) {
    // Already logged in — go straight to dashboard
    await renderDashboard(session.user.id)
  } else {
    // Not logged in — show login
    renderLogin()
  }

  // Now listen for future auth changes (login/logout)
  onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session) {
      appState = 'loading' // allow re-render
      renderDashboard(session.user.id)
    } else if (event === 'SIGNED_OUT') {
      appState = 'loading' // allow re-render
      store.update({
        profile: null, habits: [], todayState: {}, allProgress: [],
        coins: 0, streak: 0, completedDaysCount: 0, selectedDate: today()
      })
      renderLogin()
    }
  })
}

init()
