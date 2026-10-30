import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLang } from '../../i18n.jsx'
import { api, useApi } from '../../api.js'
import { ErrorBox, Loading, Stars } from '../../components/ui.jsx'
import AppointmentCard from './AppointmentCard.jsx'
import { CabinetHeader, Tabs } from './index.jsx'

const nowString = () => {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:00`
}

export default function PatientCabinet({ user }) {
  const { t } = useLang()
  const { data, error, loading, reload } = useApi('/me/appointments')
  const [tab, setTab] = useState('upcoming')
  const [actionError, setActionError] = useState(null)

  const now = nowString()
  const isUpcoming = (a) => a.startsAt > now && ['pending', 'confirmed'].includes(a.status)
  const list = (data ?? []).filter((a) => (tab === 'upcoming' ? isUpcoming(a) : !isUpcoming(a)))
  if (tab === 'upcoming') list.reverse()

  const cancel = async (id) => {
    setActionError(null)
    try {
      await api(`/me/appointments/${id}/cancel`, { method: 'POST' })
      reload()
    } catch (err) {
      setActionError(err)
    }
  }

  return (
    <>
      <CabinetHeader title={t('myAppointments')} subtitle={`${user.fullName} · ${user.phone}`}>
        <Link to="/clinics" className="btn-primary">+ {t('bookNew')}</Link>
      </CabinetHeader>
      <Tabs tabs={[['upcoming', t('upcoming')], ['past', t('past')]]} value={tab} onChange={setTab} />
      <ErrorBox error={error ?? actionError} />
      {loading && !data ? (
        <Loading />
      ) : list.length ? (
        <div className="space-y-4">
          {list.map((a) => (
            <AppointmentCard key={a.id} appt={a}>
              {isUpcoming(a) && (
                <button onClick={() => cancel(a.id)} className="text-sm font-semibold text-red-600 hover:underline">{t('cancelAppt')}</button>
              )}
              {a.status === 'completed' && (a.review ? <ReviewView review={a.review} /> : <ReviewForm id={a.id} onDone={reload} />)}
            </AppointmentCard>
          ))}
        </div>
      ) : (
        <div className="card p-10 text-center text-slate-500">{t('noAppointments')}</div>
      )}
    </>
  )
}

function ReviewView({ review }) {
  const { t } = useLang()
  return (
    <div className="text-sm">
      <span className="font-semibold text-navy">{t('yourReview')}: </span>
      <Stars value={review.rating} size="text-sm" />
      {review.text && <p className="mt-1 text-slate-600">{review.text}</p>}
    </div>
  )
}

function ReviewForm({ id, onDone }) {
  const { t } = useLang()
  const [open, setOpen] = useState(false)
  const [rating, setRating] = useState(0)
  const [text, setText] = useState('')
  const [error, setError] = useState(null)

  if (!open) return <button onClick={() => setOpen(true)} className="text-sm font-semibold text-brand hover:underline">★ {t('leaveReview')}</button>

  const submit = async (e) => {
    e.preventDefault()
    try {
      await api(`/me/appointments/${id}/review`, { method: 'POST', body: { rating, text } })
      onDone()
    } catch (err) {
      setError(err)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <ErrorBox error={error} />
      <Stars value={rating} onChange={setRating} size="text-2xl" />
      <textarea className="field min-h-20" maxLength={500} placeholder={t('reviewPlaceholder')} value={text} onChange={(e) => setText(e.target.value)} />
      <div className="flex gap-2">
        <button className="btn-primary py-2 text-sm" disabled={!rating}>{t('send')}</button>
        <button type="button" onClick={() => setOpen(false)} className="btn-ghost py-2 text-sm">{t('cancel')}</button>
      </div>
    </form>
  )
}
