export const config = {
  port: Number(process.env.PORT) || 3000,
  db: {
    server: process.env.DB_SERVER || 'localhost',
    port: Number(process.env.DB_PORT) || 1433,
    // For a named instance such as SQLEXPRESS (needs the SQL Server Browser service)
    instanceName: process.env.DB_INSTANCE || undefined,
    user: process.env.DB_USER || 'medicenter',
    password: process.env.DB_PASSWORD || 'Medicenter123!',
    database: process.env.DB_NAME || 'medicenter',
    // Azure SQL requires encrypted connections
    encrypt: process.env.DB_ENCRYPT === 'true' || /\.database\.windows\.net$/.test(process.env.DB_SERVER ?? ''),
  },
  jwtSecret: process.env.JWT_SECRET || 'dev-only-secret-change-me',
}

if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be set in production')
}
