import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLang } from '../../i18n.jsx'
import { api, useApi } from '../../api.js'
import { Badge, ErrorBox, Field, Loading, useFieldError } from '../../components/ui.jsx'
import { districts, specialties } from '../../../shared/constants.js'
import { formatPhone } from '../../validation.js'
import AppointmentCard from './AppointmentCard.jsx'
import { CabinetHeader, Tabs } from './index.jsx'

const nameOf = (list, id) => list.find((x) => x.id === id)?.name

export default function ClinicCabinet() {
  const { t } = useLang()
  const { data: clinic, error, loading, reload } = useApi('/clinic')
  const [tab, setTab] = useState('appointments')

  if (loading && !clinic) return <Loading />
  if (error) return <ErrorBox error={error} />

  const tabs = [
    ['appointments', t('tabAppointments')],
    ['doctors', t('tabDoctors')],
    ['services', t('tabServices')],
    ['branches', t('tabBranches')],
    ['profile', t('tabProfile')],
  ]

  return (
    <>
      <CabinetHeader title={clinic.name} subtitle={t('cabinet')}>
        {clinic.status === 'approved' && <Link to={`/clinics/${clinic.slug}`} className="btn-ghost text-sm">{t('details')} ↗</Link>}
      </CabinetHeader>
      {clinic.status !== 'approved' && (
        <div className={`mb-6 rounded-xl border px-4 py-3 text-sm ${clinic.status === 'pending' ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-red-200 bg-red-50 text-red-700'}`}>
          {t(clinic.status === 'pending' ? 'pendingClinic' : 'rejectedClinic')}
        </div>
      )}
      <Tabs tabs={tabs} value={tab} onChange={setTab} />
      {tab === 'appointments' && <Appointments />}
      {tab === 'doctors' && <Doctors clinic={clinic} reload={reload} />}
      {tab === 'services' && <Services clinic={clinic} reload={reload} />}
      {tab === 'branches' && <Branches clinic={clinic} reload={reload} />}
      {tab === 'profile' && <Profile clinic={clinic} reload={reload} />}
    </>
  )
}

function Appointments() {
  const { t } = useLang()
  const { data, error, loading, reload } = useApi('/clinic/appointments')
  const [filter, setFilter] = useState('pending')
  const [actionError, setActionError] = useState(null)

  const setStatus = async (id, status) => {
    setActionError(null)
    try {
      await api(`/clinic/appointments/${id}`, { method: 'PATCH', body: { status } })
      reload()
    } catch (err) {
      setActionError(err)
    }
  }

  if (loading && !data) return <Loading />
  const list = (data ?? []).filter((a) => filter === 'all' || a.status === filter)
  const count = (s) => (data ?? []).filter((a) => a.status === s).length

  return (
    <>
      <div className="mb-4 flex flex-wrap gap-2">
        {['pending', 'confirmed', 'completed', 'cancelled', 'all'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`chip ${filter === s ? 'border-navy bg-navy text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-brand'}`}
          >
            {s === 'all' ? t('all') : t(`status_${s}`)} {s !== 'all' && <span className="opacity-60">({count(s)})</span>}
          </button>
        ))}
      </div>
      <ErrorBox error={error ?? actionError} />
      {list.length ? (
        <div className="space-y-4">
          {list.map((a) => (
            <AppointmentCard key={a.id} appt={a} show={['patient', 'doctor']}>
              {['pending', 'confirmed'].includes(a.status) && (
                <div className="flex flex-wrap gap-2">
                  {a.status === 'pending' && <button onClick={() => setStatus(a.id, 'confirmed')} className="btn-primary py-2 text-sm">{t('actConfirm')}</button>}
                  {a.status === 'confirmed' && <button onClick={() => setStatus(a.id, 'completed')} className="btn-primary py-2 text-sm">{t('actComplete')}</button>}
                  <button onClick={() => setStatus(a.id, 'cancelled')} className="btn-ghost py-2 text-sm text-red-600">{t('actCancel')}</button>
                </div>
              )}
            </AppointmentCard>
          ))}
        </div>
      ) : (
        <div className="card p-10 text-center text-slate-500">{t('noAppointments')}</div>
      )}
    </>
  )
}

