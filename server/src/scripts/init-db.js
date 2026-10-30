// Creates the database and tables and fills them with demo data: npm run db:init
import sql from 'mssql'
import { config } from '../config.js'
import { dialect, sqlConfig, close } from '../db.js'
import { seedDatabase } from '../seed.js'

// Create the database itself if it is missing (needs a login allowed to create databases).
// A PostgreSQL database from DATABASE_URL already exists.
if (dialect === 'mssql') {
  const master = await new sql.ConnectionPool(sqlConfig('master')).connect()
  await master.request().query(`IF DB_ID(N'${config.db.database}') IS NULL CREATE DATABASE [${config.db.database}]`)
  await master.close()
}

await seedDatabase()
await close()
console.log('Database ready. Demo accounts:')
console.table([
  { role: 'Платформа әкімшісі', email: 'admin@medicenter.kz', password: 'Admin123!' },
  { role: 'Клиника әкімшісі', email: 'admin@duman.kz', password: 'Clinic123!' },
  { role: 'Дәрігер', email: 'doctor@medicenter.kz', password: 'Doctor123!' },
  { role: 'Пациент', email: 'patient@medicenter.kz', password: 'Patient123!' },
])
