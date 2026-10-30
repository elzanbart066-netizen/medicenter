import { useLang } from '../i18n.jsx'

const ruleMessages = {
  fullName: 'errName', phone: 'errPhone', email: 'errEmail', taken: 'err_email_taken', password: 'errPassword',
  text: 'errText', longText: 'errLongText', price: 'errPrice', branches: 'errBranches', district: 'errDistrict',
  comment: 'errComment', experience: 'err_validation', duration: 'err_validation', specialty: 'err_validation',
}

// Maps a server validation rule (or a client error key) to a message
export function useFieldError() {
  const { t } = useLang()
  return (rule) => (rule ? t(ruleMessages[rule] ?? rule) : null)
}

export function Field({ label, error, hint, className = '', children }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-sm font-semibold text-slate-600">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-sm text-red-600">{error}</span> : hint && <span className="mt-1 block text-xs text-slate-400">{hint}</span>}
    </label>
  )
}

export function ErrorBox({ error }) {
  const { t } = useLang()
  if (!error) return null
  return <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{t(`err_${error.code ?? 'server_error'}`)}</div>
}

export function Loading() {
  const { t } = useLang()
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-slate-400">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand border-t-transparent" />
      {t('loading')}
    </div>
  )
}

const statusStyles = {
  pending: 'bg-amber-50 text-amber-700 ring-amber-200',
  confirmed: 'bg-brand/10 text-[#0891b2] ring-brand/30',
  completed: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  cancelled: 'bg-slate-100 text-slate-500 ring-slate-200',
  approved: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  rejected: 'bg-red-50 text-red-600 ring-red-200',
}

export function Badge({ status, children }) {
  return <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusStyles[status]}`}>{children}</span>
}

export function Stars({ value, onChange, size = 'text-base' }) {
  return (
    <span className={`inline-flex ${size}`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(n)}
          className={`${n <= Math.round(value) ? 'text-amber-400' : 'text-slate-200'} ${onChange ? 'cursor-pointer px-0.5 hover:scale-110' : 'cursor-default'}`}
          aria-label={`${n}`}
        >
          ★
        </button>
      ))}
    </span>
  )
}

// "2026-11-02 11:30:00" (Astana time) → local Date with the same wall-clock values
export const parseDateTime = (s) => {
  const [d, tm] = s.split(' ')
  const [y, m, day] = d.split('-').map(Number)
  const [h, mi] = tm.split(':').map(Number)
  return new Date(y, m - 1, day, h, mi)
}

export const toDateParam = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