// Shared add/edit form state for the clinic's lists
function useEditor(reload) {
  const [editing, setEditing] = useState(null) // null | 'new' | id
  const [form, setForm] = useState({})
  const [errors, setErrors] = useState({})
  const [error, setError] = useState(null)

  const open = (id, initial) => {
    setEditing(id)
    setForm(initial)
    setErrors({})
    setError(null)
  }
  const close = () => setEditing(null)
  const save = async (path, body) => {
    setError(null)
    try {
      await api(path, { method: editing === 'new' ? 'POST' : 'PUT', body })
      close()
      reload()
    } catch (err) {
      if (err.code === 'validation') setErrors(err.fields)
      else setError(err)
    }
  }
  return { editing, form, setForm, errors, error, setError, open, close, save }
}

function ListCard({ title, onAdd, children }) {
  const { t } = useLang()
  return (
    <section className="card p-5 md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-navy">{title}</h2>
        {onAdd && <button onClick={onAdd} className="btn-primary py-2 text-sm">+ {t('add')}</button>}
      </div>
      {children}
    </section>
  )
}

function FormActions({ onCancel }) {
  const { t } = useLang()
  return (
    <div className="flex gap-2 sm:col-span-2">
      <button className="btn-primary py-2 text-sm">{t('save')}</button>
      <button type="button" onClick={onCancel} className="btn-ghost py-2 text-sm">{t('cancel')}</button>
    </div>
  )
}

const SpecialtySelect = ({ value, onChange }) => {
  const { tr } = useLang()
  return (
    <select className="field" value={value} onChange={(e) => onChange(e.target.value)}>
      {specialties.map((s) => <option key={s.id} value={s.id}>{tr(s.name)}</option>)}
    </select>
  )
}

function Doctors({ clinic, reload }) {
  const { t, tr } = useLang()
  const fe = useFieldError()
  const ed = useEditor(reload)
  const { form, setForm } = ed

  const blank = { fullName: '', specialty: 'therapist', experience: 0, branchIds: clinic.branches.slice(0, 1).map((b) => b.id), active: true }
  const toggleBranch = (id) =>
    setForm({ ...form, branchIds: form.branchIds.includes(id) ? form.branchIds.filter((b) => b !== id) : [...form.branchIds, id] })

  const editor = (
    <form
      onSubmit={(e) => { e.preventDefault(); ed.save(ed.editing === 'new' ? '/clinic/doctors' : `/clinic/doctors/${ed.editing}`, { ...form, experience: Number(form.experience) }) }}
      className="mb-4 grid gap-4 rounded-xl bg-surface p-4 sm:grid-cols-2"
    >
      <div className="sm:col-span-2"><ErrorBox error={ed.error} /></div>
      <Field label={t('fullName')} error={fe(ed.errors.fullName)}>
        <input className="field" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
      </Field>
      <Field label={t('specialty')}>
        <SpecialtySelect value={form.specialty} onChange={(v) => setForm({ ...form, specialty: v })} />
      </Field>
      <Field label={t('experienceLabel')} error={fe(ed.errors.experience)}>
        <input className="field" type="number" min="0" max="60" value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} />
      </Field>
      <Field label={t('branches')} error={fe(ed.errors.branchIds)}>
        <div className="space-y-1.5">
          {clinic.branches.map((b) => (
            <label key={b.id} className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="h-4 w-4 accent-[#06B6D4]" checked={form.branchIds?.includes(b.id)} onChange={() => toggleBranch(b.id)} />
              {tr(b.address)}
            </label>
          ))}
        </div>
      </Field>
      {ed.editing !== 'new' && (
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
          <input type="checkbox" className="h-4 w-4 accent-[#06B6D4]" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
          {t('activeLabel')}
        </label>
      )}
      <FormActions onCancel={ed.close} />
    </form>
  )

  return (
    <ListCard title={t('tabDoctors')} onAdd={ed.editing ? null : () => ed.open('new', blank)}>
      {ed.editing === 'new' && editor}
      <ul className="divide-y divide-slate-100">
        {clinic.doctors.map((d) =>
          ed.editing === d.id ? (
            <li key={d.id} className="py-3">{editor}</li>
          ) : (
            <li key={d.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div>
                <p className="font-semibold text-navy">
                  {d.name} {!d.active && <span className="ml-1 text-xs font-medium text-slate-400">({t('hidden')})</span>}
                </p>
                <p className="text-sm text-slate-500">
                  {tr(nameOf(specialties, d.specialty))} · {d.experience} {t('experience')} · {d.branches.map((id) => tr(clinic.branches.find((b) => b.id === id)?.address ?? { kk: '', ru: '' })).join('; ')}
                </p>
                {d.loginEmail && <p className="text-xs text-slate-400">🔑 {d.loginEmail}</p>}
              </div>
              <button
                onClick={() => ed.open(d.id, { fullName: d.name, specialty: d.specialty, experience: d.experience, branchIds: d.branches, active: d.active })}
                className="text-sm font-semibold text-brand hover:underline"
              >
                {t('edit')}
              </button>
            </li>
          ),
        )}
      </ul>
    </ListCard>
  )
}

