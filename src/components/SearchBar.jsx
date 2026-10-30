import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../i18n.jsx'
import { districts } from '../../shared/constants.js'

export default function SearchBar({ initialQuery = '', initialDistrict = '' }) {
  const { t, tr } = useLang()
  const navigate = useNavigate()
  const [q, setQ] = useState(initialQuery)
  const [district, setDistrict] = useState(initialDistrict)

  const submit = (e) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (q.trim()) params.set('q', q.trim())
    if (district) params.set('district', district)
    navigate(`/clinics?${params}`)
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2 rounded-2xl bg-white p-2 shadow-xl shadow-navy/10 md:flex-row">
      <label className="flex flex-1 items-center gap-3 px-3">
        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-slate-400">
          <circle cx="9" cy="9" r="6" /><path d="M14 14l4 4" strokeLinecap="round" />
        </svg>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className="w-full py-3 outline-none placeholder:text-slate-400"
        />
      </label>
      <select
        value={district}
        onChange={(e) => setDistrict(e.target.value)}
        className="rounded-xl bg-surface px-4 py-3 text-sm font-medium text-navy outline-none md:w-52"
      >
        <option value="">{t('allDistricts')}</option>
        {districts.map((d) => <option key={d.id} value={d.id}>{tr(d.name)}</option>)}
      </select>
      <button className="btn-primary">{t('search')}</button>
    </form>
  )
}
