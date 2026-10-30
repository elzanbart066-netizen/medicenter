// All appointment times are stored as Astana wall-clock time (UTC+5) in "YYYY-MM-DD HH:MM:SS".
const OFFSET_MS = 5 * 3600 * 1000

export const astanaNow = () => new Date(Date.now() + OFFSET_MS).toISOString().slice(0, 19).replace('T', ' ')

export const addMinutes = (dateTime, minutes) =>
  new Date(new Date(dateTime.replace(' ', 'T') + 'Z').getTime() + minutes * 60000).toISOString().slice(0, 19).replace('T', ' ')

export const isDate = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v))

// Working day 09:00–18:00, Monday to Saturday, in 30-minute steps.
export const WORK_START = 9 * 60
export const WORK_END = 18 * 60
export const STEP = 30

export const weekday = (date) => new Date(date + 'T00:00:00Z').getUTCDay()

export const toMinutes = (hhmm) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5))
export const fromMinutes = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
