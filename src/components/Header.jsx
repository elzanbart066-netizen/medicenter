import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import Logo from './Logo.jsx'
import { useLang } from '../i18n.jsx'

export default function Header() {
  const { lang, setLang, t } = useLang()
  const [open, setOpen] = useState(false)

  const link = ({ isActive }) =>
    `rounded-lg px-3 py-2 text-sm font-semibold transition ${isActive ? 'text-brand' : 'text-slate-600 hover:text-navy'}`

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

  return (
    <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex">
          <NavLink to="/" end className={link}>{t('navHome')}</NavLink>
          <NavLink to="/clinics" className={link}>{t('navClinics')}</NavLink>
          <span className="cursor-not-allowed px-3 py-2 text-sm font-semibold text-slate-400">{t('navForClinics')}</span>
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          {langSwitch}
          <button className="btn-ghost py-2 text-sm">{t('signIn')}</button>
        </div>
        <button
          className="rounded-lg p-2 text-navy md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>
      {open && (
        <div className="border-t border-slate-100 bg-white px-4 py-3 md:hidden" onClick={() => setOpen(false)}>
          <nav className="flex flex-col">
            <NavLink to="/" end className={link}>{t('navHome')}</NavLink>
            <NavLink to="/clinics" className={link}>{t('navClinics')}</NavLink>
          </nav>
          <div className="mt-3 flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
            {langSwitch}
            <button className="btn-ghost py-2 text-sm">{t('signIn')}</button>
          </div>
        </div>
      )}
    </header>
  )
}
