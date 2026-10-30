import { Link } from 'react-router-dom'
import { useLang } from '../../i18n.jsx'
import { Badge, parseDateTime } from '../../components/ui.jsx'
import { specialties } from '../../../shared/constants.js'

// One appointment row, shared by all cabinets. `show` picks which parties to display.
export default function AppointmentCard({ appt, show = ['clinic', 'doctor'], children }) {
  const { t, tr, price, longDate } = useLang()
  const start = parseDateTime(appt.startsAt)
  const time = appt.startsAt.slice(11, 16)
  const spec = specialties.find((s) => s.id === appt.doctor.specialty)

  return (
    <article className={`card p-5 ${appt.status === 'cancelled' ? 'opacity-60' : ''}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex gap-4">
          <div className="flex w-16 shrink-0 flex-col items-center rounded-xl bg-surface py-2">
            <span className="text-xl font-extrabold text-navy">{start.getDate()}</span>
            <span className="text-xs font-semibold text-brand">{time}</span>
          </div>
          <div>
            <p className="text-sm text-slate-400">{longDate(start)}</p>
            {show.includes('clinic') && (
              <Link to={`/clinics/${appt.clinic.slug}`} className="font-bold text-navy hover:text-brand">{appt.clinic.name}</Link>
            )}
            {show.includes('patient') && <p className="font-bold text-navy">{appt.patientName} · <span className="font-medium text-slate-500">{appt.patientPhone}</span></p>}
            <p className="text-sm text-slate-600">
              {show.includes('doctor') && <>{appt.doctor.name} ({tr(spec.name)}) · </>}
              {tr(appt.service.name)} · <span className="whitespace-nowrap">{price(appt.service.price)}</span>
            </p>
            <p className="text-xs text-slate-400">📍 {tr(appt.address)}</p>
            {appt.comment && <p className="mt-2 rounded-lg bg-surface px-3 py-2 text-sm text-slate-600">💬 {appt.comment}</p>}
          </div>
        </div>
        <Badge status={appt.status}>{t(`status_${appt.status}`)}</Badge>
      </div>
      {children && <div className="mt-4 border-t border-slate-100 pt-4">{children}</div>}
    </article>
  )
}