function Services({ clinic, reload }) {
  const { t, tr, price } = useLang()
  const fe = useFieldError()
  const ed = useEditor(reload)
  const { form, setForm } = ed
  const blank = { specialty: 'therapist', name: { kk: '', ru: '' }, price: 5000, duration: 30, active: true }

  const editor = (
    <form
      onSubmit={(e) => { e.preventDefault(); ed.save(ed.editing === 'new' ? '/clinic/services' : `/clinic/services/${ed.editing}`, { ...form, price: Number(form.price), duration: Number(form.duration) }) }}
      className="mb-4 grid gap-4 rounded-xl bg-surface p-4 sm:grid-cols-2"
    >
      <div className="sm:col-span-2"><ErrorBox error={ed.error} /></div>
      <Field label={t('nameKk')} error={fe(ed.errors['name.kk'])}>
        <input className="field" value={form.name.kk} onChange={(e) => setForm({ ...form, name: { ...form.name, kk: e.target.value } })} />
      </Field>
      <Field label={t('nameRu')} error={fe(ed.errors['name.ru'])}>
        <input className="field" value={form.name.ru} onChange={(e) => setForm({ ...form, name: { ...form.name, ru: e.target.value } })} />
      </Field>
      <Field label={t('specialty')}>
        <SpecialtySelect value={form.specialty} onChange={(v) => setForm({ ...form, specialty: v })} />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label={t('price')} error={fe(ed.errors.price)}>
          <input className="field" type="number" min="500" step="500" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
        </Field>
        <Field label={t('duration')}>
          <select className="field" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })}>
            {[15, 30, 45, 60, 90, 120].map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </Field>
      </div>
      {ed.editing !== 'new' && (
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
          <input type="checkbox" className="h-4 w-4 accent-[#06B6D4]" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
          {t('activeLabel')}
        </label>
      )}
      <FormActions onCancel={ed.close} />
    </form>
  )

  return (
    <ListCard title={t('tabServices')} onAdd={ed.editing ? null : () => ed.open('new', blank)}>
      {ed.editing === 'new' && editor}
      <ul className="divide-y divide-slate-100">
        {clinic.services.map((s) =>
          ed.editing === s.id ? (
            <li key={s.id} className="py-3">{editor}</li>
          ) : (
            <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div>
                <p className="font-semibold text-navy">
                  {tr(s.name)} {!s.active && <span className="ml-1 text-xs font-medium text-slate-400">({t('hidden')})</span>}
                </p>
                <p className="text-sm text-slate-500">{tr(nameOf(specialties, s.specialty))} · {s.duration} {t('minutes')}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="whitespace-nowrap font-bold text-navy">{price(s.price)}</span>
                <button onClick={() => ed.open(s.id, { specialty: s.specialty, name: s.name, price: s.price, duration: s.duration, active: s.active })} className="text-sm font-semibold text-brand hover:underline">
                  {t('edit')}
                </button>
              </div>
            </li>
          ),
        )}
      </ul>
    </ListCard>
  )
}

