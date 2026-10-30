import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useLang } from '../i18n.jsx'
import { useAuth } from '../auth.jsx'
import { api } from '../api.js'
import { ErrorBox, Field, useFieldError } from '../components/ui.jsx'
import { formatPhone, validateAccount } from '../validation.js'

export default function ForClinics() {
  const { t } = useLang()
  const fieldError = useFieldError()
  const { user, signIn } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ clinicName: '', description: '', clinicPhone: '', fullName: '', phone: '', email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [error, setError] = useState(null)
  const [sending, setSending] = useState(false)

  if (user?.role === 'clinic_admin') return <Navigate to="/cabinet" replace />

  const set = (key, value) => {
    setForm({ ...form, [key]: value })
    setErrors({ ...errors, [key]: undefined })
  }

  const submit = async (e) => {
    e.preventDefault()
    const found = validateAccount(form)
    if (form.clinicName.trim().length < 2) found.clinicName = 'text'
    if (form.description.trim().length < 10) found.description = 'longText'
    if (!/^[78]7\d{9}$/.test(form.clinicPhone.replace(/\D/g, ''))) found.clinicPhone = 'phone'
    setErrors(found)
    if (Object.keys(found).length) return
    setSending(true)
    setError(null)
    try {
      signIn(await api('/auth/apply', { method: 'POST', body: form }))
      navigate('/cabinet', { replace: true })
    } catch (err) {
      if (err.code === 'validation' || err.code === 'email_taken') setErrors(err.fields)
      else setError(err)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[1fr_1.2fr]">
      <section className="lg:pt-6">
        <h1 className="text-3xl font-extrabold text-navy md:text-4xl">{t('forClinicsTitle')}</h1>
        <p className="mt-4 text-slate-600">{t('forClinicsText')}</p>
        <ul className="mt-8 space-y-4">
          {['benefit1', 'benefit2', 'benefit3'].map((b, i) => (
            <li key={b} className="flex gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-mint/40 font-extrabold text-navy">{i + 1}</span>
              <span className="pt-2 font-medium text-slate-700">{t(b)}</span>
            </li>
          ))}
        </ul>
      </section>

      <form onSubmit={submit} noValidate className="card space-y-4 p-6 md:p-8">
        <ErrorBox error={error} />
        <Field label={t('clinicNameLabel')} error={fieldError(errors.clinicName)}>
          <input className="field" value={form.clinicName} onChange={(e) => set('clinicName', e.target.value)} />
        </Field>
        <Field label={t('clinicDesc')} error={fieldError(errors.description)}>
          <textarea className="field min-h-20" value={form.description} onChange={(e) => set('description', e.target.value)} />
        </Field>
        <Field label={t('clinicPhone')} error={fieldError(errors.clinicPhone)}>
          <input className="field" value={form.clinicPhone} onChange={(e) => set('clinicPhone', formatPhone(e.target.value))} placeholder="+7 7__ ___ __ __" inputMode="tel" />
        </Field>
        <p className="pt-2 text-xs font-semibold uppercase tracking-wider text-slate-400">{t('yourData')}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('fullName')} error={fieldError(errors.fullName)}>
            <input className="field" value={form.fullName} onChange={(e) => set('fullName', e.target.value)} autoComplete="name" />
          </Field>
          <Field label={t('phone')} error={fieldError(errors.phone)}>
            <input className="field" value={form.phone} onChange={(e) => set('phone', formatPhone(e.target.value))} placeholder="+7 7__ ___ __ __" inputMode="tel" />
          </Field>
          <Field label="Email" error={fieldError(errors.email)}>
            <input className="field" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} autoComplete="email" />
          </Field>
          <Field label={t('password')} error={fieldError(errors.password)} hint={t('passwordHint')}>
            <input className="field" type="password" value={form.password} onChange={(e) => set('password', e.target.value)} autoComplete="new-password" />
          </Field>
        </div>
        <button className="btn-primary w-full" disabled={sending}>{t('sendApplication')}</button>
      </form>
    </div>
  )
}
