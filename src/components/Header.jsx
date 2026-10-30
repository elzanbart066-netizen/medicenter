import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import Logo from './Logo.jsx'
import { useLang } from '../i18n.jsx'
import { useAuth } from '../auth.jsx'

export default function Header() {
  const { lang, setLang, t } = useLang()
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const link = ({ isActive }) =>
    `rounded-lg px-3 py-2 text-sm font-semibold transition ${isActive ? 'text-brand' : 'text-slate-600 hover:text-navy'}`

  const logout = () => {
    signOut()
    navigate('/')
  }

  const langSwitch = (
    <div className="flex rounded-lg bg-surface p-1 text-xs font-bold">
      {['kk', 'ru'].map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={`rounded-md px-2.5 py-1 uppercase transition ${lang === l ? 'bg-white text-navy shadow-sm' : 'text-slate-500'}`}
        >
          {l === 'kk' ? 'Қаз' : 'Рус'}
        </button>
      ))}
    </div>
  )

  const account = user ? (
    <div className="flex items-center gap-2">
      <Link to="/cabinet" className="btn-ghost py-2 text-sm">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-brand to-mint text-[11px] text-white">
          {user.fullName[0]}
        </span>
        {t('cabinet')}
      </Link>
      <button onClick={logout} className="rounded-lg px-2 py-2 text-sm font-semibold text-slate-400 hover:text-red-600" title={t('signOut')}>
        {t('signOut')}
      </button>
    </div>
  ) : (
    <div className="flex items-center gap-2">
      <Link to="/login" className="btn-ghost py-2 text-sm">{t('signIn')}</Link>
      <Link to="/register" className="btn-primary py-2 text-sm">{t('register')}</Link>
    </div>
  )

  return (
    <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Logo />
        <nav className="hidden items-center gap-1 lg:flex">
          <NavLink to="/" end className={link}>{t('navHome')}</NavLink>
          <NavLink to="/clinics" className={link}>{t('navClinics')}</NavLink>
          <NavLink to="/for-clinics" className={link}>{t('navForClinics')}</NavLink>
        </nav>
        <div className="hidden items-center gap-3 lg:flex">
          {langSwitch}
          {account}
        </div>
        <button className="rounded-lg p-2 text-navy lg:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>
      {open && (
        <div className="border-t border-slate-100 bg-white px-4 py-3 lg:hidden" onClick={() => setOpen(false)}>
          <nav className="flex flex-col">
            <NavLink to="/" end className={link}>{t('navHome')}</NavLink>
            <NavLink to="/clinics" className={link}>{t('navClinics')}</NavLink>
            <NavLink to="/for-clinics" className={link}>{t('navForClinics')}</NavLink>
          </nav>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div onClick={(e) => e.stopPropagation()}>{langSwitch}</div>
            {account}
          </div>
        </div>
      )}
    </header>
  )
}
