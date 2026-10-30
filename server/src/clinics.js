// Read models for clinics shared by the public catalog and the cabinets.
import { query, one } from './db.js'
import { astanaNow, addMinutes, weekday, WORK_START, WORK_END, STEP, fromMinutes } from './time.js'

const bilingual = (row, field) => ({ kk: row[`${field}_kk`], ru: row[`${field}_ru`] })

export const mapBranch = (b) => ({ id: b.id, district: b.district, address: bilingual(b, 'address') })

export const mapService = (s) => ({
  id: s.id,
  specialty: s.specialty_id,
  name: bilingual(s, 'name'),
  price: s.price,
  duration: s.duration,
  active: !!s.active,
})

export async function listClinics({ q, district, specialty, maxPrice } = {}) {
  const orgs = await query(
    `SELECT o.*,
       (SELECT MIN(price) FROM services s WHERE s.organization_id = o.id AND s.active) AS min_price,
       (SELECT ROUND(AVG(rating), 1) FROM reviews r WHERE r.organization_id = o.id) AS rating,
       (SELECT COUNT(*) FROM reviews r WHERE r.organization_id = o.id) AS review_count
     FROM organizations o WHERE o.status = 'approved'
     ORDER BY o.sponsored DESC, o.featured DESC, o.name`,
  )
  if (!orgs.length) return []
  const ids = orgs.map((o) => o.id)
  const branches = await query('SELECT * FROM branches WHERE organization_id IN (?)', [ids])
  const doctors = await query('SELECT id, organization_id, full_name, specialty_id FROM doctors WHERE active AND organization_id IN (?)', [ids])
  const services = await query('SELECT organization_id, name_kk, name_ru, price FROM services WHERE active AND organization_id IN (?)', [ids])

  const needle = q?.trim().toLowerCase()
  return orgs
    .map((o) => {
      const own = (rows) => rows.filter((r) => r.organization_id === o.id)
      return {
        org: o,
        branches: own(branches),
        doctors: own(doctors),
        services: own(services),
      }
    })
    .filter(({ org, branches, doctors, services }) => {
      if (district && !branches.some((b) => b.district === district)) return false
      if (specialty && !doctors.some((d) => d.specialty_id === specialty)) return false
      if (maxPrice && (org.min_price === null || org.min_price > maxPrice)) return false
      if (!needle) return true
      const haystack = [org.name, ...doctors.map((d) => d.full_name), ...doctors.map((d) => d.specialty_id), ...services.flatMap((s) => [s.name_kk, s.name_ru])]
        .join(' ')
        .toLowerCase()
      return haystack.includes(needle)
    })
    .map(({ org, branches, doctors }) => ({
      ...mapClinicHeader(org),
      districts: [...new Set(branches.map((b) => b.district))],
      specialties: [...new Set(doctors.map((d) => d.specialty_id))],
      minPrice: org.min_price,
      doctorCount: doctors.length,
    }))
}

export const mapClinicHeader = (o) => ({
  id: o.id,
  slug: o.slug,
  name: o.name,
  description: bilingual(o, 'description'),
  phone: o.phone,
  hours: bilingual(o, 'hours'),
  color: o.color,
  status: o.status,
  featured: !!o.featured,
  sponsored: !!o.sponsored,
  rating: o.rating === undefined || o.rating === null ? null : Number(o.rating),
  reviewCount: Number(o.review_count ?? 0),
})

export async function clinicDetails(org, { includeInactive = false } = {}) {
  const active = includeInactive ? '' : 'AND active'
  const [stats, branches, doctors, links, services, reviews] = await Promise.all([
    one('SELECT ROUND(AVG(rating), 1) AS rating, COUNT(*) AS review_count FROM reviews WHERE organization_id = ?', [org.id]),
    query('SELECT * FROM branches WHERE organization_id = ? ORDER BY id', [org.id]),
    query(`SELECT d.*, u.email AS login_email FROM doctors d LEFT JOIN users u ON u.id = d.user_id WHERE d.organization_id = ? ${active.replace('active', 'd.active')} ORDER BY d.id`, [org.id]),
    query('SELECT db.* FROM doctor_branches db JOIN doctors d ON d.id = db.doctor_id WHERE d.organization_id = ?', [org.id]),
    query(`SELECT * FROM services WHERE organization_id = ? ${active} ORDER BY price`, [org.id]),
    query(
      `SELECT r.id, r.rating, r.text, r.created_at, d.full_name AS doctor_name, u.full_name AS patient_name
       FROM reviews r JOIN doctors d ON d.id = r.doctor_id JOIN users u ON u.id = r.patient_id
       WHERE r.organization_id = ? ORDER BY r.created_at DESC LIMIT 20`,
      [org.id],
    ),
  ])
  return {
    ...mapClinicHeader({ ...org, ...stats }),
    branches: branches.map(mapBranch),
    doctors: doctors.map((d) => ({
      id: d.id,
      name: d.full_name,
      specialty: d.specialty_id,
      experience: d.experience,
      active: !!d.active,
      branches: links.filter((l) => l.doctor_id === d.id).map((l) => l.branch_id),
      ...(includeInactive ? { loginEmail: d.login_email } : {}),
    })),
    services: services.map(mapService),
    reviews: reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      text: r.text,
      createdAt: r.created_at,
      doctorName: r.doctor_name,
      // Only the first name and the initial of the surname are public
      patientName: r.patient_name.split(' ').map((p, i) => (i === 0 ? p : `${p[0]}.`)).join(' '),
    })),
  }
}

// Free start times for a doctor on a date for a service of the given duration.
// Pass a transaction connection to read inside the booking transaction.
export async function freeSlots(doctorId, date, duration, conn) {
  if (weekday(date) === 0) return []
  const run = conn ? async (sql, p) => (await conn.query(sql, p))[0] : query
  const busy = await run(
    `SELECT starts_at, ends_at FROM appointments
     WHERE doctor_id = ? AND status <> 'cancelled' AND starts_at < ? AND ends_at > ?`,
    [doctorId, `${date} 23:59:59`, `${date} 00:00:00`],
  )
  const now = astanaNow()
  const slots = []
  for (let m = WORK_START; m + duration <= WORK_END; m += STEP) {
    const start = `${date} ${fromMinutes(m)}:00`
    const end = addMinutes(start, duration)
    if (start <= now) continue
    if (busy.some((b) => b.starts_at < end && b.ends_at > start)) continue
    slots.push(fromMinutes(m))
  }
  return slots
}
