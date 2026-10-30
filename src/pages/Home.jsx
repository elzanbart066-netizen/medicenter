import { Link } from 'react-router-dom'
import SearchBar from '../components/SearchBar.jsx'
import ClinicCard from '../components/ClinicCard.jsx'
import { useLang } from '../i18n.jsx'
import { clinics, specialties } from '../data/clinics.js'

export default function Home() {
  const { t, tr } = useLang()
  const featured = clinics.filter((c) => c.featured)
  const doctorCount = clinics.reduce((n, c) => n + c.doctors.length, 0)

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-br from-navy via-[#0b4f86] to-brand text-white">
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-mint/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-10 h-72 w-72 rounded-full bg-brand/30 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-14 md:pb-28 md:pt-20">
          <p className="mb-4 inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-mint">
            Астана
          </p>
          <h1 className="max-w-3xl text-3xl font-extrabold leading-tight md:text-5xl">{t('heroTitle')}</h1>
          <p className="mt-4 max-w-2xl text-base text-white/80 md:text-lg">{t('heroText')}</p>
          <div className="mt-8 max-w-4xl">
            <SearchBar />
          </div>
          <div className="mt-8 flex gap-8 text-sm text-white/80">
            <span><b className="block text-2xl text-white">{clinics.length}</b>{t('clinicsCount')}</span>
            <span><b className="block text-2xl text-white">{doctorCount}</b>{t('doctorsCount')}</span>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto -mt-10 max-w-6xl px-4">
        <div className="card p-5 md:p-6">
          <h2 className="text-lg font-bold text-navy">{t('popularSpecialties')}</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {specialties.map((s) => (
              <Link
                key={s.id}
                to={`/clinics?specialty=${s.id}`}
                className="flex items-center gap-3 rounded-xl bg-surface px-4 py-3 text-sm font-semibold text-navy transition hover:bg-brand hover:text-white"
              >
                <span className="text-xl">{s.icon}</span>{tr(s.name)}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-14">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-extrabold text-navy">{t('featured')}</h2>
            <p className="mt-1 text-sm text-slate-500">{t('featuredNote')}</p>
          </div>
          <Link to="/clinics" className="text-sm font-semibold text-brand hover:underline">{t('seeAll')} →</Link>
        </div>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((c) => <ClinicCard key={c.id} clinic={c} />)}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-14">
        <h2 className="text-2xl font-extrabold text-navy">{t('howTitle')}</h2>
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="card p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-mint/40 font-extrabold text-navy">{n}</span>
              <h3 className="mt-4 font-bold text-navy">{t(`how${n}`)}</h3>
              <p className="mt-1 text-sm text-slate-600">{t(`how${n}t`)}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
