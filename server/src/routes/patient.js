import { Router } from 'express'
import { query, one, transaction } from '../db.js'
import { handle, HttpError } from '../http.js'
import { requireRole } from '../auth.js'
import { check, normalizePhone } from '../validation.js'
import { freeSlots } from '../clinics.js'
import { addMinutes, astanaNow, isDate } from '../time.js'

export const patient = Router()
patient.use(requireRole('patient'))

export const appointmentSelect = `
  SELECT a.id, a.starts_at, a.ends_at, a.status, a.patient_name, a.patient_phone, a.comment,
         o.name AS clinic_name, o.slug AS clinic_slug,
         b.address_kk, b.address_ru,
         d.full_name AS doctor_name, d.specialty_id,
         s.name_kk AS service_kk, s.name_ru AS service_ru, s.price,
         r.rating AS review_rating, r.text AS review_text
  FROM appointments a
  JOIN organizations o ON o.id = a.organization_id
  JOIN branches b ON b.id = a.branch_id
  JOIN doctors d ON d.id = a.doctor_id
  JOIN services s ON s.id = a.service_id
  LEFT JOIN reviews r ON r.appointment_id = a.id`

export const mapAppointment = (a) => ({
  id: a.id,
  startsAt: a.starts_at,
  endsAt: a.ends_at,
  status: a.status,
  patientName: a.patient_name,
  patientPhone: a.patient_phone,
  comment: a.comment,
  clinic: { name: a.clinic_name, slug: a.clinic_slug },
  address: { kk: a.address_kk, ru: a.address_ru },
  doctor: { name: a.doctor_name, specialty: a.specialty_id },
  service: { name: { kk: a.service_kk, ru: a.service_ru }, price: a.price },
  review: a.review_rating ? { rating: a.review_rating, text: a.review_text } : null,
})

patient.get('/appointments', handle(async (req, res) => {
  const rows = await query(`${appointmentSelect} WHERE a.patient_id = ? ORDER BY a.starts_at DESC`, [req.user.id])
  res.json(rows.map(mapAppointment))
}))

patient.post('/appointments', handle(async (req, res) => {
  const body = req.body ?? {}
  check(body, { branchId: 'id', doctorId: 'id', serviceId: 'id', fullName: 'fullName', phone: 'phone', comment: 'comment' })
  if (!isDate(body.date) || !/^\d{2}:\d{2}$/.test(body.time ?? '')) {
    throw new HttpError(422, 'validation', { time: 'time' })
  }

  const id = await transaction(async (conn) => {
    const get = async (sql, p) => (await conn.query(sql, p))[0][0]
    // Locking the doctor row serialises bookings for the same doctor, so two patients cannot take one slot.
    const doctor = await get('SELECT * FROM doctors WHERE id = ? AND active FOR UPDATE', [body.doctorId])
    const service = await get('SELECT * FROM services WHERE id = ? AND active', [body.serviceId])
    const link = await get('SELECT 1 AS ok FROM doctor_branches WHERE doctor_id = ? AND branch_id = ?', [body.doctorId, body.branchId])
    const org = doctor && (await get(`SELECT id FROM organizations WHERE id = ? AND status = 'approved'`, [doctor.organization_id]))
    if (!doctor || !service || !link || !org || service.organization_id !== doctor.organization_id || service.specialty_id !== doctor.specialty_id) {
      throw new HttpError(422, 'invalid_selection')
    }
    const slots = await freeSlots(doctor.id, body.date, service.duration, conn)
    if (!slots.includes(body.time)) throw new HttpError(409, 'slot_taken')

    const startsAt = `${body.date} ${body.time}:00`
    const [r] = await conn.query(
      `INSERT INTO appointments (patient_id, organization_id, branch_id, doctor_id, service_id, starts_at, ends_at, patient_name, patient_phone, comment)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, doctor.organization_id, body.branchId, doctor.id, service.id, startsAt, addMinutes(startsAt, service.duration),
        body.fullName.trim(), normalizePhone(body.phone), (body.comment ?? '').trim()],
    )
    return r.insertId
  })
  const row = await one(`${appointmentSelect} WHERE a.id = ?`, [id])
  res.status(201).json(mapAppointment(row))
}))

patient.post('/appointments/:id/cancel', handle(async (req, res) => {
  const appt = await one('SELECT * FROM appointments WHERE id = ? AND patient_id = ?', [Number(req.params.id), req.user.id])
  if (!appt) throw new HttpError(404, 'not_found')
  if (!['pending', 'confirmed'].includes(appt.status) || appt.starts_at <= astanaNow()) {
    throw new HttpError(409, 'cannot_cancel')
  }
  await query(`UPDATE appointments SET status = 'cancelled' WHERE id = ?`, [appt.id])
  res.json({ ok: true })
}))

patient.post('/appointments/:id/review', handle(async (req, res) => {
  check(req.body, { rating: 'rating', text: 'reviewText' })
  const appt = await one('SELECT * FROM appointments WHERE id = ? AND patient_id = ?', [Number(req.params.id), req.user.id])
  if (!appt) throw new HttpError(404, 'not_found')
  if (appt.status !== 'completed') throw new HttpError(409, 'not_completed')
  if (await one('SELECT id FROM reviews WHERE appointment_id = ?', [appt.id])) throw new HttpError(409, 'already_reviewed')
  await query(
    'INSERT INTO reviews (appointment_id, patient_id, organization_id, doctor_id, rating, text) VALUES (?, ?, ?, ?, ?, ?)',
    [appt.id, req.user.id, appt.organization_id, appt.doctor_id, req.body.rating, (req.body.text ?? '').trim()],
  )
  res.status(201).json({ ok: true })
}))
