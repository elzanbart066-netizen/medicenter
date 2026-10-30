import { Link } from 'react-router-dom'
import { useLang } from '../i18n.jsx'
import { districts, specialties } from '../../shared/constants.js'

const nameOf = (list, id) => list.find((x) => x.id === id)?.name

export default function ClinicCard({ clinic }) {
  const { t, tr, priceFrom } = useLang()

  return (
    <article className="card group flex flex-col overflow-hidden transition hover:-translate-y-1 hover:shadow-lg">
      <div className={`relative h-24 bg-gradient-to-br ${clinic.color}`}>
        <div className="absolute -bottom-6 left-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-xl font-extrabold text-navy shadow-md">
          {clinic.name[0]}
        </div>
        <div className="absolute right-3 top-3 flex gap-2">
          {clinic.sponsored && <span className="rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-amber-700">{t('ad')}</span>}
          <span className="rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-navy">✓ {t('verified')}</span>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5 pt-9">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg font-bold text-navy">{clinic.name}</h3>
          {clinic.rating && (
            <span className="flex shrink-0 items-center gap-1 text-sm font-semibold text-slate-600">
              <span className="text-amber-400">★</span>
              {clinic.rating}
              <span className="font-normal text-slate-400">({clinic.reviewCount})</span>
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-slate-500">📍 {clinic.districts.map((d) => tr(nameOf(districts, d))).join(', ')}</p>
        <p className="mt-3 line-clamp-2 text-sm text-slate-600">{tr(clinic.description)}</p>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {clinic.specialties.map((s) => (
            <span key={s} className="rounded-full bg-surface px-2.5 py-1 text-xs font-medium text-navy">{tr(nameOf(specialties, s))}</span>
          ))}
        </div>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-5">
          <div className="whitespace-nowrap text-base font-bold text-navy">{clinic.minPrice ? priceFrom(clinic.minPrice) : ''}</div>
          <div className="flex gap-2">
            <Link to={`/clinics/${clinic.slug}`} className="btn-ghost px-3 py-2 text-sm">{t('details')}</Link>
            <Link to={`/booking/${clinic.slug}`} className="btn-primary px-3 py-2 text-sm">{t('book')}</Link>
          </div>
        </div>
      </div>
    </article>
  )
}
