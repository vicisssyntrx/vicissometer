/**
 * Date helpers
 */
export function today() {
  return new Date().toISOString().split('T')[0]
}

export function formatDate(dateStr) {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

export function datesBetween(startStr, endStr) {
  const dates = []
  const start = new Date(startStr)
  const end = new Date(endStr)
  const cur = new Date(start)
  while (cur <= end) {
    dates.push(cur.toISOString().split('T')[0])
    cur.setDate(cur.getDate() + 1)
  }
  return dates
}

export function daysBetween(startStr, endStr) {
  const a = new Date(startStr)
  const b = new Date(endStr)
  return Math.max(0, Math.round((b - a) / 86400000))
}

/**
 * Growth factor calculations
 * 1% daily compound growth model
 * completionRate: 0.0 to 1.0
 */
export function dailyGrowthRate(completionRate) {
  // Full completion = 1% growth → multiplier 1.01
  // Partial = proportional
  return 1 + (0.01 * completionRate)
}

/**
 * Compute cumulative growth factor from an array of daily completions
 * @param {Array<{date: string, completionRate: number}>} days
 * @returns {number} growth factor (e.g. 1.95)
 */
export function cumulativeGrowthFactor(days) {
  if (!days || days.length === 0) return 1.0
  return days.reduce((acc, day) => {
    return acc * dailyGrowthRate(day.completionRate)
  }, 1.0)
}

/**
 * Build chart data series from daily_progress records
 * @param {string} startDate
 * @param {string} endDate   (today or target)
 * @param {Array} progressRecords  - flat array from daily_progress table
 * @param {Array} habits           - habits array (for weights)
 * @param {string} period          - 'week' | 'month' | 'year' | 'all'
 * @returns {{ labels: string[], yourProgress: number[], expected: number[] }}
 */
export function buildChartData(startDate, endDate, progressRecords, habits, period) {
  const allDays = datesBetween(startDate, endDate)
  const today_ = today()

  // Map date → completion rate
  const byDate = {}
  progressRecords.forEach(r => {
    if (!byDate[r.date]) byDate[r.date] = { hits: 0, weight: 0 }
    const habit = habits.find(h => h.id === r.habit_id)
    const w = habit ? habit.weight : 0
    if (r.completed) byDate[r.date].hits += w
    byDate[r.date].weight += w
  })

  // Filter by period
  let filteredDays = allDays.filter(d => d <= today_)
  if (period === 'week') {
    filteredDays = filteredDays.slice(-7)
  } else if (period === 'month') {
    filteredDays = filteredDays.slice(-30)
  } else if (period === 'year') {
    filteredDays = filteredDays.slice(-365)
  }

  let yourGrowth = 1.0
  let expectedGrowth = 1.0
  const yourProgress = []
  const expected = []
  const labels = []

  filteredDays.forEach(date => {
    const rec = byDate[date]
    const totalWeight = rec ? rec.weight : 100
    const rate = rec && totalWeight > 0 ? rec.hits / totalWeight : 0
    yourGrowth *= dailyGrowthRate(rate)
    expectedGrowth *= 1.01
    yourProgress.push(parseFloat(yourGrowth.toFixed(4)))
    expected.push(parseFloat(expectedGrowth.toFixed(4)))
    labels.push(formatChartLabel(date, period))
  })

  return { labels, yourProgress, expected }
}

function formatChartLabel(dateStr, period) {
  const d = new Date(dateStr + 'T00:00:00')
  if (period === 'week') return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' })
  if (period === 'month') return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

/**
 * Compute today's completion percentage from habit states
 * @param {Object} todayState  { habitId: boolean }
 * @param {Array} activeHabits
 * @returns {number} 0–100
 */
export function computeTodayPct(todayState, activeHabits) {
  if (!activeHabits || activeHabits.length === 0) return 0
  const totalWeight = activeHabits.reduce((s, h) => s + h.weight, 0)
  if (totalWeight === 0) return 0
  const doneWeight = activeHabits.reduce((s, h) => {
    return s + (todayState[h.id] ? h.weight : 0)
  }, 0)
  return parseFloat(((doneWeight / totalWeight) * 100).toFixed(2))
}

/**
 * Compute per-habit lifetime completion percentage
 * @param {string} habitId
 * @param {Array} allProgress
 * @param {string} startDate
 * @returns {number} 0–100
 */
export function habitLifetimePct(habitId, allProgress, startDate) {
  const total = daysBetween(startDate, today())
  if (total === 0) return 0
  const done = allProgress.filter(r => r.habit_id === habitId && r.completed).length
  return parseFloat(((done / total) * 100).toFixed(1))
}

/**
 * Compute streak from progress records
 * @param {Array} allProgress [{date, completed}]
 * @param {Array} habits
 */
export function computeStreak(allProgress, habits) {
  if (!allProgress.length || !habits.length) return 0
  const byDate = {}
  allProgress.forEach(r => {
    if (!byDate[r.date]) byDate[r.date] = 0
    if (r.completed) byDate[r.date]++
  })
  let streak = 0
  const cur = new Date()
  cur.setHours(0, 0, 0, 0)
  while (true) {
    const ds = cur.toISOString().split('T')[0]
    if (byDate[ds] && byDate[ds] > 0) {
      streak++
      cur.setDate(cur.getDate() - 1)
    } else {
      break
    }
  }
  return streak
}

/**
 * Compute coins from progress
 * Each fully completed day = 10 coins
 * Partial = proportional
 * Streak bonus: +5 per day in current streak
 */
export function computeCoins(allProgress, habits) {
  if (!allProgress.length || !habits.length) return 0
  const byDate = {}
  allProgress.forEach(r => {
    if (!byDate[r.date]) byDate[r.date] = { done: 0, total: 0 }
    byDate[r.date].total++
    if (r.completed) byDate[r.date].done++
  })
  let coins = 0
  Object.values(byDate).forEach(({ done, total }) => {
    if (total > 0) coins += Math.round((done / total) * 10)
  })
  // Streak bonus
  const streak = computeStreak(allProgress, habits)
  coins += streak * 5
  return coins
}
