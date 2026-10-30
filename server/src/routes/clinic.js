import { Router } from 'express'
import { query, one, transaction } from '../db.js'
import { handle, HttpError } from '../http.js'
import { requireRole } from '../auth.js'
import { check, normalizePhone } from '../validation.js'
import { clinicDetails } from '../clinics.js'
import { astanaNow } from '../time.js'
import { appointmentSelect, mapAppointment } from './patient.js'
import { specialties } from '../../../shared/constants.js'

// Clinic admin cabinet. Every query is scoped to req.user.organization_id,
// so an admin can never read or change another clinic's data.
export const clinic = Router()
clinic.use(requireRole('clinic_admin'))

const orgId = (req) => req.user.organization_id
const isSpecialty = (v) => specialties.some((s) => s.id === v)

const owned = async (table, req) => {
  const row = await one(`SELECT * FROM ${table} WHERE id = ? AND organization_id = ?`, [Number(req.params.id), orgId(req)])
  if (!row) throw new HttpError(404, 'not_found')
  return row
}

clinic.get('/', handle(async (req, res) => {
  const org = await one('SELECT * FROM organizations WHERE id = ?', [orgId(req)])
  res.json(await clinicDetails(org, { includeInactive: true }))
}))

clinic.put('/', handle(async (req, res) => {
  const b = req.body ?? {}
  check(b, { name: 'text', phone: 'phone', 'description.kk': 'longText', 'description.ru': 'longText', 'hours.kk': 'text', 'hours.ru': 'text' })
  await query(
    'UPDATE organizations SET name = ?, phone = ?, description_kk = ?, description_ru = ?, hours_kk = ?, hours_ru = ? WHERE id = ?',
    [b.name.trim(), normalizePhone(b.phone), b.description.kk.trim(), b.description.ru.trim(), b.hours.kk.trim(), b.hours.ru.trim(), orgId(req)],
  )
  res.json({ ok: true })
}))

// Branches
const checkBranch = (b) => {
  check(b, { district: 'district', 'address.kk': 'text', 'address.ru': 'text' })
}

clinic.post('/branches', handle(async (req, res) => {
  checkBranch(req.body ?? {})
  const { district, address } = req.body
  await query('INSERT INTO branches (organization_id, district, address_kk, address_ru) VALUES (?, ?, ?, ?)', [orgId(req), district, address.kk.trim(), address.ru.trim()])
  res.status(201).json({ ok: true })
}))

clinic.put('/branches/:id', handle(async (req, res) => {
  const branch = await owned('branches', req)
  checkBranch(req.body ?? {})
  const { district, address } = req.body
  await query('UPDATE branches SET district = ?, address_kk = ?, address_ru = ? WHERE id = ?', [district, address.kk.trim(), address.ru.trim(), branch.id])
  res.json({ ok: true })
}))

clinic.delete('/branches/:id', handle(async (req, res) => {
  const branch = await owned('branches', req)
  if (await one('SELECT TOP 1 id FROM appointments WHERE branch_id = ?', [branch.id])) throw new HttpError(409, 'has_appointments')
  await query('DELETE FROM branches WHERE id = ?', [branch.id])
  res.json({ ok: true })
}))

// Services
const checkService = (b) => {
  check(b, { price: 'price', duration: 'duration', 'name.kk': 'text', 'name.ru': 'text' })
  if (!isSpecialty(b.specialty)) throw new HttpError(422, 'validation', { specialty: 'specialty' })
}

clinic.post('/services', handle(async (req, res) => {
  const b = req.body ?? {}
  checkService(b)
  await query(
    'INSERT INTO services (organization_id, specialty_id, name_kk, name_ru, price, duration) VALUES (?, ?, ?, ?, ?, ?)',
    [orgId(req), b.specialty, b.name.kk.trim(), b.name.ru.trim(), b.price, b.duration],
  )
  res.status(201).json({ ok: true })
}))

clinic.put('/services/:id', handle(async (req, res) => {
  const service = await owned('services', req)
  const b = req.body ?? {}
  checkService(b)
  await query(
    'UPDATE services SET specialty_id = ?, name_kk = ?, name_ru = ?, price = ?, duration = ?, active = ? WHERE id = ?',
    [b.specialty, b.name.kk.trim(), b.name.ru.trim(), b.price, b.duration, b.active !== false, service.id],
  )
  res.json({ ok: true })
}))

// Doctors
const checkDoctor = async (req) => {
  const b = req.body ?? {}
  check(b, { fullName: 'fullName', experience: 'experience' })
  if (!isSpecialty(b.specialty)) throw new HttpError(422, 'validation', { specialty: 'specialty' })
  const ids = Array.isArray(b.branchIds) ? b.branchIds.map(Number) : []
  const own = ids.length ? await query('SELECT id FROM branches WHERE organization_id = ? AND id IN (?)', [orgId(req), ids]) : []
  if (!ids.length || own.length !== new Set(ids).size) throw new HttpError(422, 'validation', { branchIds: 'branches' })
  return ids
}

const setDoctorBranches = async (tx, doctorId, branchIds) => {
  await tx.query('DELETE FROM doctor_branches WHERE doctor_id = ?', [doctorId])
  for (const branchId of new Set(branchIds)) {
    await tx.query('INSERT INTO doctor_branches (doctor_id, branch_id) VALUES (?, ?)', [doctorId, branchId])
  }
}

clinic.post('/doctors', handle(async (req, res) => {
  const branchIds = await checkDoctor(req)
  const b = req.body
  await transaction(async (tx) => {
    const id = await tx.insert(
      'INSERT INTO doctors (organization_id, full_name, specialty_id, experience) OUTPUT INSERTED.id VALUES (?, ?, ?, ?)',
      [orgId(req), b.fullName.trim(), b.specialty, b.experience],
    )
    await setDoctorBranches(tx, id, branchIds)
  })
  res.status(201).json({ ok: true })
}))

clinic.put('/doctors/:id', handle(async (req, res) => {
  const doctor = await owned('doctors', req)
  const branchIds = await checkDoctor(req)
  const b = req.body
  await transaction(async (tx) => {
    await tx.query(
      'UPDATE doctors SET full_name = ?, specialty_id = ?, experience = ?, active = ? WHERE id = ?',
      [b.fullName.trim(), b.specialty, b.experience, b.active !== false, doctor.id],
    )
    await setDoctorBranches(tx, doctor.id, branchIds)
  })
  res.json({ ok: true })
}))

// Appointments
const transitions = { pending: ['confirmed', 'cancelled'], confirmed: ['completed', 'cancelled'] }

clinic.get('/appointments', handle(async (req, res) => {
  const rows = await query(`${appointmentSelect.replace('SELECT', 'SELECT TOP 200')} WHERE a.organization_id = ? ORDER BY a.starts_at DESC`, [orgId(req)])
  res.json(rows.map(mapAppointment))
}))

clinic.patch('/appointments/:id', handle(async (req, res) => {
  const appt = await owned('appointments', req)
  const status = req.body?.status
  if (!transitions[appt.status]?.includes(status)) throw new HttpError(409, 'bad_transition')
  // A visit can only be marked completed once it has started; reviews depend on this
  if (status === 'completed' && appt.starts_at > astanaNow()) throw new HttpError(409, 'not_started')
  await query('UPDATE appointments SET status = ? WHERE id = ?', [status, appt.id])
  res.json({ ok: true })
}))
