import './style.css'

import { store } from './state.js'
import {
  getOrCreateProfile,
  getHabits,
  getAllProgress,
  subscribeToProgress,
  subscribeToHabits,
} from './db.js'
import {
  computeStreak,
  computeCoins,
  daysBetween,
  today,
} from './utils/calculations.js'
import { applySettings } from './utils/applySettings.js'
import { DEFAULT_SETTINGS } from './db.js'

import { initHeader } from './components/header.js'
import { initQuoteBar } from './components/quoteBar.js'
import { initDailyProgress } from './components/dailyProgress.js'
import { initLifeOutcomes } from './components/lifeOutcomes.js'
import { initInsights } from './components/insights.js'
import { initChart } from './components/chartViz.js'
import { initSettings } from './components/settings.js'
import { initHabitsModal } from './components/habitsModal.js'

// Progress bar animation
function setLoadingProgress(pct) {
  const el = document.getElementById('loading-bar-fill')
  if (el) el.style.width = pct + '%'
}

function hideLoadingScreen() {
  const screen = document.getElementById('loading-screen')
  if (screen) {
    screen.classList.add('fade-out')
    setTimeout(() => screen.remove(), 700)
  }
}

// ---- App Bootstrap ----
async function init() {
  try {
    setLoadingProgress(20)

    // 1. Load profile (creates on first run)
    const profile = await getOrCreateProfile()
    store.set('profile', profile)
    setLoadingProgress(40)

    // 2. Merge settings: DB settings override defaults
    const settings = { ...DEFAULT_SETTINGS, ...profile.settings }
    store.set('settings', settings)
    applySettings(settings)
    setLoadingProgress(55)

    // 3. Load habits
    const habits = await getHabits()
    store.set('habits', habits)
    setLoadingProgress(70)

    // 4. Load all progress
    const allProgress = await getAllProgress()
    store.set('allProgress', allProgress)
    setLoadingProgress(85)

    // 5. Compute derived stats
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

    // 6. Render app
    renderApp()
    setLoadingProgress(100)

    // 7. Setup realtime
    setupRealtime()

    // 8. Hide loading
    setTimeout(hideLoadingScreen, 400)

  } catch (err) {
    console.error('App init failed:', err)
    document.getElementById('loading-screen').innerHTML = `
      <div class="loading-glass" style="max-width:300px;text-align:center">
        <div style="font-size:2rem">⚠️</div>
        <h2 style="color:#EC4899;margin:8px 0">Connection Error</h2>
        <p style="color:rgba(255,255,255,0.6);font-size:0.82rem;margin-bottom:16px">
          ${err.message}<br><br>
          Make sure you've run the SQL migration in your Supabase dashboard.
        </p>
        <button onclick="location.reload()" style="
          padding:10px 24px;border-radius:999px;
          background:linear-gradient(135deg,#8B5CF6,#EC4899);
          color:white;font-weight:700;border:none;cursor:pointer;font-size:0.88rem
        ">Retry</button>
      </div>
    `
  }
}

function renderApp() {
  const app = document.getElementById('app')

  // Inject persistent background
  app.innerHTML = `
    <div class="app-bg"></div>
    <div class="app-bg-noise"></div>
    <div class="app-layout">
      <div id="header-mount"></div>
      <main class="main-content" id="main-content">
        <div id="quote-mount"></div>
        <div class="dashboard-grid" id="dashboard-grid">
          <div id="daily-progress-mount"></div>
          <div id="life-outcomes-mount"></div>
          <div id="insights-mount"></div>
          <div id="chart-mount"></div>
        </div>
      </main>
      <footer class="app-footer">
        <p>1 Percentometer &nbsp;|&nbsp; Made with <span class="heart">❤️</span> by Viciss_Syntrx</p>
      </footer>
    </div>
    <!-- keep loading screen node for fade-out -->
  `

  // Re-attach loading screen (moved to body so it layers over app)
  const loadingScreen = document.querySelector('[id="loading-screen"]')
  // Already in DOM — just let it fade

  // Mount all components
  initHeader(document.getElementById('header-mount'))
  initQuoteBar(document.getElementById('quote-mount'))
  initDailyProgress(document.getElementById('daily-progress-mount'))
  initLifeOutcomes(document.getElementById('life-outcomes-mount'))
  initInsights(document.getElementById('insights-mount'))
  initChart(document.getElementById('chart-mount'))

  // Settings drawer + habits modal are appended to body
  initSettings()
  initHabitsModal()
}

function setupRealtime() {
  // Re-fetch all progress on any change
  subscribeToProgress(async () => {
    try {
      const all = await getAllProgress()
      store.set('allProgress', all)
      const habits = store.get('habits')
      const streak = computeStreak(all, habits)
      const coins = computeCoins(all, habits)
      const completedDates = new Set(all.filter(r => r.completed).map(r => r.date))
      store.update({ streak, coins, completedDaysCount: completedDates.size })
    } catch (_) { /* ignore */ }
  })

  // Re-fetch habits on any change
  subscribeToHabits(async () => {
    try {
      const habits = await getHabits()
      store.set('habits', habits)
    } catch (_) { /* ignore */ }
  })
}

init()
