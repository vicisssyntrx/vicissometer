import { store } from '../state.js'
import { buildChartData, today } from '../utils/calculations.js'
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

export function initChart(container) {
  let chartInstance = null
  const PERIODS = ['week', 'month', 'year', 'all']

  function render() {
    const period = store.get('chartPeriod')
    container.innerHTML = `
      <div class="glass-card chart-card">
        <div class="glass-card-inner">
          <div class="chart-controls">
            <h2 class="card-title">Progress Visualization</h2>
            <div style="display:flex;align-items:center;gap:8px">
              <button class="chart-nav-btn" id="chart-prev">◀</button>
              <button class="chart-nav-btn" id="chart-next">▶</button>
            </div>
          </div>
          <div class="chart-period-tabs" style="margin-bottom:16px">
            ${PERIODS.map(p => `
              <button class="chart-tab ${period === p ? 'active' : ''}" data-period="${p}">
                ${p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            `).join('')}
          </div>
          <div class="chart-wrap">
            <canvas id="progress-chart"></canvas>
          </div>
        </div>
      </div>
    `

    renderChart(period)

    // Period tabs
    container.querySelectorAll('.chart-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        store.set('chartPeriod', btn.dataset.period)
        render()
      })
    })

    // Nav
    document.getElementById('chart-prev').addEventListener('click', () => {
      const cur = PERIODS.indexOf(store.get('chartPeriod'))
      if (cur > 0) { store.set('chartPeriod', PERIODS[cur - 1]); render() }
    })
    document.getElementById('chart-next').addEventListener('click', () => {
      const cur = PERIODS.indexOf(store.get('chartPeriod'))
      if (cur < PERIODS.length - 1) { store.set('chartPeriod', PERIODS[cur + 1]); render() }
    })
  }

  function renderChart(period) {
    const allProgress = store.get('allProgress')
    const habits = store.get('habits')
    const profile = store.get('profile')
    const settings = store.get('settings')
    const startDate = profile?.start_date || settings.startDate
    const endDate = today()

    const { labels, yourProgress, expected } = buildChartData(
      startDate, endDate, allProgress, habits, period
    )

    const canvas = document.getElementById('progress-chart')
    if (!canvas) return

    if (chartInstance) { chartInstance.destroy(); chartInstance = null }

    const ctx = canvas.getContext('2d')
    const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#8B5CF6'

    // Gradient for area fill
    const gradYour = ctx.createLinearGradient(0, 0, 0, 200)
    gradYour.addColorStop(0, 'rgba(139,92,246,0.35)')
    gradYour.addColorStop(1, 'rgba(139,92,246,0.02)')

    // Fetch theme colors for chart synchronization
    const style = getComputedStyle(document.documentElement)
    const textColor = style.getPropertyValue('--text-secondary').trim() || '#6E6E73'
    const gridColor = isDarkMode() ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'
    const tooltipBg = isDarkMode() ? 'rgba(20,20,25,0.95)' : 'rgba(10,5,0,0.88)'

    chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Your Progress',
            data: yourProgress,
            borderColor: accentColor,
            backgroundColor: gradYour,
            borderWidth: 2,
            pointRadius: labels.length > 60 ? 0 : 3,
            pointHoverRadius: 5,
            pointBackgroundColor: accentColor,
            pointBorderColor: 'white',
            pointBorderWidth: 1.5,
            fill: true,
            tension: 0.4,
          },
          {
            label: 'Expected (1% daily)',
            data: expected,
            borderColor: isDarkMode() ? 'rgba(255,255,255,0.2)' : 'rgba(120,120,140,0.5)',
            backgroundColor: 'transparent',
            borderWidth: 1.5,
            borderDash: [6, 4],
            pointRadius: 0,
            fill: false,
            tension: 0.4,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            align: 'end',
            labels: {
              boxWidth: 10,
              boxHeight: 10,
              borderRadius: 3,
              useBorderRadius: true,
              font: { size: 11, family: 'Inter', weight: '600' },
              color: textColor,
              padding: 12,
            }
          },
          tooltip: {
            backgroundColor: tooltipBg,
            titleColor: '#FFFFFF',
            bodyColor: 'rgba(255,255,255,0.85)',
            borderColor: accentColor + '66',
            borderWidth: 1,
            padding: 10,
            cornerRadius: 10,
            titleFont: { size: 12, weight: '600', family: 'Inter' },
            bodyFont: { size: 11, family: 'Inter' },
            callbacks: {
              label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y.toFixed(3)}x`
            }
          }
        },
        scales: {
          x: {
            grid: { color: gridColor, drawBorder: false },
            ticks: {
              color: textColor,
              font: { size: 10, family: 'Inter' },
              maxTicksLimit: 8,
              maxRotation: 30,
            },
            border: { display: false }
          },
          y: {
            grid: { color: gridColor, drawBorder: false },
            ticks: {
              color: textColor,
              font: { size: 10, family: 'Inter' },
              callback: v => v.toFixed(2) + 'x'
            },
            border: { display: false }
          }
        },
        animation: { duration: 600, easing: 'easeOutQuart' }
      }
    })
  }

  function isDarkMode() {
    return document.body.classList.contains('theme-dark')
  }

  render()

  // Re-render chart when progress is updated or settings/theme change
  store.on('allProgressSaved', () => { if (container.isConnected) render() })
  store.on('habits', () => { if (container.isConnected) render() })
  store.on('settingsChanged', () => { if (container.isConnected) render() })
}
