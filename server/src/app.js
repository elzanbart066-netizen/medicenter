import express from 'express'
import path from 'node:path'
import fs from 'node:fs'
import { errorHandler } from './http.js'
import { auth } from './routes/auth.js'
import { catalog } from './routes/catalog.js'
import { patient } from './routes/patient.js'
import { doctor } from './routes/doctor.js'
import { clinic } from './routes/clinic.js'
import { admin } from './routes/admin.js'

export const app = express()
app.disable('x-powered-by')
app.use(express.json({ limit: '100kb' }))

// Health check for the hosting platform; does not touch the database so it never wakes it up
app.get('/api/health', (_req, res) => res.json({ ok: true }))

app.use('/api/auth', auth)
app.use('/api/me', patient)
app.use('/api/doctor', doctor)
app.use('/api/clinic', clinic)
app.use('/api/admin', admin)
app.use('/api', catalog)
app.use('/api', (_req, res) => res.status(404).json({ error: 'not_found' }))

// In production the same server also serves the built frontend
const dist = path.resolve(import.meta.dirname, '../../dist')
if (fs.existsSync(dist)) {
  app.use(express.static(dist))
  app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')))
}

app.use(errorHandler)
