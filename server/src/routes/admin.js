import { Router } from 'express'
import { query, one } from '../db.js'
import { handle, HttpError } from '../http.js'
import { requireRole } from '../auth.js'
import { mapClinicHeader } from '../clinics.js'

export const admin = Router()
admin.use(requireRole('platform_admin'))

admin.get('/organizations', handle(async (_req, res) => {
  const rows = await query(
    `SELECT o.*, u.full_name AS admin_name, u.email AS admin_email,
       (SELECT COUNT(*) FROM doctors d WHERE d.organization_id = o.id) AS doctor_count,
       (SELECT COUNT(*) FROM appointments a WHERE a.organization_id = o.id) AS appointment_count
     FROM organizations o
     LEFT JOIN users u ON u.organization_id = o.id AND u.role = 'clinic_admin'
     ORDER BY FIELD(o.status, 'pending', 'approved', 'rejected'), o.created_at DESC`,
  )
  res.json(rows.map((o) => ({
    ...mapClinicHeader(o),
    createdAt: o.created_at,
    admin: { name: o.admin_name, email: o.admin_email },
    doctorCount: o.doctor_count,
    appointmentCount: o.appointment_count,
  })))
}))

admin.patch('/organizations/:id', handle(async (req, res) => {
  const org = await one('SELECT * FROM organizations WHERE id = ?', [Number(req.params.id)])
  if (!org) throw new HttpError(404, 'not_found')
  const b = req.body ?? {}
  const status = b.status ?? org.status
  if (!['pending', 'approved', 'rejected'].includes(status)) throw new HttpError(422, 'validation', { status: 'status' })
  await query('UPDATE organizations SET status = ?, featured = ?, sponsored = ? WHERE id = ?', [
    status, b.featured ?? !!org.featured, b.sponsored ?? !!org.sponsored, org.id,
  ])
  res.json({ ok: true })
}))
