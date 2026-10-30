// Server-side validation rules. The frontend repeats some of them for quick feedback,
// but only these are trusted.
import { HttpError } from './http.js'
import { districtIds } from '../../shared/constants.js'

const rules = {
  fullName: (v) => typeof v === 'string' && v.trim().length >= 2 && v.trim().length <= 120 && /^[\p{L}\s'.-]+$/u.test(v.trim()),
  phone: (v) => typeof v === 'string' && /^[78]7\d{9}$/.test(v.replace(/\D/g, '')),
  email: (v) => typeof v === 'string' && v.length <= 150 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()),
  password: (v) => typeof v === 'string' && v.length >= 8 && v.length <= 72 && /\d/.test(v) && /\p{L}/u.test(v),
  comment: (v) => v === undefined || (typeof v === 'string' && v.length <= 300),
  reviewText: (v) => v === undefined || (typeof v === 'string' && v.length <= 500),
  rating: (v) => Number.isInteger(v) && v >= 1 && v <= 5,
  text: (v) => typeof v === 'string' && v.trim().length >= 2 && v.trim().length <= 200,
  longText: (v) => typeof v === 'string' && v.trim().length >= 10 && v.trim().length <= 1000,
  district: (v) => districtIds.includes(v),
  price: (v) => Number.isInteger(v) && v >= 500 && v <= 2000000,
  duration: (v) => [15, 30, 45, 60, 90, 120].includes(v),
  experience: (v) => Number.isInteger(v) && v >= 0 && v <= 60,
  id: (v) => Number.isInteger(v) && v > 0,
}

// check(body, { field: 'rule' }) throws 422 listing every invalid field.
// Nested bilingual fields use dotted keys: { 'name.kk': 'text' }.
export function check(body, schema) {
  const fields = {}
  for (const [field, rule] of Object.entries(schema)) {
    const value = field.split('.').reduce((obj, key) => obj?.[key], body)
    if (!rules[rule](value)) fields[field] = rule
  }
  if (Object.keys(fields).length) throw new HttpError(422, 'validation', fields)
}

export const normalizePhone = (v) => {
  const d = v.replace(/\D/g, '').replace(/^8/, '7')
  return `+${d[0]} ${d.slice(1, 4)} ${d.slice(4, 7)} ${d.slice(7, 9)} ${d.slice(9, 11)}`
}
