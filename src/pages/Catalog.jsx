import { useSearchParams } from 'react-router-dom'
import ClinicCard from '../components/ClinicCard.jsx'
import SearchBar from '../components/SearchBar.jsx'
import DemoNotice from '../components/DemoNotice.jsx'
import { useLang } from '../i18n.jsx'
import { useApi } from '../api.js'
import { ErrorBox, Loading } from '../components/ui.jsx'
import { districts, specialties } from '../../shared/constants.js'

const priceSteps = [5000, 10000, 15000]

export default function Catalog() {
  const { t, tr, price } = useLang()
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const district = params.get('district') ?? ''
  const specialty = params.get('specialty') ?? ''
  const maxPrice = Number(params.get('maxPrice')) || 0

  const update = (key, value) => {
    const next = new URLSearchParams(params)
    value ? next.set(key, value) : next.delete(key)
    setParams(next, { replace: true })
  }

  const query = new URLSearchParams({ q, district, specialty, maxPrice: maxPrice || '' })
  const { data: results, error, loading } = useApi(`/clinics?${query}`)

  const chip = (active) =>
    `chip ${active ? 'border-navy bg-navy text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-brand hover:text-brand'}`

  return (
    <div className="mx-auto max-w-6xl px-4 pt-8">
      <SearchBar key={q + district} initialQuery={q} initialDistrict={district} />

      <div className="mt-6 grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="card h-fit space-y-6 p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-navy">{t('filters')}</h2>
            <button onClick={() => setParams({}, { replace: true })} className="text-xs font-semibold text-brand">
              {t('reset')}
            </button>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">{t('specialty')}</p>
            <select value={specialty} onChange={(e) => update('specialty', e.target.value)} className="field py-2.5 text-sm">
              <option value="">{t('allSpecialties')}</option>
              {specialties.map((s) => <option key={s.id} value={s.id}>{tr(s.name)}</option>)}
            </select>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">{t('district')}</p>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => update('district', '')} className={chip(!district)}>{t('allDistricts')}</button>
              {districts.map((d) => (
                <button key={d.id} onClick={() => update('district', d.id)} className={chip(district === d.id)}>
                  {tr(d.name)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">{t('maxPrice')}</p>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => update('maxPrice', '')} className={chip(!maxPrice)}>{t('any')}</button>
              {priceSteps.map((p) => (
                <button key={p} onClick={() => update('maxPrice', String(p))} className={chip(maxPrice === p)}>
                  ≤ {price(p)}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <section>
          <ErrorBox error={error} />
          {loading && !results ? <Loading /> : results && (
            <p className="mb-4 text-sm text-slate-500">{t('found')}: <b className="text-navy">{results.length}</b></p>
          )}
          {!results ? null : results.length ? (
            <div className="grid gap-5 sm:grid-cols-2">
              {results.map((c) => <ClinicCard key={c.id} clinic={c} />)}
            </div>
          ) : (
            <div className="card p-10 text-center text-slate-500">{t('nothingFound')}</div>
          )}
          <div className="mt-6"><DemoNotice /></div>
        </section>
      </div>
    </div>
  )
}
