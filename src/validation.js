// Client-side checks for quick feedback. The server repeats every one of them.

const nameOk = (v) => v.trim().length >= 2 && /^[\p{L}\s'.-]+$/u.test(v.trim())
const phoneOk = (v) => /^[78]7\d{9}$/.test(v.replace(/\D/g, ''))
const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())
export const passwordOk = (v) => v.length >= 8 && /\d/.test(v) && /\p{L}/u.test(v)

export function validateContact(form) {
  const errors = {}
  if (!nameOk(form.name)) errors.name = 'errName'
  if (!phoneOk(form.phone)) errors.phone = 'errPhone'
  if (form.comment.length > 300) errors.comment = 'errComment'
  if (!form.consent) errors.consent = 'errConsent'
  return errors
}

export function validateAccount(form) {
  const errors = {}
  if ('fullName' in form && !nameOk(form.fullName)) errors.fullName = 'errName'
  if ('phone' in form && !phoneOk(form.phone)) errors.phone = 'errPhone'
  if (!emailOk(form.email)) errors.email = 'errEmail'
  if (!passwordOk(form.password)) errors.password = 'errPassword'
  return errors
}

// Formats digits as +7 7XX XXX XX XX while typing.
export function formatPhone(value) {
  let d = value.replace(/\D/g, '')
  if (d.startsWith('8')) d = '7' + d.slice(1)
  if (d && !d.startsWith('7')) d = '7' + d
  d = d.slice(0, 11)
  const parts = [d.slice(1, 4), d.slice(4, 7), d.slice(7, 9), d.slice(9, 11)].filter(Boolean)
  return d ? `+7 ${parts.join(' ')}`.trim() : ''
}
