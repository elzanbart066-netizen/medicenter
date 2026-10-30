export const config = {
  port: Number(process.env.PORT) || 3000,
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'medicenter',
    password: process.env.DB_PASSWORD || 'medicenter',
    database: process.env.DB_NAME || 'medicenter',
  },
  jwtSecret: process.env.JWT_SECRET || 'dev-only-secret-change-me',
}

if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be set in production')
}
