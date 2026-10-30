import { Router } from 'express'
import { query, one } from '../db.js'
import { handle, HttpError } from '../http.js'
import { requireRole } from '../auth.js'
import { appointmentSelect, mapAppointment } from './patient.js'

export const doctor = Router()
doctor.use(requireRole('doctor'))

const ownDoctor = async (user) => {
  const d = await one('SELECT * FROM doctors WHERE user_id = ?', [user.id])
  if (!d) throw new HttpError(404, 'not_found')
  return d
}

doctor.get('/appointments', handle(async (req, res) => {
  const d = await ownDoctor(req.user)
  const rows = await query(`${appointmentSelect} WHERE a.doctor_id = ? AND a.status <> 'cancelled' ORDER BY a.starts_at`, [d.id])
  res.json({ doctor: { name: d.full_name, specialty: d.specialty_id }, appointments: rows.map(mapAppointment) })
}))