function Branches({ clinic, reload }) {
  const { t, tr } = useLang()
  const fe = useFieldError()
  const ed = useEditor(reload)
  const { form, setForm } = ed
  const blank = { district: 'esil', address: { kk: '', ru: '' } }

  const remove = async (id) => {
    ed.setError(null)
    try {
      await api(`/clinic/branches/${id}`, { method: 'DELETE' })
      reload()
    } catch (err) {
      ed.setError(err)
    }
  }

  const editor = (
    <form
      onSubmit={(e) => { e.preventDefault(); ed.save(ed.editing === 'new' ? '/clinic/branches' : `/clinic/branches/${ed.editing}`, form) }}
      className="mb-4 grid gap-4 rounded-xl bg-surface p-4 sm:grid-cols-2"
    >
      <Field label={t('district')} className="sm:col-span-2">
        <select className="field" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })}>
          {districts.map((d) => <option key={d.id} value={d.id}>{tr(d.name)}</option>)}
        </select>
      </Field>
      <Field label={t('addressKk')} error={fe(ed.errors['address.kk'])}>
        <input className="field" value={form.address.kk} onChange={(e) => setForm({ ...form, address: { ...form.address, kk: e.target.value } })} />
      </Field>
      <Field label={t('addressRu')} error={fe(ed.errors['address.ru'])}>
        <input className="field" value={form.address.ru} onChange={(e) => setForm({ ...form, address: { ...form.address, ru: e.target.value } })} />
      </Field>
      <FormActions onCancel={ed.close} />
    </form>
  )

  return (
    <ListCard title={t('tabBranches')} onAdd={ed.editing ? null : () => ed.open('new', blank)}>
      {!ed.editing && <ErrorBox error={ed.error} />}
      {ed.editing === 'new' && editor}
      <ul className="divide-y divide-slate-100">
        {clinic.branches.map((b) =>
          ed.editing === b.id ? (
            <li key={b.id} className="py-3">{editor}</li>
          ) : (
            <li key={b.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div>
                <p className="font-semibold text-navy">📍 {tr(b.address)}</p>
                <p className="text-sm text-slate-500">{tr(nameOf(districts, b.district))}</p>
              </div>
              <div className="flex gap-4">
                <button onClick={() => ed.open(b.id, { district: b.district, address: b.address })} className="text-sm font-semibold text-brand hover:underline">{t('edit')}</button>
                <button onClick={() => remove(b.id)} className="text-sm font-semibold text-red-600 hover:underline">{t('delete')}</button>
              </div>
            </li>
          ),
        )}
      </ul>
    </ListCard>
  )
}

function Profile({ clinic, reload }) {
  const { t } = useLang()
  const fe = useFieldError()
  const [form, setForm] = useState({ name: clinic.name, phone: clinic.phone, description: clinic.description, hours: clinic.hours })
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState(null)

  const set = (key, lang) => (e) =>
    setForm(lang ? { ...form, [key]: { ...form[key], [lang]: e.target.value } } : { ...form, [key]: key === 'phone' ? formatPhone(e.target.value) : e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setStatus(null)
    try {
      await api('/clinic', { method: 'PUT', body: form })
      setErrors({})
      setStatus('saved')
      reload()
    } catch (err) {
      if (err.code === 'validation') setErrors(err.fields)
      else setStatus(err)
    }
  }

  return (
    <form onSubmit={submit} noValidate className="card grid gap-4 p-5 md:grid-cols-2 md:p-6">
      <Field label={t('clinicNameLabel')} error={fe(errors.name)}>
        <input className="field" value={form.name} onChange={set('name')} />
      </Field>
      <Field label={t('phone')} error={fe(errors.phone)}>
        <input className="field" value={form.phone} onChange={set('phone')} />
      </Field>
      <Field label={t('descKk')} error={fe(errors['description.kk'])}>
        <textarea className="field min-h-24" value={form.description.kk} onChange={set('description', 'kk')} />
      </Field>
      <Field label={t('descRu')} error={fe(errors['description.ru'])}>
        <textarea className="field min-h-24" value={form.description.ru} onChange={set('description', 'ru')} />
      </Field>
      <Field label={t('hoursKk')} error={fe(errors['hours.kk'])}>
        <input className="field" value={form.hours.kk} onChange={set('hours', 'kk')} />
      </Field>
      <Field label={t('hoursRu')} error={fe(errors['hours.ru'])}>
        <input className="field" value={form.hours.ru} onChange={set('hours', 'ru')} />
      </Field>
      <div className="flex items-center gap-4 md:col-span-2">
        <button className="btn-primary">{t('save')}</button>
        {status === 'saved' && <Badge status="approved">✓ {t('saved')}</Badge>}
        {status && status !== 'saved' && <ErrorBox error={status} />}
      </div>
    </form>
  )
}
