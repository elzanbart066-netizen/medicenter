import { Link } from 'react-router-dom'
import { useLang } from '../i18n.jsx'

export default function Logo({ light = false }) {
  const { t } = useLang()
  return (
    <Link to="/" className="flex items-center gap-3">
      <img src="/icon.png" alt="" className="h-10 w-10 rounded-xl" />
      <span className="leading-tight">
        <span className={`block text-xl font-extrabold tracking-tight ${light ? 'text-white' : 'text-navy'}`}>
          Medi<span className={light ? 'text-mint' : 'text-brand'}>Center</span>
        </span>
        <span className={`block text-[10px] uppercase tracking-[0.2em] ${light ? 'text-white/70' : 'text-slate-500'}`}>
          {t('tagline')}
        </span>
      </span>
    </Link>
  )
}
