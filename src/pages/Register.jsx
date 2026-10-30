import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useLang } from '../i18n.jsx'
import { useAuth } from '../auth.jsx'
import { api } from '../api.js'
import { ErrorBox, Field, useFieldError } from '../components/ui.jsx'
import { formatPhone, validateAccount } from '../validation.js'
import { AuthLayout } from './Login.jsx'

export default function Register() {
  const { t } = useLang()
  const fieldError = useFieldError()
  const { user, signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ fullName: '', phone: '', email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [error, setError] = useState(null)
  const [sending, setSending] = useState(false)

  if (user) return <Navigate to="/cabinet" replace />

  const set = (key, value) => {
    setForm({ ...form, [key]: value })
    setErrors({ ...errors, [key]: undefined })
  }

  const submit = async (e) => {
    e.preventDefault()
    const found = validateAccount(form)
    setErrors(found)
    if (Object.keys(found).length) return
    setSending(true)
    setError(null)
    try {
      signIn(await api('/auth/register', { method: 'POST', body: form }))
      navigate(location.state?.from ?? '/cabinet', { replace: true })
    } catch (err) {
      if (err.code === 'validation' || err.code === 'email_taken') setErrors(err.fields)
      else setError(err)
    } finally {
      setSending(false)
    }
  }

  return (
    <AuthLayout title={t('registerTitle')} text={t('registerText')}>
      <form onSubmit={submit} noValidate className="space-y-4">
        <ErrorBox error={error} />
        <Field label={t('fullName')} error={fieldError(errors.fullName)}>
          <input className="field" value={form.fullName} onChange={(e) => set('fullName', e.target.value)} autoComplete="name" />
        </Field>
        <Field label={t('phone')} error={fieldError(errors.phone)}>
          <input className="field" value={form.phone} onChange={(e) => set('phone', formatPhone(e.target.value))} placeholder="+7 7__ ___ __ __" inputMode="tel" autoComplete="tel" />
        </Field>
        <Field label="Email" error={fieldError(errors.email)}>
          <input className="field" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} autoComplete="email" />
        </Field>
        <Field label={t('password')} error={fieldError(errors.password)} hint={t('passwordHint')}>
          <input className="field" type="password" value={form.password} onChange={(e) => set('password', e.target.value)} autoComplete="new-password" />
        </Field>
        <button className="btn-primary w-full" disabled={sending}>{t('register')}</button>
        <p className="text-center text-sm text-slate-500">
          {t('haveAccount')} <Link to="/login" state={location.state} className="font-semibold text-brand">{t('signIn')}</Link>
        </p>
      </form>
    </AuthLayout>
  )
}
