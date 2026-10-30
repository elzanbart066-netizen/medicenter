export class HttpError extends Error {
  constructor(status, code, fields) {
    super(code)
    this.status = status
    this.code = code
    this.fields = fields
  }
}

// Express 4 does not catch rejected promises from handlers.
export const handle = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

export function errorHandler(err, req, res, _next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.code, fields: err.fields })
  }
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'bad_json' })
  console.error(err)
  res.status(500).json({ error: 'server_error' })
}
