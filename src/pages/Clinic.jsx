import { Link, useParams } from 'react-router-dom'
import NotFound from './NotFound.jsx'
import DemoNotice from '../components/DemoNotice.jsx'
import { ErrorBox, Loading, Stars, parseDateTime } from '../components/ui.jsx'
import { useLang } from '../i18n.jsx'
import { useApi } from '../api.js'
import { districts, specialties } from '../../shared/constants.js'

const nameOf = (list, id) => list.find((x) => x.id === id)?.name
const initials = (name) => name.split(' ').map((p) => p[0]).join('')

export default function Clinic() {
  const { slug } = useParams()
  const { t, tr, price, shortDate } = useLang()
  const { data: clinic, error, loading } = useApi(`/clinics/${slug}`)

  if (loading) return <Loading />
  if (error?.status === 404) return <NotFound />
  if (error) return <div className="mx-auto max-w-6xl px-4 pt-8"><ErrorBox error={error} /></div>

  return (
    <>
      <section className={`bg-gradient-to-br ${clinic.color} text-white`}>
        <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
          <Link to="/clinics" className="text-sm font-semibold text-white/80 hover:text-white">← {t('navClinics')}</Link>
          <div className="mt-4 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="flex items-center gap-5">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-white text-3xl font-extrabold text-navy shadow-lg">
                {clinic.name[0]}
              </div>
              <div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-white/20 px-2.5 py-1 text-xs font-bold">✓ {t('verified')}</span>
                  {clinic.sponsored && <span className="rounded-full bg-white/90 px-2.5 py-1 text-xs font-bold text-amber-700">{t('ad')}</span>}
                  {clinic.rating && (
                    <span className="rounded-full bg-white/20 px-2.5 py-1 text-xs font-bold">★ {clinic.rating} · {clinic.reviewCount} {t('reviewsCount')}</span>
                  )}
                </div>
                <h1 className="mt-2 text-3xl font-extrabold md:text-4xl">{clinic.name}</h1>
                <p className="mt-1 text-white/80">{clinic.phone} · {tr(clinic.hours)}</p>
              </div>
            </div>
            <Link to={`/booking/${clinic.slug}`} className="btn-primary bg-white text-navy hover:bg-mint hover:text-navy">
              {t('book')}
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 pt-8 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <section className="card p-6">
            <h2 className="text-lg font-bold text-navy">{t('about')}</h2>
            <p className="mt-2 text-slate-600">{tr(clinic.description)}</p>
          </section>

          <section className="card p-6">
            <h2 className="text-lg font-bold text-navy">{t('doctors')}</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {clinic.doctors.map((d) => (
                <div key={d.id} className="flex items-center gap-4 rounded-xl bg-surface p-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand to-mint font-bold text-white">
                    {initials(d.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-navy">{d.name}</p>
                    <p className="text-sm text-slate-500">{tr(nameOf(specialties, d.specialty))} · {d.experience} {t('experience')}</p>
                  </div>
                  <Link to={`/booking/${clinic.slug}?doctor=${d.id}`} className="text-sm font-semibold text-brand hover:underline">
                    {t('book')}
                  </Link>
                </div>
              ))}
            </div>
          </section>

          <section className="card p-6">
            <h2 className="text-lg font-bold text-navy">{t('services')}</h2>
            <ul className="mt-3 divide-y divide-slate-100">
              {clinic.services.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-4 py-3">
                  <span>
                    <span className="font-medium text-slate-700">{tr(s.name)}</span>
                    <span className="ml-2 text-xs text-slate-400">{s.duration} {t('minutes')}</span>
                  </span>
                  <span className="whitespace-nowrap font-bold text-navy">{price(s.price)}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="card p-6">
            <h2 className="text-lg font-bold text-navy">{t('reviews')}</h2>
            {clinic.reviews.length ? (
              <ul className="mt-3 space-y-4">
                {clinic.reviews.map((r) => (
                  <li key={r.id} className="rounded-xl bg-surface p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold text-navy">{r.patientName}</span>
                      <Stars value={r.rating} size="text-sm" />
                    </div>
                    {r.text && <p className="mt-2 text-sm text-slate-600">{r.text}</p>}
                    <p className="mt-2 text-xs text-slate-400">{r.doctorName} · {shortDate(parseDateTime(r.createdAt))}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-slate-500">{t('noReviews')}</p>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="card p-6">
            <h2 className="text-lg font-bold text-navy">{t('branches')}</h2>
            <ul className="mt-3 space-y-3">
              {clinic.branches.map((b) => (
                <li key={b.id} className="rounded-xl bg-surface p-4 text-sm">
                  <p className="font-semibold text-navy">📍 {tr(b.address)}</p>
                  <p className="mt-1 text-slate-500">{tr(nameOf(districts, b.district))}</p>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-slate-500"><b className="text-navy">{t('workHours')}:</b> {tr(clinic.hours)}</p>
          </section>
          <DemoNotice />
        </aside>
      </div>
    </>
  )
}
