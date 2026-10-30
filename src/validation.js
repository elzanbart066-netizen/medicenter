// Client-side checks for the booking form. The server must repeat them;
// these only give the patient fast feedback.

export function validateContact(form) {
  const errors = {}
  const name = form.name.trim()
  if (name.length < 2 || !/^[\p{L}\s'-]+$/u.test(name)) errors.name = 'errName'

  const phoneDigits = form.phone.replace(/\D/g, '')
  if (!/^[78]7\d{9}$/.test(phoneDigits)) errors.phone = 'errPhone'

  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) errors.email = 'errEmail'
  if (form.iin && !/^\d{12}$/.test(form.iin.trim())) errors.iin = 'errIin'
  if (form.comment.length > 300) errors.comment = 'errComment'
  if (!form.consent) errors.consent = 'errConsent'
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
