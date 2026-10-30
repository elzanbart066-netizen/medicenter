import { app } from './app.js'
import { config } from './config.js'

app.listen(config.port, () => console.log(`MediCenter API: http://localhost:${config.port}`))
