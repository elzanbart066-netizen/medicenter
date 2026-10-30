// Creates the tables and fills them with demo data: npm run db:init
import fs from 'node:fs/promises'
import mysql from 'mysql2/promise'
import bcrypt from 'bcryptjs'
import { config } from '../config.js'
import { specialties } from '../../../shared/constants.js'
import { clinics } from './seed-data.js'

const conn = await mysql.createConnection({ ...config.db, multipleStatements: true, charset: 'utf8mb4' })
await conn.query(await fs.readFile(new URL('../../sql/schema.sql', import.meta.url), 'utf8'))

const hash = (pw) => bcrypt.hashSync(pw, 10)
const insert = async (sql, params) => (await conn.query(sql, params))[0].insertId

for (const s of specialties) {
  await conn.query('INSERT INTO specialties VALUES (?, ?, ?, ?)', [s.id, s.icon, s.name.kk, s.name.ru])
}

await insert(
  `INSERT INTO users (role, full_name, phone, email, password_hash) VALUES ('platform_admin', ?, ?, ?, ?)`,
  ['Платформа әкімшісі', '+7 700 000 00 00', 'admin@medicenter.kz', hash('Admin123!')],
)
const patientId = await insert(
  `INSERT INTO users (role, full_name, phone, email, password_hash) VALUES ('patient', ?, ?, ?, ?)`,
  ['Ержан Болатов', '+7 701 123 45 67', 'patient@medicenter.kz', hash('Patient123!')],
)

const doctorIds = {}
const serviceIds = {}
const branchIds = {}

for (const c of clinics) {
  const orgId = await insert(
    `INSERT INTO organizations (slug, name, description_kk, description_ru, phone, hours_kk, hours_ru, color, status, featured, sponsored)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'approved', ?, ?)`,
    [c.id, c.name, c.description.kk, c.description.ru, c.phone, c.hours.kk, c.hours.ru, c.color, !!c.featured, !!c.sponsored],
  )
  await insert(
    `INSERT INTO users (role, full_name, phone, email, password_hash, organization_id) VALUES ('clinic_admin', ?, ?, ?, ?, ?)`,
    [`${c.name} әкімшісі`, c.phone, `admin@${c.id}.kz`, hash('Clinic123!'), orgId],
  )
  for (const b of c.branches) {
    branchIds[b.id] = await insert(
      'INSERT INTO branches (organization_id, district, address_kk, address_ru) VALUES (?, ?, ?, ?)',
      [orgId, b.district, b.address.kk, b.address.ru],
    )
  }
  for (const s of c.services) {
    serviceIds[`${c.id}:${s.id}`] = await insert(
      'INSERT INTO services (organization_id, specialty_id, name_kk, name_ru, price, duration) VALUES (?, ?, ?, ?, ?, ?)',
      [orgId, s.specialty, s.name.kk, s.name.ru, s.price, s.duration],
    )
  }
  for (const d of c.doctors) {
    // The first doctor of Duman Clinic gets a login to show the doctor's cabinet
    let userId = null
    if (d.id === 'd1') {
      userId = await insert(
        `INSERT INTO users (role, full_name, phone, email, password_hash, organization_id) VALUES ('doctor', ?, ?, ?, ?, ?)`,
        [d.name, '+7 702 111 22 33', 'doctor@medicenter.kz', hash('Doctor123!'), orgId],
      )
    }
    doctorIds[d.id] = await insert(
      'INSERT INTO doctors (organization_id, user_id, full_name, specialty_id, experience) VALUES (?, ?, ?, ?, ?)',
      [orgId, userId, d.name, d.specialty, d.experience],
    )
    for (const b of d.branches) {
      await conn.query('INSERT INTO doctor_branches VALUES (?, ?)', [doctorIds[d.id], branchIds[b]])
    }
  }
}

// One clinic waiting for platform approval
const pendingId = await insert(
  `INSERT INTO organizations (slug, name, description_kk, description_ru, phone, hours_kk, hours_ru, status)
   VALUES ('shipa', 'Шипа Медикал', 'Жаңа ашылған көпсалалы клиника.', 'Новая многопрофильная клиника.', '+7 717 200 70 70', 'Дс–Жм, 09:00–18:00', 'Пн–Пт, 09:00–18:00', 'pending')`,
)
await insert(
  `INSERT INTO users (role, full_name, phone, email, password_hash, organization_id) VALUES ('clinic_admin', ?, ?, ?, ?, ?)`,
  ['Шипа әкімшісі', '+7 717 200 70 70', 'admin@shipa.kz', hash('Clinic123!'), pendingId],
)

// Demo appointment history for the patient: two completed (one reviewed) and one upcoming
const day = (offset, time) => {
  const d = new Date(Date.now() + offset * 86400000)
  if (d.getDay() === 0) d.setDate(d.getDate() + 1)
  return `${d.toISOString().slice(0, 10)} ${time}:00`
}
const addMinutes = (dt, m) => {
  const d = new Date(dt.replace(' ', 'T') + 'Z')
  return new Date(d.getTime() + m * 60000).toISOString().slice(0, 19).replace('T', ' ')
}
const history = [
  { org: 'duman', branch: 'duman-1', doctor: 'd1', service: 'therapist-consult', at: day(-20, '10:00'), status: 'completed', review: [5, 'Дәрігер мұқият тыңдады, бәрін түсіндірді.'] },
  { org: 'aqzhol', branch: 'aqzhol-1', doctor: 'd6', service: 'cleaning', at: day(-9, '15:00'), status: 'completed' },
  { org: 'duman', branch: 'duman-1', doctor: 'd2', service: 'cardiologist-consult', at: day(3, '11:30'), status: 'confirmed' },
]
for (const h of history) {
  const orgId = (await conn.query('SELECT id FROM organizations WHERE slug = ?', [h.org]))[0][0].id
  const [svc] = (await conn.query('SELECT duration FROM services WHERE id = ?', [serviceIds[`${h.org}:${h.service}`]]))[0]
  const apptId = await insert(
    `INSERT INTO appointments (patient_id, organization_id, branch_id, doctor_id, service_id, starts_at, ends_at, status, patient_name, patient_phone)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Ержан Болатов', '+7 701 123 45 67')`,
    [patientId, orgId, branchIds[h.branch], doctorIds[h.doctor], serviceIds[`${h.org}:${h.service}`], h.at, addMinutes(h.at, svc.duration), h.status],
  )
  if (h.review) {
    await conn.query(
      'INSERT INTO reviews (appointment_id, patient_id, organization_id, doctor_id, rating, text) VALUES (?, ?, ?, ?, ?, ?)',
      [apptId, patientId, orgId, doctorIds[h.doctor], ...h.review],
    )
  }
}

await conn.end()
console.log('Database ready. Demo accounts:')
console.table([
  { role: 'Платформа әкімшісі', email: 'admin@medicenter.kz', password: 'Admin123!' },
  { role: 'Клиника әкімшісі', email: 'admin@duman.kz', password: 'Clinic123!' },
  { role: 'Дәрігер', email: 'doctor@medicenter.kz', password: 'Doctor123!' },
  { role: 'Пациент', email: 'patient@medicenter.kz', password: 'Patient123!' },
])
