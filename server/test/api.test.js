// API tests. They need a seeded database: npm run db:init && npm test
import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { app } from '../src/app.js'
import { pool } from '../src/db.js'

let server
let base

before(async () => {
  server = app.listen(0)
  await new Promise((r) => server.once('listening', r))
  base = `http://localhost:${server.address().port}/api`
})

after(async () => {
  server.close()
  await pool.end()
})

async function api(path, { method = 'GET', body, token } = {}) {
  const res = await fetch(base + path, {
    method,
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  })
  return { status: res.status, data: await res.json() }
}

const login = async (email, password) => (await api('/auth/login', { method: 'POST', body: { email, password } })).data.token
const unique = () => `t${Date.now()}${Math.random().toString(36).slice(2, 6)}@test.kz`

async function newPatient() {
  const { data } = await api('/auth/register', {
    method: 'POST',
    body: { fullName: 'Тест Пациент', phone: '87011112233', email: unique(), password: 'Secret123' },
  })
  return data.token
}

// Next Monday–Saturday date at least `daysAhead` days from now
function workDay(daysAhead) {
  const d = new Date(Date.now() + daysAhead * 86400000)
  if (d.getUTCDay() === 0) d.setUTCDate(d.getUTCDate() + 1)
  return d.toISOString().slice(0, 10)
}

async function bookingTarget() {
  const clinic = (await api('/clinics/duman')).data
  const doctor = clinic.doctors.find((d) => d.specialty === 'therapist')
  const service = clinic.services.find((s) => s.specialty === 'therapist')
  return { clinic, doctor, service, branchId: doctor.branches[0] }
}

const bookingBody = (t, date, time) => ({
  branchId: t.branchId, doctorId: t.doctor.id, serviceId: t.service.id, date, time,
  fullName: 'Тест Пациент', phone: '+7 701 111 22 33',
})

test('registration rejects invalid fields with a list of errors', async () => {
  const { status, data } = await api('/auth/register', {
    method: 'POST',
    body: { fullName: 'A', phone: '123', email: 'bad', password: 'short' },
  })
  assert.equal(status, 422)
  assert.deepEqual(Object.keys(data.fields).sort(), ['email', 'fullName', 'password', 'phone'])
})

test('register, then log in and read own profile', async () => {
  const email = unique()
  const reg = await api('/auth/register', { method: 'POST', body: { fullName: 'Айдана Сейт', phone: '+7 777 123 45 67', email, password: 'Qwerty123' } })
  assert.equal(reg.status, 201)
  assert.equal(reg.data.user.role, 'patient')
  const dup = await api('/auth/register', { method: 'POST', body: { fullName: 'Айдана Сейт', phone: '+7 777 123 45 67', email, password: 'Qwerty123' } })
  assert.equal(dup.status, 409)
  const token = await login(email, 'Qwerty123')
  const me = await api('/auth/me', { token })
  assert.equal(me.data.email, email)
  assert.equal(me.data.phone, '+7 777 123 45 67')
})

test('wrong password is rejected', async () => {
  const { status } = await api('/auth/login', { method: 'POST', body: { email: 'patient@medicenter.kz', password: 'nope' } })
  assert.equal(status, 401)
})

test('booking requires a logged-in patient', async () => {
  const t = await bookingTarget()
  assert.equal((await api('/me/appointments', { method: 'POST', body: bookingBody(t, workDay(5), '10:00') })).status, 401)
  const adminToken = await login('admin@duman.kz', 'Clinic123!')
  assert.equal((await api('/me/appointments', { method: 'POST', body: bookingBody(t, workDay(5), '10:00'), token: adminToken })).status, 403)
})

test('a slot can be booked once; the second patient gets 409', async () => {
  const t = await bookingTarget()
  const date = workDay(6)
  const slots = (await api(`/doctors/${t.doctor.id}/slots?date=${date}&serviceId=${t.service.id}`)).data
  const time = slots.at(-1)
  const first = await api('/me/appointments', { method: 'POST', body: bookingBody(t, date, time), token: await newPatient() })
  assert.equal(first.status, 201)
  assert.equal(first.data.status, 'pending')
  const second = await api('/me/appointments', { method: 'POST', body: bookingBody(t, date, time), token: await newPatient() })
  assert.equal(second.status, 409)
  const after = (await api(`/doctors/${t.doctor.id}/slots?date=${date}&serviceId=${t.service.id}`)).data
  assert.ok(!after.includes(time))
})

test('simultaneous bookings of one slot: exactly one succeeds', async () => {
  const t = await bookingTarget()
  const date = workDay(7)
  const slots = (await api(`/doctors/${t.doctor.id}/slots?date=${date}&serviceId=${t.service.id}`)).data
  const tokens = await Promise.all([newPatient(), newPatient(), newPatient()])
  const results = await Promise.all(tokens.map((token) => api('/me/appointments', { method: 'POST', body: bookingBody(t, date, slots[0]), token })))
  assert.deepEqual(results.map((r) => r.status).sort(), [201, 409, 409])
})

