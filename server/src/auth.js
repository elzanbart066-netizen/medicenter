import jwt from 'jsonwebtoken'
import { config } from './config.js'
import { one } from './db.js'
import { HttpError, handle } from './http.js'

export const signToken = (user) => jwt.sign({ sub: user.id }, config.jwtSecret, { expiresIn: '7d' })

export const publicUser = (u) => ({
  id: u.id,
  role: u.role,
  fullName: u.full_name,
  phone: u.phone,
  email: u.email,
  organizationId: u.organization_id,
})

// Loads req.user from the Bearer token. The role always comes from the database, never from the token.
export const requireAuth = handle(async (req, _res, next) => {
  const header = req.get('authorization') ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) throw new HttpError(401, 'unauthorized')
  let payload
  try {
    payload = jwt.verify(token, config.jwtSecret)
  } catch {
    throw new HttpError(401, 'unauthorized')
  }
  const user = await one('SELECT * FROM users WHERE id = ?', [payload.sub])
  if (!user) throw new HttpError(401, 'unauthorized')
  req.user = user
  next()
})

export const requireRole = (...roles) => [
  requireAuth,
  (req, _res, next) => next(roles.includes(req.user.role) ? undefined : new HttpError(403, 'forbidden')),
]
