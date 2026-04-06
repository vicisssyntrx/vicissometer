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
 * Mudra (Coins) distribution logic
 * Total 10 mudras per day divided among N habits
 */
export function getMudraRewards(totalHabits) {
  if (totalHabits <= 0) return [];
  if (totalHabits === 3) return [4, 3, 3];
  if (totalHabits === 4) return [3, 2, 1, 4];
  if (totalHabits === 5) return [1, 1, 2, 2, 4];
  if (totalHabits === 6) return [1, 1, 1, 2, 2, 3];

  // Generalized fallback for N
  const arr = new Array(totalHabits).fill(1);
  const sum = totalHabits;
  const remaining = 10 - sum;
  if (remaining >= 0) {
    arr[totalHabits - 1] += remaining;
  } else {
    // If N > 10, just give 1 to each (capped at N)
    return new Array(totalHabits).fill(1);
  }
  return arr;
}

/**
 * Compute total Mudras from progress history
 */
export function computeMudras(allProgress, habits) {
  if (!allProgress.length || !habits.length) return 0;
  
  // Group by date
  const byDate = {};
  allProgress.forEach(r => {
    if (!byDate[r.date]) byDate[r.date] = {};
    byDate[r.date][r.habit_id] = r.completed;
  });

  const rewards = getMudraRewards(habits.length);

  let total = 0;
  Object.keys(byDate).forEach(date => {
    habits.forEach((h, idx) => {
      if (byDate[date][h.id]) {
        total += rewards[idx] || 0;
      }
    });
  });
  return total;
}

/**
 * Compute Krama (Streak) from progress
 * A day counts towards krama only if ALL habits completed OR Kavacha used.
 */
export function computeKramas(allProgress, habits, kavachasUsedDates = []) {
  if (!allProgress.length || !habits.length) return 0;

  const byDate = {};
  allProgress.forEach(r => {
    if (!byDate[r.date]) byDate[r.date] = 0;
    if (r.completed) byDate[r.date]++;
  });

  const today_ = today();
  let krama = 0;
  let cur = new Date();
  cur.setHours(0, 0, 0, 0);

  // Walk backwards
  while (true) {
    const ds = cur.toISOString().split('T')[0];
    const isFull = byDate[ds] === habits.length;
    const isShielded = kavachasUsedDates.includes(ds);

    if (isFull || isShielded) {
      krama++;
      cur.setDate(cur.getDate() - 1);
    } else {
      // If it's today and not done yet, don't break the krama yet
      if (ds === today_) {
        cur.setDate(cur.getDate() - 1);
        continue;
      }
      break;
    }
  }
  return krama;
}
