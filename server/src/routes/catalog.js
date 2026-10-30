import { Router } from 'express'
import { one } from '../db.js'
import { handle, HttpError } from '../http.js'
import { clinicDetails, freeSlots, listClinics } from '../clinics.js'
import { isDate } from '../time.js'

export const catalog = Router()

catalog.get('/stats', handle(async (_req, res) => {
  res.json(await one(
    `SELECT (SELECT COUNT(*) FROM organizations WHERE status = 'approved') AS clinics,
            (SELECT COUNT(*) FROM doctors d JOIN organizations o ON o.id = d.organization_id WHERE d.active AND o.status = 'approved') AS doctors`,
  ))
}))

catalog.get('/clinics', handle(async (req, res) => {
  const { q, district, specialty } = req.query
  res.json(await listClinics({ q, district, specialty, maxPrice: Number(req.query.maxPrice) || 0 }))
}))

catalog.get('/clinics/:slug', handle(async (req, res) => {
  const org = await one(`SELECT * FROM organizations WHERE slug = ? AND status = 'approved'`, [req.params.slug])
  if (!org) throw new HttpError(404, 'not_found')
  res.json(await clinicDetails(org))
}))

catalog.get('/doctors/:id/slots', handle(async (req, res) => {
  const { date } = req.query
  if (!isDate(date)) throw new HttpError(422, 'validation', { date: 'date' })
  const service = await one('SELECT duration FROM services WHERE id = ? AND active', [Number(req.query.serviceId)])
  const doctor = await one('SELECT id FROM doctors WHERE id = ? AND active', [Number(req.params.id)])
  if (!service || !doctor) throw new HttpError(404, 'not_found')
  res.json(await freeSlots(doctor.id, date, service.duration))
}))

