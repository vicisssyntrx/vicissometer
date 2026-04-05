import { DEFAULT_SETTINGS } from './db.js'
import { today } from './utils/calculations.js'

/**
 * Simple reactive state store with pub/sub
 */
class Store {
  constructor(initial) {
    this._state = { ...initial }
    this._listeners = {}
  }

  get(key) {
    return this._state[key]
  }

  getAll() {
    return { ...this._state }
  }

  set(key, value) {
    this._state[key] = value
    this._emit(key, value)
    this._emit('*', this._state)
  }

  update(partial) {
    Object.assign(this._state, partial)
    Object.keys(partial).forEach(k => this._emit(k, this._state[k]))
    this._emit('*', this._state)
  }

  on(key, fn) {
    if (!this._listeners[key]) this._listeners[key] = []
    this._listeners[key].push(fn)
    return () => this.off(key, fn)
  }

  off(key, fn) {
    if (!this._listeners[key]) return
    this._listeners[key] = this._listeners[key].filter(f => f !== fn)
  }

  reset() {
    this._listeners = {}
  }

  // Public emit for custom events (no state change)
  emit(key) {
    this._emit(key)
  }

  _emit(key, value) {
    if (this._listeners[key]) {
      this._listeners[key].forEach(fn => fn(value))
    }
  }
}

export const store = new Store({
  // Profile
  profile: null,

  // Habits (from DB)
  habits: [],

  // Today's habit states: { habitId: boolean }
  todayState: {},

  // Selected date for progress card
  selectedDate: today(),

  // All progress records from DB
  allProgress: [],

  // Chart period
  chartPeriod: 'week',

  // Quote index
  quoteIndex: 0,

  // Computed (updated after data loads)
  todayPct: 0,
  growthFactor: 1.0,
  completedDaysCount: 0,
  totalDaysTracked: 0,
  coins: 0,
  streak: 0,

  // Settings (initialized from profile.settings in main.js)
  settings: { ...DEFAULT_SETTINGS },
})
