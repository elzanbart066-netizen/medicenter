import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLang } from '../../i18n.jsx'
import { api, useApi } from '../../api.js'
import { Badge, ErrorBox, Loading, parseDateTime } from '../../components/ui.jsx'
import { CabinetHeader } from './index.jsx'

export default function AdminCabinet() {
  const { t, shortDate } = useLang()
  const { data, error, loading, reload } = useApi('/admin/organizations')
  const [filter, setFilter] = useState('pending')
  const [actionError, setActionError] = useState(null)

  const update = async (id, body) => {
    setActionError(null)
    try {
      await api(`/admin/organizations/${id}`, { method: 'PATCH', body })
      reload()
    } catch (err) {
      setActionError(err)
    }
  }

  if (loading && !data) return <Loading />
  const list = (data ?? []).filter((o) => filter === 'all' || o.status === filter)
  const count = (s) => (data ?? []).filter((o) => o.status === s).length

  return (
    <>
      <CabinetHeader title={t('adminTitle')} subtitle={t('applications')} />
      <div className="mb-4 flex flex-wrap gap-2">
        {['pending', 'approved', 'rejected', 'all'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`chip ${filter === s ? 'border-navy bg-navy text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-brand'}`}
          >
            {s === 'all' ? t('all') : t(`org_${s}`)} {s !== 'all' && <span className="opacity-60">({count(s)})</span>}
          </button>
        ))}
      </div>
      <ErrorBox error={error ?? actionError} />
      <div className="space-y-4">
        {list.map((o) => (
          <article key={o.id} className="card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  {o.status === 'approved' ? (
                    <Link to={`/clinics/${o.slug}`} className="text-lg font-bold text-navy hover:text-brand">{o.name}</Link>
                  ) : (
                    <span className="text-lg font-bold text-navy">{o.name}</span>
                  )}
                  <Badge status={o.status}>{t(`org_${o.status}`)}</Badge>
                </div>
                <p className="mt-1 max-w-2xl text-sm text-slate-600">{o.description.kk}</p>
                <p className="mt-2 text-xs text-slate-400">
                  {t('contactPerson')}: {o.admin.name} · {o.admin.email} · {o.phone} · {shortDate(parseDateTime(o.createdAt))}
                </p>
                <p className="text-xs text-slate-400">
                  {t('doctors')}: {o.doctorCount} · {t('tabAppointments')}: {o.appointmentCount}
                  {o.rating && ` · ★ ${o.rating}`}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="flex gap-2">
                  {o.status !== 'approved' && <button onClick={() => update(o.id, { status: 'approved' })} className="btn-primary py-2 text-sm">{t('approve')}</button>}
                  {o.status !== 'rejected' && <button onClick={() => update(o.id, { status: 'rejected' })} className="btn-ghost py-2 text-sm text-red-600">{t('reject')}</button>}
                </div>
                {o.status === 'approved' && (
                  <div className="flex gap-4 text-sm text-slate-600">
                    <label className="flex items-center gap-1.5">
                      <input type="checkbox" className="h-4 w-4 accent-[#06B6D4]" checked={o.featured} onChange={(e) => update(o.id, { featured: e.target.checked })} />
                      {t('featuredLabel')}
                    </label>
                    <label className="flex items-center gap-1.5">
                      <input type="checkbox" className="h-4 w-4 accent-[#06B6D4]" checked={o.sponsored} onChange={(e) => update(o.id, { sponsored: e.target.checked })} />
                      {t('sponsoredLabel')}
                    </label>
                  </div>
                )}
              </div>
            </div>
          </article>
        ))}
        {!list.length && <div className="card p-10 text-center text-slate-500">—</div>}
      </div>
    </>
  )
}
