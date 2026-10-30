import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useLang } from '../i18n.jsx'
import { useAuth } from '../auth.jsx'
import { api } from '../api.js'
import { ErrorBox, Field } from '../components/ui.jsx'

const demoAccounts = [
  ['Пациент / Пациент', 'patient@medicenter.kz', 'Patient123!'],
  ['Дәрігер / Врач', 'doctor@medicenter.kz', 'Doctor123!'],
  ['Клиника', 'admin@duman.kz', 'Clinic123!'],
  ['Әкімші / Админ', 'admin@medicenter.kz', 'Admin123!'],
]

export default function Login() {
  const { t } = useLang()
  const { user, signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState(null)
  const [sending, setSending] = useState(false)

  if (user) return <Navigate to={location.state?.from ?? '/cabinet'} replace />

  const submit = async (e) => {
    e.preventDefault()
    setSending(true)
    setError(null)
    try {
      signIn(await api('/auth/login', { method: 'POST', body: form }))
      navigate(location.state?.from ?? '/cabinet', { replace: true })
    } catch (err) {
      setError(err)
    } finally {
      setSending(false)
    }
  }

  return (
    <AuthLayout title={t('loginTitle')} text={t('loginText')}>
      <form onSubmit={submit} className="space-y-4">
        <ErrorBox error={error} />
        <Field label="Email">
          <input className="field" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email" required />
        </Field>
        <Field label={t('password')}>
          <input className="field" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete="current-password" required />
        </Field>
        <button className="btn-primary w-full" disabled={sending}>{t('signIn')}</button>
        <p className="text-center text-sm text-slate-500">
          {t('noAccount')} <Link to="/register" state={location.state} className="font-semibold text-brand">{t('register')}</Link>
        </p>
      </form>
      <div className="mt-6 rounded-xl bg-surface p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">{t('demoAccounts')}</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {demoAccounts.map(([role, email, password]) => (
            <button
              key={email}
              type="button"
              onClick={() => setForm({ email, password })}
              className="rounded-lg bg-white px-3 py-2 text-left text-xs ring-1 ring-slate-100 transition hover:ring-brand"
            >
              <span className="block font-semibold text-navy">{role}</span>
              <span className="text-slate-500">{email}</span>
            </button>
          ))}
        </div>
      </div>
    </AuthLayout>
  )
}

export function AuthLayout({ title, text, children, wide = false }) {
  return (
    <div className="mx-auto px-4 py-12" style={{ maxWidth: wide ? 720 : 480 }}>
      <div className="card p-6 md:p-8">
        <h1 className="text-2xl font-extrabold text-navy">{title}</h1>
        <p className="mt-1 mb-6 text-sm text-slate-500">{text}</p>
        {children}
      </div>
    </div>
  )
}
