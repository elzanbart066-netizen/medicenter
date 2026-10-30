import mysql from 'mysql2/promise'
import { config } from './config.js'

export const pool = mysql.createPool({
  ...config.db,
  connectionLimit: 10,
  dateStrings: true,
  charset: 'utf8mb4',
  timezone: '+05:00',
})

export async function query(sql, params) {
  const [rows] = await pool.query(sql, params)
  return rows
}

export async function one(sql, params) {
  const rows = await query(sql, params)
  return rows[0] ?? null
}

// Runs fn inside a transaction on a dedicated connection.
export async function transaction(fn) {
  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()
    const result = await fn(conn)
    await conn.commit()
    return result
  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
}
