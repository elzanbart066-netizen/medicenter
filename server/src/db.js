import sql from 'mssql'
import pg from 'pg'
import { config } from './config.js'

// SQL Server locally, PostgreSQL when DATABASE_URL is set (hosting on Render).
// Queries are written for SQL Server; toPostgres() rewrites the few T-SQL bits they use.
export const dialect = config.databaseUrl ? 'postgres' : 'mssql'

const { instanceName, encrypt, ...db } = config.db

export const sqlConfig = (database = db.database) => ({
  ...db,
  ...(instanceName ? { port: undefined } : {}),
  database,
  pool: { max: 10 },
  // A paused Azure SQL free-tier database can take up to a minute to wake up
  connectionTimeout: 60000,
  options: {
    instanceName,
    encrypt,
    trustServerCertificate: !encrypt,
    // DATETIME2 values are Astana wall-clock time; read them back unchanged
    useUTC: true,
  },
})

// "2026-11-02 11:30:00" — the format the rest of the code compares and returns
const pad = (n) => String(n).padStart(2, '0')
const formatDate = (d) =>
  `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`

const normalize = (rows) =>
  rows.map((row) => {
    for (const [k, v] of Object.entries(row)) if (v instanceof Date) row[k] = formatDate(v)
    return row
  })

// Replaces "?" placeholders using bind(value) → placeholder text.
// An array parameter expands to a list, for "IN (?)".
const bindParams = (text, params, bind) =>
  text.replace(/\?/g, () => {
    const value = params.shift()
    return Array.isArray(value) ? value.map(bind).join(', ') : bind(value)
  })

// T-SQL → PostgreSQL for the constructs used in this code base
export const toPostgres = (text) => {
  let suffix = ''
  text = text
    .replace(/\s*OUTPUT INSERTED\.id/i, () => ((suffix += ' RETURNING id'), ''))
    .replace(/SELECT TOP (\d+)/i, (_, n) => ((suffix += ` LIMIT ${n}`), 'SELECT'))
    .replace(/\s*WITH \(UPDLOCK, ROWLOCK\)/i, () => ((suffix += ' FOR UPDATE'), ''))
  return text + suffix
}

function mssqlDriver() {
  const pool = new sql.ConnectionPool(sqlConfig())
  let connecting = null
  // Connects on first use, so init-db can create the database before anything connects to it
  const connect = () =>
    (connecting ??= pool.connect().catch((err) => {
      connecting = null // let the next request try again
      throw err
    }))

  const runner = (requestFactory) => async (text, params) => {
    const request = requestFactory()
    let i = 0
    const parsed = bindParams(text, params, (value) => {
      const name = `p${i++}`
      request.input(name, value)
      return `@${name}`
    })
    const result = await request.query(parsed)
    return normalize(result.recordset ?? [])
  }

  return {
    connect,
    run: runner(() => pool.request()),
    async transaction(fn) {
      const tx = new sql.Transaction(pool)
      await tx.begin()
      try {
        const result = await fn(runner(() => new sql.Request(tx)))
        await tx.commit()
        return result
      } catch (err) {
        // SQL Server may already have rolled back after some errors
        await tx.rollback().catch(() => {})
        throw err
      }
    },
    close: () => pool.close(),
  }
}

function postgresDriver() {
  // Same value shapes as the SQL Server driver: numbers, not strings, and timestamps as written
  pg.types.setTypeParser(pg.types.builtins.INT8, Number)
  pg.types.setTypeParser(pg.types.builtins.NUMERIC, Number)
  pg.types.setTypeParser(pg.types.builtins.TIMESTAMP, (v) => v)

  const pool = new pg.Pool({ connectionString: config.databaseUrl, max: 10 })

  const runner = (client) => async (text, params) => {
    const values = []
    const parsed = bindParams(toPostgres(text), params, (value) => {
      // Flags are SMALLINT columns, as BIT is in SQL Server
      values.push(typeof value === 'boolean' ? Number(value) : value)
      return `$${values.length}`
    })
    const result = await client.query(parsed, values)
    // A multi-statement script returns one result per statement
    return Array.isArray(result) ? [] : result.rows
  }

  return {
    connect: async () => {},
    run: runner(pool),
    async transaction(fn) {
      const client = await pool.connect()
      try {
        await client.query('BEGIN')
        const result = await fn(runner(client))
        await client.query('COMMIT')
        return result
      } catch (err) {
        await client.query('ROLLBACK').catch(() => {})
        throw err
      } finally {
        client.release()
      }
    },
    close: () => pool.end(),
  }
}

const driver = dialect === 'postgres' ? postgresDriver() : mssqlDriver()

const makeApi = (run) => ({
  query: (text, params) => run(text, params ? [...params] : []),
  async one(text, params) {
    return (await this.query(text, params))[0] ?? null
  },
  // INSERT statements must include "OUTPUT INSERTED.id"
  async insert(text, params) {
    return (await this.query(text, params))[0]?.id
  },
})

const poolApi = makeApi(driver.run)

export async function query(text, params) {
  await driver.connect()
  return poolApi.query(text, params)
}

export async function one(text, params) {
  await driver.connect()
  return poolApi.one(text, params)
}

export async function insert(text, params) {
  await driver.connect()
  return poolApi.insert(text, params)
}

// Runs fn(tx) inside a transaction; tx has the same query/one/insert helpers.
export async function transaction(fn) {
  await driver.connect()
  return driver.transaction((run) => fn(makeApi(run)))
}

export const close = () => driver.close()
