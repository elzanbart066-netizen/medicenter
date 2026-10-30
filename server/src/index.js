import { app } from './app.js'
import { config } from './config.js'
import { isEmpty, seedDatabase } from './seed.js'

app.listen(config.port, () => console.log(`MediCenter API: http://localhost:${config.port}`))

// On a fresh hosted database there is no shell to run `npm run db:init`, so fill it on first start
try {
  if (await isEmpty()) {
    console.log('Empty database: creating tables and demo data…')
    await seedDatabase()
    console.log('Demo data ready.')
  }
} catch (err) {
  console.error('Database check failed:', err.message)
}
