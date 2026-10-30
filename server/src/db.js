import sql from 'mssql'
import { config } from './config.js'

const { instanceName, ...db } = config.db

export const sqlConfig = (database = db.database) => ({
  ...db,
  ...(instanceName ? { port: undefined } : {}),
  database,
  pool: { max: 10 },
  options: {
    instanceName,
    encrypt: false,
    trustServerCertificate: true,
    // DATETIME2 values are Astana wall-clock time; read them back unchanged
    useUTC: true,
  },
})

const pool = new sql.ConnectionPool(sqlConfig())
let connecting = null
// Connects on first use, so init-db can create the database before anything connects to it
const connect = () => (connecting ??= pool.connect())

// "2026-11-02 11:30:00" — the format the rest of the code compares and returns
const pad = (n) => String(n).padStart(2, '0')
const formatDate = (d) =>
  `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`

const normalize = (rows) =>
  rows.map((row) => {
    for (const [k, v] of Object.entries(row)) if (v instanceof Date) row[k] = formatDate(v)
    return row
  })

// Runs SQL with "?" placeholders, as in the MySQL version of the code.
// An array parameter expands to a list, for "IN (?)".
async function run(requestFactory, text, params = []) {
  const request = requestFactory()
  let i = 0
  const bind = (value) => {
    const name = `p${i++}`
    request.input(name, value)
    return `@${name}`
  }
  const parsed = text.replace(/\?/g, () => {
    const value = params.shift()
    return Array.isArray(value) ? value.map(bind).join(', ') : bind(value)
  })
  const result = await request.query(parsed)
  return normalize(result.recordset ?? [])
}

const makeApi = (requestFactory) => ({
  query: (text, params) => run(requestFactory, text, params ? [...params] : []),
  async one(text, params) {
    return (await this.query(text, params))[0] ?? null
  },
  // INSERT statements must include "OUTPUT INSERTED.id"
  async insert(text, params) {
    return (await this.query(text, params))[0]?.id
  },
})

const poolApi = makeApi(() => pool.request())

export async function query(text, params) {
  await connect()
  return poolApi.query(text, params)
}

export async function one(text, params) {
  await connect()
  return poolApi.one(text, params)
}

export async function insert(text, params) {
  await connect()
  return poolApi.insert(text, params)
}

// Runs fn(tx) inside a transaction; tx has the same query/one/insert helpers.
export async function transaction(fn) {
  await connect()
  const tx = new sql.Transaction(pool)
  await tx.begin()
  try {
    const result = await fn(makeApi(() => new sql.Request(tx)))
    await tx.commit()
    return result
  } catch (err) {
    // SQL Server may already have rolled back after some errors
    await tx.rollback().catch(() => {})
    throw err
  }
}

export const close = () => pool.close()
