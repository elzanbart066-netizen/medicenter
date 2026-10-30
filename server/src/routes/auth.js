import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { one, transaction } from '../db.js'
import { handle, HttpError } from '../http.js'
import { publicUser, requireAuth, signToken } from '../auth.js'
import { check, normalizePhone } from '../validation.js'

export const auth = Router()

const emailTaken = async (email) => !!(await one('SELECT id FROM users WHERE email = ?', [email]))

auth.post('/register', handle(async (req, res) => {
  check(req.body, { fullName: 'fullName', phone: 'phone', email: 'email', password: 'password' })
  const email = req.body.email.trim().toLowerCase()
  if (await emailTaken(email)) throw new HttpError(409, 'email_taken', { email: 'taken' })
  const hash = await bcrypt.hash(req.body.password, 10)
  const user = await transaction(async (tx) => {
    const id = await tx.insert(
      `INSERT INTO users (role, full_name, phone, email, password_hash) OUTPUT INSERTED.id VALUES ('patient', ?, ?, ?, ?)`,
      [req.body.fullName.trim(), normalizePhone(req.body.phone), email, hash],
    )
    return tx.one('SELECT * FROM users WHERE id = ?', [id])
  })
  res.status(201).json({ token: signToken(user), user: publicUser(user) })
}))

auth.post('/login', handle(async (req, res) => {
  const email = String(req.body?.email ?? '').trim().toLowerCase()
  const user = await one('SELECT * FROM users WHERE email = ?', [email])
  // Same answer for an unknown email and a wrong password
  if (!user || !(await bcrypt.compare(String(req.body?.password ?? ''), user.password_hash))) {
    throw new HttpError(401, 'bad_credentials')
  }
  res.json({ token: signToken(user), user: publicUser(user) })
}))

auth.get('/me', requireAuth, (req, res) => res.json(publicUser(req.user)))

// A clinic applies to join: creates a pending organization and its admin account.
auth.post('/apply', handle(async (req, res) => {
  check(req.body, {
    clinicName: 'text', description: 'longText', clinicPhone: 'phone',
    fullName: 'fullName', phone: 'phone', email: 'email', password: 'password',
  })
  const email = req.body.email.trim().toLowerCase()
  if (await emailTaken(email)) throw new HttpError(409, 'email_taken', { email: 'taken' })
  const hash = await bcrypt.hash(req.body.password, 10)
  const slugBase = req.body.clinicName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'clinic'
  const user = await transaction(async (tx) => {
    const description = req.body.description.trim()
    const orgId = await tx.insert(
      `INSERT INTO organizations (slug, name, description_kk, description_ru, phone, hours_kk, hours_ru, status)
       OUTPUT INSERTED.id
       VALUES (?, ?, ?, ?, ?, N'Дс–Жм, 09:00–18:00', N'Пн–Пт, 09:00–18:00', 'pending')`,
      [`${slugBase}-${Date.now().toString(36)}`, req.body.clinicName.trim(), description, description, normalizePhone(req.body.clinicPhone)],
    )
    const id = await tx.insert(
      `INSERT INTO users (role, full_name, phone, email, password_hash, organization_id) OUTPUT INSERTED.id VALUES ('clinic_admin', ?, ?, ?, ?, ?)`,
      [req.body.fullName.trim(), normalizePhone(req.body.phone), email, hash, orgId],
    )
    return tx.one('SELECT * FROM users WHERE id = ?', [id])
  })
  res.status(201).json({ token: signToken(user), user: publicUser(user) })
}))
