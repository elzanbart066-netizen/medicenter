// Creates the tables and fills them with demo data. Used by `npm run db:init`
// and by the server on its first start against an empty database.
import fs from 'node:fs/promises'
import bcrypt from 'bcryptjs'
import { dialect, insert, query } from './db.js'
import { specialties } from '../../shared/constants.js'
import { clinics } from './scripts/seed-data.js'

export async function seedDatabase() {
  await query(await fs.readFile(new URL(dialect === 'postgres' ? '../sql/schema.postgres.sql' : '../sql/schema.sql', import.meta.url), 'utf8'))

  const hash = (pw) => bcrypt.hashSync(pw, 10)
  const addUser = (role, fullName, phone, email, password, organizationId = null) =>
    insert(
      'INSERT INTO users (role, full_name, phone, email, password_hash, organization_id) OUTPUT INSERTED.id VALUES (?, ?, ?, ?, ?, ?)',
      [role, fullName, phone, email, hash(password), organizationId],
    )

  for (const s of specialties) {
    await query('INSERT INTO specialties VALUES (?, ?, ?, ?)', [s.id, s.icon, s.name.kk, s.name.ru])
  }

  await addUser('platform_admin', 'Платформа әкімшісі', '+7 700 000 00 00', 'admin@medicenter.kz', 'Admin123!')
  const patientId = await addUser('patient', 'Ержан Болатов', '+7 701 123 45 67', 'patient@medicenter.kz', 'Patient123!')

  const orgIds = {}
  const doctorIds = {}
  const serviceIds = {}
  const branchIds = {}

  for (const c of clinics) {
    const orgId = await insert(
      `INSERT INTO organizations (slug, name, description_kk, description_ru, phone, hours_kk, hours_ru, color, status, featured, sponsored)
       OUTPUT INSERTED.id VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'approved', ?, ?)`,
      [c.id, c.name, c.description.kk, c.description.ru, c.phone, c.hours.kk, c.hours.ru, c.color, !!c.featured, !!c.sponsored],
    )
    orgIds[c.id] = orgId
    await addUser('clinic_admin', `${c.name} әкімшісі`, c.phone, `admin@${c.id}.kz`, 'Clinic123!', orgId)
    for (const b of c.branches) {
      branchIds[b.id] = await insert(
        'INSERT INTO branches (organization_id, district, address_kk, address_ru) OUTPUT INSERTED.id VALUES (?, ?, ?, ?)',
        [orgId, b.district, b.address.kk, b.address.ru],
      )
    }
    for (const s of c.services) {
      serviceIds[`${c.id}:${s.id}`] = await insert(
        'INSERT INTO services (organization_id, specialty_id, name_kk, name_ru, price, duration) OUTPUT INSERTED.id VALUES (?, ?, ?, ?, ?, ?)',
        [orgId, s.specialty, s.name.kk, s.name.ru, s.price, s.duration],
      )
    }
    for (const d of c.doctors) {
      // The first doctor of Duman Clinic gets a login to show the doctor's cabinet
      const userId = d.id === 'd1' ? await addUser('doctor', d.name, '+7 702 111 22 33', 'doctor@medicenter.kz', 'Doctor123!', orgId) : null
      doctorIds[d.id] = await insert(
        'INSERT INTO doctors (organization_id, user_id, full_name, specialty_id, experience) OUTPUT INSERTED.id VALUES (?, ?, ?, ?, ?)',
        [orgId, userId, d.name, d.specialty, d.experience],
      )
      for (const b of d.branches) {
        await query('INSERT INTO doctor_branches (doctor_id, branch_id) VALUES (?, ?)', [doctorIds[d.id], branchIds[b]])
      }
    }
  }

  // One clinic waiting for platform approval
  const pendingId = await insert(
    `INSERT INTO organizations (slug, name, description_kk, description_ru, phone, hours_kk, hours_ru, status)
     OUTPUT INSERTED.id VALUES ('shipa', ?, ?, ?, '+7 717 200 70 70', ?, ?, 'pending')`,
    ['Шипа Медикал', 'Жаңа ашылған көпсалалы клиника.', 'Новая многопрофильная клиника.', 'Дс–Жм, 09:00–18:00', 'Пн–Пт, 09:00–18:00'],
  )
  await addUser('clinic_admin', 'Шипа әкімшісі', '+7 717 200 70 70', 'admin@shipa.kz', 'Clinic123!', pendingId)

  // Demo appointment history for the patient: two completed (one reviewed) and one upcoming
  const day = (offset, time) => {
    const d = new Date(Date.now() + offset * 86400000)
    if (d.getUTCDay() === 0) d.setUTCDate(d.getUTCDate() + 1)
    return `${d.toISOString().slice(0, 10)} ${time}:00`
  }
  const addMinutes = (dt, m) =>
    new Date(new Date(dt.replace(' ', 'T') + 'Z').getTime() + m * 60000).toISOString().slice(0, 19).replace('T', ' ')

  const history = [
    { org: 'duman', branch: 'duman-1', doctor: 'd1', service: 'therapist-consult', at: day(-20, '10:00'), status: 'completed', review: [5, 'Дәрігер мұқият тыңдады, бәрін түсіндірді.'] },
    { org: 'aqzhol', branch: 'aqzhol-1', doctor: 'd6', service: 'cleaning', at: day(-9, '15:00'), status: 'completed' },
    { org: 'duman', branch: 'duman-1', doctor: 'd2', service: 'cardiologist-consult', at: day(3, '11:30'), status: 'confirmed' },
  ]
  for (const h of history) {
    const serviceId = serviceIds[`${h.org}:${h.service}`]
    const service = clinics.find((c) => c.id === h.org).services.find((s) => s.id === h.service)
    const apptId = await insert(
      `INSERT INTO appointments (patient_id, organization_id, branch_id, doctor_id, service_id, starts_at, ends_at, status, patient_name, patient_phone)
       OUTPUT INSERTED.id VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, '+7 701 123 45 67')`,
      [patientId, orgIds[h.org], branchIds[h.branch], doctorIds[h.doctor], serviceId, h.at, addMinutes(h.at, service.duration), h.status, 'Ержан Болатов'],
    )
    if (h.review) {
      await query(
        'INSERT INTO reviews (appointment_id, patient_id, organization_id, doctor_id, rating, text) VALUES (?, ?, ?, ?, ?, ?)',
        [apptId, patientId, orgIds[h.org], doctorIds[h.doctor], ...h.review],
      )
    }
  }
}

export async function isEmpty() {
  const row = await query(dialect === 'postgres' ? "SELECT to_regclass('organizations') AS id" : "SELECT OBJECT_ID('organizations') AS id")
  return row[0].id === null
}
