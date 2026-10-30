import Logo from './Logo.jsx'
import { useLang } from '../i18n.jsx'

export default function Footer() {
  const { t } = useLang()
  return (
    <footer className="mt-16 bg-navy text-white">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 md:grid-cols-2">
        <div>
          <Logo light />
          <p className="mt-4 max-w-sm text-sm text-white/70">{t('footerText')}</p>
        </div>
        <div className="text-sm text-white/70 md:text-right">
          <p>Астана, Қазақстан</p>
          <p className="mt-2">{t('footerDisclaimer')}</p>
          <p className="mt-4 text-white/40">© 2026 MediCenter</p>
        </div>
      </div>
    </footer>
  )
}