test('doctor and service must match: a cardiology service cannot be booked with a therapist', async () => {
  const t = await bookingTarget()
  const cardio = t.clinic.services.find((s) => s.specialty === 'cardiologist')
  const res = await api('/me/appointments', { method: 'POST', body: { ...bookingBody(t, workDay(8), '10:00'), serviceId: cardio.id }, token: await newPatient() })
  assert.equal(res.status, 422)
})

test('review only after the clinic marks the visit completed, and only once', async () => {
  const t = await bookingTarget()
  const date = workDay(9)
  const time = (await api(`/doctors/${t.doctor.id}/slots?date=${date}&serviceId=${t.service.id}`)).data[1]
  const token = await newPatient()
  const appt = (await api('/me/appointments', { method: 'POST', body: bookingBody(t, date, time), token })).data
  const review = { rating: 5, text: 'Жақсы' }
  assert.equal((await api(`/me/appointments/${appt.id}/review`, { method: 'POST', body: review, token })).status, 409)

  const adminToken = await login('admin@duman.kz', 'Clinic123!')
  const setStatus = (status) => api(`/clinic/appointments/${appt.id}`, { method: 'PATCH', body: { status }, token: adminToken })
  assert.equal((await setStatus('completed')).status, 409) // pending cannot jump to completed
  assert.equal((await setStatus('confirmed')).status, 200)
  assert.equal((await setStatus('completed')).status, 409) // the visit has not happened yet

  // Move the visit into the past, as if the day has come
  await pool.query('UPDATE appointments SET starts_at = starts_at - INTERVAL 30 DAY, ends_at = ends_at - INTERVAL 30 DAY WHERE id = ?', [appt.id])
  assert.equal((await setStatus('completed')).status, 200)

  assert.equal((await api(`/me/appointments/${appt.id}/review`, { method: 'POST', body: review, token })).status, 201)
  assert.equal((await api(`/me/appointments/${appt.id}/review`, { method: 'POST', body: review, token })).status, 409)
})

test('a clinic admin cannot see or change another clinic’s data', async () => {
  const t = await bookingTarget()
  const date = workDay(10)
  const time = (await api(`/doctors/${t.doctor.id}/slots?date=${date}&serviceId=${t.service.id}`)).data[2]
  const appt = (await api('/me/appointments', { method: 'POST', body: bookingBody(t, date, time), token: await newPatient() })).data

  const otherAdmin = await login('admin@aqzhol.kz', 'Clinic123!')
  assert.equal((await api(`/clinic/appointments/${appt.id}`, { method: 'PATCH', body: { status: 'cancelled' }, token: otherAdmin })).status, 404)
  const list = (await api('/clinic/appointments', { token: otherAdmin })).data
  assert.ok(!list.some((a) => a.id === appt.id))
  const doctorId = t.doctor.id
  const edit = await api(`/clinic/doctors/${doctorId}`, { method: 'PUT', body: { fullName: 'Хакер', specialty: 'therapist', experience: 1, branchIds: [t.branchId] }, token: otherAdmin })
  assert.equal(edit.status, 404)
})

test('patients cannot open the clinic or platform admin API', async () => {
  const token = await newPatient()
  assert.equal((await api('/clinic', { token })).status, 403)
  assert.equal((await api('/admin/organizations', { token })).status, 403)
})

test('a clinic application stays hidden until the platform admin approves it', async () => {
  const apply = await api('/auth/apply', {
    method: 'POST',
    body: {
      clinicName: 'Test Clinic', description: 'Тестілік клиника сипаттамасы.', clinicPhone: '+7 717 255 55 55',
      fullName: 'Тест Әкімші', phone: '+7 701 555 55 55', email: unique(), password: 'Clinic999',
    },
  })
  assert.equal(apply.status, 201)
  assert.equal(apply.data.user.role, 'clinic_admin')
  const clinicToken = apply.data.token
  const own = (await api('/clinic', { token: clinicToken })).data
  assert.equal(own.status, 'pending')
  assert.equal((await api(`/clinics/${own.slug}`)).status, 404)

  const adminToken = await login('admin@medicenter.kz', 'Admin123!')
  assert.equal((await api(`/admin/organizations/${own.id}`, { method: 'PATCH', body: { status: 'approved' }, token: adminToken })).status, 200)
  assert.equal((await api(`/clinics/${own.slug}`)).status, 200)
  await api(`/admin/organizations/${own.id}`, { method: 'PATCH', body: { status: 'rejected' }, token: adminToken })
})

test('the doctor sees only their own appointments', async () => {
  const token = await login('doctor@medicenter.kz', 'Doctor123!')
  const { status, data } = await api('/doctor/appointments', { token })
  assert.equal(status, 200)
  assert.equal(data.doctor.name, 'Айгерім Серікқызы')
  assert.ok(data.appointments.every((a) => a.doctor.name === 'Айгерім Серікқызы'))
})
