import { useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import NotFound from './NotFound.jsx'
import DemoNotice from '../components/DemoNotice.jsx'
import { useLang } from '../i18n.jsx'
import { freeSlots, getClinic, getSpecialty } from '../data/clinics.js'
import { formatPhone, validateContact } from '../validation.js'

const steps = ['stepBranch', 'stepService', 'stepTime', 'stepContact']

function nextDays(count) {
  const days = []
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  for (let i = 1; i <= count; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    days.push(d)
  }
  return days
}

export default function Booking() {
  const { clinicId } = useParams()
  const [params] = useSearchParams()
  const { t, tr, price, weekday, longDate } = useLang()
  const clinic = getClinic(clinicId)

  const presetDoctor = clinic?.doctors.find((d) => d.id === params.get('doctor'))
  const [step, setStep] = useState(0)
  const [branchId, setBranchId] = useState(presetDoctor?.branches[0] ?? clinic?.branches[0].id)
  const [doctorId, setDoctorId] = useState(presetDoctor?.id ?? '')
  const [serviceId, setServiceId] = useState('')
  const [date, setDate] = useState(null)
  const [time, setTime] = useState('')
  const [form, setForm] = useState({ name: '', phone: '', email: '', iin: '', comment: '', consent: false })
  const [errors, setErrors] = useState({})
  const [done, setDone] = useState(false)

  const days = useMemo(() => nextDays(10), [])
  if (!clinic) return <NotFound />

  const branch = clinic.branches.find((b) => b.id === branchId)
  const doctors = clinic.doctors.filter((d) => d.branches.includes(branchId))
  const doctor = clinic.doctors.find((d) => d.id === doctorId)
  const services = doctor ? clinic.services.filter((s) => s.specialty === doctor.specialty) : []
  const service = clinic.services.find((s) => s.id === serviceId)
  const slots = doctor && date ? freeSlots(doctor.id, date) : []

  const canNext = [doctor, service, date && time][step]

  const pickBranch = (id) => {
    setBranchId(id)
    if (doctor && !doctor.branches.includes(id)) setDoctorId('')
  }
  const pickDoctor = (id) => {
    setDoctorId(id)
    setServiceId('')
    setTime('')
  }
  const setField = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }))
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }))
  }

  const submit = (e) => {
    e.preventDefault()
    const found = validateContact(form)
    setErrors(found)
    if (!Object.keys(found).length) setDone(true)
  }

  if (done) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-mint/40 text-4xl">✓</div>
        <h1 className="mt-6 text-2xl font-extrabold text-navy">{t('successTitle')}</h1>
        <p className="mt-2 text-slate-600">{t('successText')}</p>
        <div className="card mt-8 p-5 text-left text-sm">
          <Summary {...{ clinic, branch, doctor, service, date, time, tr, price, longDate }} />
        </div>
        <Link to="/" className="btn-primary mt-8">{t('toHome')}</Link>
      </div>
    )
  }

  const option = (active) =>
    `w-full rounded-xl border p-4 text-left transition ${active ? 'border-brand bg-brand/5 ring-4 ring-brand/10' : 'border-slate-200 bg-white hover:border-brand'}`

  return (
    <div className="mx-auto max-w-6xl px-4 pt-8">
      <Link to={`/clinics/${clinic.id}`} className="text-sm font-semibold text-brand">← {clinic.name}</Link>
      <h1 className="mt-2 text-2xl font-extrabold text-navy md:text-3xl">{t('bookingTitle')}</h1>

      <ol className="mt-6 grid grid-cols-4 gap-2">
        {steps.map((s, i) => (
          <li key={s}>
            <div className={`h-1.5 rounded-full ${i <= step ? 'bg-brand' : 'bg-slate-200'}`} />
            <p className={`mt-2 hidden text-xs font-semibold sm:block ${i === step ? 'text-navy' : 'text-slate-400'}`}>
              {i + 1}. {t(s)}
            </p>
          </li>
        ))}
      </ol>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="card p-5 md:p-7">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{t('step')} {step + 1} / 4</p>
          <h2 className="mt-1 text-xl font-bold text-navy">{t(steps[step])}</h2>

          {step === 0 && (
            <div className="mt-5 space-y-6">
              <div>
                <p className="mb-2 text-sm font-semibold text-slate-600">{t('chooseBranch')}</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {clinic.branches.map((b) => (
                    <button key={b.id} onClick={() => pickBranch(b.id)} className={option(b.id === branchId)}>
                      <span className="font-semibold text-navy">📍 {tr(b.address)}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-sm font-semibold text-slate-600">{t('chooseDoctor')}</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {doctors.map((d) => (
                    <button key={d.id} onClick={() => pickDoctor(d.id)} className={option(d.id === doctorId)}>
                      <span className="block font-semibold text-navy">{d.name}</span>
                      <span className="text-sm text-slate-500">{tr(getSpecialty(d.specialty).name)} · {d.experience} {t('experience')}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="mt-5 grid gap-3">
              <p className="text-sm font-semibold text-slate-600">{t('chooseService')}</p>
              {services.map((s) => (
                <button key={s.id} onClick={() => setServiceId(s.id)} className={`${option(s.id === serviceId)} flex items-center justify-between gap-4`}>
                  <span>
                    <span className="block font-semibold text-navy">{tr(s.name)}</span>
                    <span className="text-sm text-slate-500">{s.duration} {t('minutes')}</span>
                  </span>
                  <span className="font-bold text-navy">{price(s.price)}</span>
                </button>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="mt-5 space-y-6">
              <div>
                <p className="mb-2 text-sm font-semibold text-slate-600">{t('chooseDate')}</p>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {days.map((d) => {
                    const active = date?.getTime() === d.getTime()
                    return (
                      <button
                        key={d.toISOString()}
                        onClick={() => { setDate(d); setTime('') }}
                        className={`flex w-16 shrink-0 flex-col items-center rounded-xl border py-3 transition ${active ? 'border-navy bg-navy text-white' : 'border-slate-200 bg-white hover:border-brand'}`}
                      >
                        <span className={`text-xs ${active ? 'text-white/70' : 'text-slate-400'}`}>
                          {weekday(d)}
                        </span>
                        <span className="text-lg font-bold">{d.getDate()}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
              {date && (
                <div>
                  <p className="mb-2 text-sm font-semibold text-slate-600">{t('chooseTime')}</p>
                  {slots.length ? (
                    <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                      {slots.map((s) => (
                        <button
                          key={s}
                          onClick={() => setTime(s)}
                          className={`rounded-lg border py-2 text-sm font-semibold transition ${time === s ? 'border-brand bg-brand text-white' : 'border-slate-200 bg-white text-navy hover:border-brand'}`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="rounded-xl bg-surface p-4 text-sm text-slate-500">{t('noSlots')}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <form id="contact" onSubmit={submit} noValidate className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label={t('fullName')} error={t(errors.name)} className="sm:col-span-2">
                <input className="field" value={form.name} onChange={(e) => setField('name', e.target.value)} autoComplete="name" />
              </Field>
              <Field label={t('phone')} error={t(errors.phone)}>
                <input
                  className="field"
                  value={form.phone}
                  onChange={(e) => setField('phone', formatPhone(e.target.value))}
                  placeholder="+7 7__ ___ __ __"
                  inputMode="tel"
                  autoComplete="tel"
                />
              </Field>
              <Field label={t('email')} error={t(errors.email)}>
                <input className="field" type="email" value={form.email} onChange={(e) => setField('email', e.target.value)} autoComplete="email" />
              </Field>
              <Field label={t('iin')} error={t(errors.iin)}>
                <input className="field" value={form.iin} onChange={(e) => setField('iin', e.target.value.replace(/\D/g, '').slice(0, 12))} inputMode="numeric" />
              </Field>
              <Field label={`${t('comment')} (${form.comment.length}/300)`} error={t(errors.comment)} className="sm:col-span-2">
                <textarea className="field min-h-24" value={form.comment} onChange={(e) => setField('comment', e.target.value)} />
              </Field>
              <label className="flex items-start gap-3 text-sm text-slate-600 sm:col-span-2">
                <input type="checkbox" className="mt-0.5 h-5 w-5 accent-[#06B6D4]" checked={form.consent} onChange={(e) => setField('consent', e.target.checked)} />
                <span>
                  {t('consent')}
                  {errors.consent && <span className="block text-red-600">{t(errors.consent)}</span>}
                </span>
              </label>
            </form>
          )}

          <div className="mt-8 flex justify-between gap-3">
            <button onClick={() => setStep(step - 1)} disabled={step === 0} className="btn-ghost disabled:invisible">
              ← {t('back')}
            </button>
            {step < 3 ? (
              <button onClick={() => setStep(step + 1)} disabled={!canNext} className="btn-primary">
                {t('next')} →
              </button>
            ) : (
              <button type="submit" form="contact" className="btn-primary">{t('confirm')}</button>
            )}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="card p-5 text-sm">
            <h3 className="mb-3 font-bold text-navy">{t('summary')}</h3>
            <Summary {...{ clinic, branch, doctor, service, date, time, tr, price, longDate }} />
          </div>
          <DemoNotice />
        </aside>
      </div>
    </div>
  )
}

function Field({ label, error, className = '', children }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-sm font-semibold text-slate-600">{label}</span>
      {children}
      {error && <span className="mt-1 block text-sm text-red-600">{error}</span>}
    </label>
  )
}

function Summary({ clinic, branch, doctor, service, date, time, tr, price, longDate }) {
  const rows = [
    ['🏥', clinic.name],
    ['📍', branch && tr(branch.address)],
    ['👩‍⚕️', doctor?.name],
    ['🩺', service && `${tr(service.name)} · ${price(service.price)}`],
    ['📅', date && `${longDate(date)}${time ? `, ${time}` : ''}`],
  ]
  return (
    <ul className="space-y-2.5">
      {rows.map(([icon, value]) => (
        <li key={icon} className="flex gap-3">
          <span>{icon}</span>
          <span className={value ? 'font-medium text-slate-700' : 'text-slate-300'}>{value || '—'}</span>
        </li>
      ))}
    </ul>
  )
}
